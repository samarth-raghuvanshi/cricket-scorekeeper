import { createServer } from "node:http";
import { createHash, randomInt } from "node:crypto";
import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const port = Number(process.env.PORT ?? 3002);
const adminKey = process.env.ADMIN_KEY ?? "change-me";
mkdirSync("data", { recursive: true });
const db = new DatabaseSync("data/scorekeeper.db");
db.exec(`CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  scorer_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`);
try {
  db.exec("ALTER TABLE matches ADD COLUMN scorer_key TEXT NOT NULL DEFAULT ''");
} catch {
  /* Existing databases already have the column. */
}
const deleteExpiredMatches = () =>
  db.exec("DELETE FROM matches WHERE created_at < datetime('now', '-7 days')");
deleteExpiredMatches();
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
const writeMatchEvent = (response, match) => {
  response.write(`data: ${JSON.stringify(match)}\n\n`);
};
const notifyMatchSubscribers = (matchId, match) => {
  for (const response of matchSubscribers.get(matchId) ?? []) {
    writeMatchEvent(response, match);
  }
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
  ...JSON.parse(row.state),
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
    if (request.method === "GET" && path === "/api/matches") {
      const rows = db
        .prepare("SELECT * FROM matches ORDER BY updated_at DESC")
        .all();
      return send(response, 200, rows.map(matchResponse));
    }
    if (request.method === "GET" && matchId && path.endsWith("/events")) {
      const row = db.prepare("SELECT * FROM matches WHERE id = ?").get(matchId);
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
    if (request.method === "POST" && path === "/api/matches") {
      const state = await readBody(request);
      const id = crypto.randomUUID();
      const scorerKey = createScorerKey();
      const now = new Date().toISOString();
      db.prepare(
        "INSERT INTO matches (id, state, scorer_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      ).run(id, JSON.stringify(state), hashScorerKey(scorerKey), now, now);
      return send(response, 201, {
        id,
        ...state,
        scorerKey,
        createdAt: now,
        updatedAt: now,
      });
    }
    if (
      request.method === "POST" &&
      matchId &&
      path.endsWith("/scorer-session")
    ) {
      const { scorerKey } = await readBody(request);
      const row = db
        .prepare("SELECT scorer_key FROM matches WHERE id = ?")
        .get(matchId);
      if (!row) return send(response, 404, { error: "Match not found" });
      if (!matchesScorerKey(scorerKey ?? "", row.scorer_key))
        return send(response, 403, { error: "That scorer key is not valid" });
      if (row.scorer_key === scorerKey.toUpperCase()) {
        db.prepare("UPDATE matches SET scorer_key = ? WHERE id = ?").run(
          hashScorerKey(scorerKey),
          matchId,
        );
      }
      return send(response, 200, { valid: true });
    }
    if (request.method === "GET" && matchId) {
      const row = db.prepare("SELECT * FROM matches WHERE id = ?").get(matchId);
      return row
        ? send(response, 200, matchResponse(row))
        : send(response, 404, { error: "Match not found" });
    }
    if (request.method === "PUT" && matchId) {
      const state = await readBody(request);
      const row = db
        .prepare("SELECT scorer_key FROM matches WHERE id = ?")
        .get(matchId);
      if (!row) return send(response, 404, { error: "Match not found" });
      if (!matchesScorerKey(request.headers["x-scorer-key"] ?? "", row.scorer_key))
        return send(response, 403, { error: "A valid scorer key is required" });
      const now = new Date().toISOString();
      const result = db
        .prepare("UPDATE matches SET state = ?, updated_at = ? WHERE id = ?")
        .run(JSON.stringify(state), now, matchId);
      if (!result.changes) return send(response, 404, { error: "Match not found" });
      const updatedMatch = {
            id: matchId,
            ...state,
            createdAt: row.created_at,
            updatedAt: now,
          };
      notifyMatchSubscribers(matchId, updatedMatch);
      return send(response, 200, updatedMatch);
    }
    if (request.method === "DELETE" && matchId) {
      if (request.headers["x-admin-key"] !== adminKey)
        return send(response, 403, { error: "A valid admin key is required" });
      const result = db
        .prepare("DELETE FROM matches WHERE id = ?")
        .run(matchId);
      return result.changes
        ? send(response, 204, {})
        : send(response, 404, { error: "Match not found" });
    }
    return send(response, 404, { error: "Route not found" });
  } catch (error) {
    return send(response, 400, {
      error: error instanceof Error ? error.message : "Request failed",
    });
  }
}).listen(port, () =>
  console.log(`Scorekeeper API listening on http://0.0.0.0:${port}`),
);
