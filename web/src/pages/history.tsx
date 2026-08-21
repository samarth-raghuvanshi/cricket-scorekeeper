import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/navbar";
import { deleteMatch, getMatchHistory, type Match } from "../lib/match";

function History() {
  const [matches, setMatches] = useState<Match[]>([]);
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
  return (
    <div className="min-h-screen bg-[#1e1b1c] text-white">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-center font-scorekeeper text-4xl">Matches</h1>
        <div className="mx-auto mt-7 flex max-w-md rounded-full bg-white/10 p-1">
          {(["active", "completed"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`flex-1 rounded-full py-2 text-sm font-semibold capitalize ${tab === item ? "bg-[#c93434] shadow" : "text-white/60"}`}
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
                className="rounded-2xl border border-white/15 bg-white/[0.04] transition-colors hover:bg-white/[0.07]"
              >
                <Link to={`/match/${match.id}`} className="block p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold hover:text-[#ffaaaa]">
                      {match.teams[0].name} vs {match.teams[1].name}
                    </h2>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${match.status === "active" ? "bg-emerald-700/70" : "bg-[#9f2929]"}`}
                    >
                      {match.status === "active" ? "LIVE" : "COMPLETE"}
                    </span>
                  </div>
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
