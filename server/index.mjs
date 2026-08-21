import { createServer } from "node:http";
import { createHash, randomInt } from "node:crypto";
import pg from "pg";

const { Pool } = pg;

const port = Number(process.env.PORT ?? 3002);
const adminKey = process.env.ADMIN_KEY ?? "change-me";

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Initialize database schema
const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id UUID PRIMARY KEY,
        state JSONB NOT NULL,
        scorer_key VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_matches_updated_at ON matches(updated_at DESC);
    `);
    console.log("Database schema initialized");
  } finally {
    client.release();
  }
};

// Delete expired matches (older than 7 days)
const deleteExpiredMatches = async () => {
  try {
    await pool.query(
      "DELETE FROM matches WHERE created_at < NOW() - INTERVAL '7 days'"
    );
  } catch (error) {
    console.error("Error deleting expired matches:", error);
  }
};

// Run cleanup immediately and then every hour
await initializeDatabase();
await deleteExpiredMatches();
setInterval(deleteExpiredMatches, 60 * 60 * 1000);

const scorerAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const createScorerKey = () =>
  Array.from({ length: 4 }, () => scorerAlphabet[randomInt(scorerAlphabet.length)]).join("");
const hashScorerKey = (key) =>
  createHash("sha256").update(key).digest("hex");
const matchesScorerKey = (input, stored) =>
  /^[A-Z0-9]{4}$/i.test(input) &&
  (hashScorerKey(input.toUpperCase()) === stored || input.toUpperCase() === stored);

const matchSubscribers = new Map();
const historySubscribers = new Set();

const writeMatchEvent = (response, match) => {
  response.write(`data: ${JSON.stringify(match)}\n\n`);
};

const notifyMatchSubscribers = (matchId, match) => {
  for (const response of matchSubscribers.get(matchId) ?? []) {
    writeMatchEvent(response, match);
  }
};

const notifyHistorySubscribers = (match) => {
  for (const response of historySubscribers) writeMatchEvent(response, match);
};

const send = (response, status, body) =>
  response
    .writeHead(status, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Scorer-Key, X-Admin-Key",
    })
    .end(status === 204 ? undefined : JSON.stringify(body));

const readBody = (request) =>
  new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", reject);
  });

const matchResponse = (row) => ({
  id: row.id,
  ...row.state,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

createServer(async (request, response) => {
  if (request.method === "OPTIONS") return send(response, 204, {});

  const path = new URL(request.url, `http://${request.headers.host}`).pathname;
  const matchId = path.match(
    /^\/api\/matches\/([\w-]+)(?:\/(?:scorer-session|events))?$/,
  )?.[1];

  try {
    // GET /api/matches - List all matches
    if (request.method === "GET" && path === "/api/matches") {
      const result = await pool.query(
        "SELECT id, state, created_at, updated_at FROM matches ORDER BY updated_at DESC"
      );
      return send(response, 200, result.rows.map(matchResponse));
    }

    // GET /api/matches/events - Server-sent events for history
    if (request.method === "GET" && path === "/api/matches/events") {
      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });
      response.write(": connected\n\n");
      historySubscribers.add(response);
      const keepAlive = setInterval(() => response.write(": keep-alive\n\n"), 30000);
      const cleanup = () => {
        clearInterval(keepAlive);
        historySubscribers.delete(response);
      };
      request.on("close", cleanup);
      response.on("close", cleanup);
      return;
    }

    // GET /api/matches/:id/events - Server-sent events for specific match
    if (request.method === "GET" && matchId && path.endsWith("/events")) {
      const result = await pool.query(
        "SELECT id, state, created_at, updated_at FROM matches WHERE id = $1",
        [matchId]
      );
      const row = result.rows[0];
      if (!row) return send(response, 404, { error: "Match not found" });

      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });
      response.write(": connected\n\n");
      writeMatchEvent(response, matchResponse(row));
      const subscribers = matchSubscribers.get(matchId) ?? new Set();
      subscribers.add(response);
      matchSubscribers.set(matchId, subscribers);
      const keepAlive = setInterval(() => response.write(": keep-alive\n\n"), 30000);
      const cleanup = () => {
        clearInterval(keepAlive);
        subscribers.delete(response);
        if (!subscribers.size) matchSubscribers.delete(matchId);
      };
      request.on("close", cleanup);
      response.on("close", cleanup);
      return;
    }

    // POST /api/matches - Create a new match
    if (request.method === "POST" && path === "/api/matches") {
      const state = await readBody(request);
      const id = crypto.randomUUID();
      const scorerKey = createScorerKey();
      const now = new Date().toISOString();

      await pool.query(
        "INSERT INTO matches (id, state, scorer_key, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
        [id, JSON.stringify(state), hashScorerKey(scorerKey), now, now]
      );

      const createdMatch = {
        id,
        ...state,
        scorerKey,
        createdAt: now,
        updatedAt: now,
      };
      notifyHistorySubscribers(createdMatch);
      return send(response, 201, createdMatch);
    }

    // POST /api/matches/:id/scorer-session - Validate scorer key
    if (
      request.method === "POST" &&
      matchId &&
      path.endsWith("/scorer-session")
    ) {
      const { scorerKey } = await readBody(request);
      const result = await pool.query(
        "SELECT scorer_key FROM matches WHERE id = $1",
        [matchId]
      );
      const row = result.rows[0];

      if (!row) return send(response, 404, { error: "Match not found" });
      if (!matchesScorerKey(scorerKey ?? "", row.scorer_key))
        return send(response, 403, { error: "That scorer key is not valid" });

      if (row.scorer_key === scorerKey.toUpperCase()) {
        await pool.query(
          "UPDATE matches SET scorer_key = $1 WHERE id = $2",
          [hashScorerKey(scorerKey), matchId]
        );
      }
      return send(response, 200, { valid: true });
    }

    // GET /api/matches/:id - Get a specific match
    if (request.method === "GET" && matchId) {
      const result = await pool.query(
        "SELECT id, state, created_at, updated_at FROM matches WHERE id = $1",
        [matchId]
      );
      const row = result.rows[0];
      return row
        ? send(response, 200, matchResponse(row))
        : send(response, 404, { error: "Match not found" });
    }

    // PUT /api/matches/:id - Update a match
    if (request.method === "PUT" && matchId) {
      const state = await readBody(request);
      const result = await pool.query(
        "SELECT scorer_key FROM matches WHERE id = $1",
        [matchId]
      );
      const row = result.rows[0];

      if (!row) return send(response, 404, { error: "Match not found" });
      if (!matchesScorerKey(request.headers["x-scorer-key"] ?? "", row.scorer_key))
        return send(response, 403, { error: "A valid scorer key is required" });

      const now = new Date().toISOString();
      const updateResult = await pool.query(
        "UPDATE matches SET state = $1, updated_at = $2 WHERE id = $3 RETURNING *",
        [JSON.stringify(state), now, matchId]
      );

      if (!updateResult.rows.length)
        return send(response, 404, { error: "Match not found" });

      const updatedRow = updateResult.rows[0];
      const updatedMatch = matchResponse(updatedRow);

      notifyMatchSubscribers(matchId, updatedMatch);
      notifyHistorySubscribers(updatedMatch);
      return send(response, 200, updatedMatch);
    }

    // DELETE /api/matches/:id - Delete a match (admin only)
    if (request.method === "DELETE" && matchId) {
      if (request.headers["x-admin-key"] !== adminKey)
        return send(response, 403, { error: "A valid admin key is required" });

      const result = await pool.query(
        "DELETE FROM matches WHERE id = $1",
        [matchId]
      );
      return result.rowCount > 0
        ? send(response, 204, {})
        : send(response, 404, { error: "Match not found" });
    }

    return send(response, 404, { error: "Route not found" });
  } catch (error) {
    console.error("Server error:", error);
    return send(response, 400, {
      error: error instanceof Error ? error.message : "Request failed",
    });
  }
}).listen(port, () =>
  console.log(`Scorekeeper API listening on http://0.0.0.0:${port}`),
);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await pool.end();
  process.exit(0);
});
