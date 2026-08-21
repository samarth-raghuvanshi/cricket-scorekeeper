import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/navbar";
import {
  deleteMatch,
  getMatchHistory,
  matchHistoryEventsUrl,
  type Match,
} from "../lib/match";

function History() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [copiedMatchId, setCopiedMatchId] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [adminKey, setAdminKey] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const load = () =>
    void getMatchHistory()
      .then(setMatches)
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error ? cause.message : "Could not load matches",
        ),
      );
  useEffect(() => {
    load();
    const events = new EventSource(matchHistoryEventsUrl());
    events.onmessage = (event) => {
      try {
        const createdMatch = JSON.parse(event.data) as Match;
        setMatches((current) => [
          createdMatch,
          ...current.filter((match) => match.id !== createdMatch.id),
        ]);
      } catch {
        setError("Could not read match update");
      }
    };
    events.onerror = () => events.close();
    return () => events.close();
  }, []);
  const remove = async (match: Match) => {
    if (
      !match.id ||
      !adminKey ||
      !window.confirm(
        `Delete ${match.teams[0].name} vs ${match.teams[1].name}?`,
      )
    )
      return;
    try {
      await deleteMatch(match.id, adminKey);
      load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not delete match",
      );
    }
  };
  const shown = matches.filter((match) => match.status === tab);
  const formatMatchDate = (match: Match) =>
    match.createdAt
      ? new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(match.createdAt))
      : "Date unavailable";
  const logIn = () => {
    const key = window.prompt("Enter admin key");
    if (key) {
      setAdminKey(key);
      setIsAdmin(true);
    }
  };
  const shareMatch = async (match: Match) => {
    if (!match.id) return;
    const matchUrl = `${window.location.origin}/match/${match.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(matchUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = matchUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        if (!document.execCommand("copy")) throw new Error("Copy failed");
        textArea.remove();
      }
      setCopiedMatchId(match.id);
      window.setTimeout(() => setCopiedMatchId(null), 2000);
    } catch {
      setError("Could not copy match link");
    }
  };
  return (
    <div className="min-h-screen bg-[#1e1b1c] text-white">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-center font-scorekeeper py-3 text-lg text-[#ef9a9a]">
          Watch live, or browse completed games
        </p>
        <h1 className="text-center font-scorekeeper text-4xl">Matches</h1>
        <div className="mx-auto mt-7 flex max-w-md rounded-lg bg-white/10 p-1">
          {(["active", "completed"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize ${tab === item ? "bg-[#c93434] shadow" : "text-white/60"}`}
            >
              {item === "active" ? "Live now" : "Completed"}
            </button>
          ))}
        </div>
        {error && <p className="mt-5 text-center text-red-300">{error}</p>}
        <div className="mt-6 space-y-3">
          {shown.length ? (
            shown.map((match) => (
              <article
                key={match.id}
                className="rounded-lg border border-white/15 bg-white/[0.04] transition-colors hover:bg-white/[0.07]"
              >
                <div className="grid grid-cols-[1fr_auto] items-start gap-x-3 px-5 pt-5">
                  <Link
                    to={`/match/${match.id}`}
                    className="min-w-0 text-xl font-semibold hover:text-[#ffaaaa]"
                  >
                    <span className="block md:inline">{match.teams[0].name}</span>
                    <span className="block md:inline"> vs </span>
                    <span className="block md:inline">{match.teams[1].name}</span>
                  </Link>
                  <div className="col-start-2 row-start-1 flex flex-col items-end gap-1">
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${match.status === "active" ? "bg-emerald-700/70" : "bg-[#9f2929]"}`}
                    >
                      {match.status === "active" ? "LIVE" : "COMPLETE"}
                    </span>
                    <button
                      type="button"
                      onClick={() => void shareMatch(match)}
                      className="shrink-0 px-1 text-xs text-white/45 transition-colors hover:text-white/80"
                      aria-label={`Copy link to ${match.teams[0].name} vs ${match.teams[1].name}`}
                      title="Copy match link"
                    >
                      {copiedMatchId === match.id ? "Copied" : "Share"}
                    </button>
                  </div>
                </div>
                <Link to={`/match/${match.id}`} className="block px-5 pb-5 pt-3">
                  <p className="mt-3 text-white/65">
                    {match.result ??
                      `${match.teams[match.battingTeamIndex].name} batting · ${match.score}/${match.wickets}`}
                  </p>
                  <time
                    className="mt-2 block text-sm text-white/45"
                    dateTime={match.createdAt}
                  >
                    {formatMatchDate(match)}
                  </time>
                </Link>
                {isAdmin && (
                  <div className="border-t border-white/10 px-5 py-3 text-right">
                    <button
                      onClick={() => void remove(match)}
                      className="text-sm text-red-300 hover:text-red-100"
                    >
                      Delete match
                    </button>
                  </div>
                )}
              </article>
            ))
          ) : (
            <p className="py-10 text-center text-white/55">
              No {tab === "active" ? "live" : "completed"} matches.
            </p>
          )}
        </div>
        <div className="fixed bottom-5 right-5 z-10">
          {isAdmin ? (
            <button
              onClick={() => {
                setIsAdmin(false);
                setAdminKey("");
              }}
              className="text-xs text-white/35 hover:text-white/70"
            >
              Exit admin mode
            </button>
          ) : (
            <button
              onClick={logIn}
              className="text-xs text-white/35 hover:text-white/70"
            >
              Admin login
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
export default History;
