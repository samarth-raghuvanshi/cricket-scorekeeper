import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import NavBar from "../components/navbar";
import PlayerSelector from "../components/PlayerSelector";
import ScoreBoard from "../components/ScoreBoard";
import ScoreProgressChart from "../components/ScoreProgressChart";
import Scorecard from "../components/Scorecard";
import ScoringControls from "../components/ScoringControls";
import {
  getMatch,
  matchEventsUrl,
  updateMatch,
  verifyScorerKey,
  type Match,
} from "../lib/match";
import {
  applyDelivery,
  makeBatters,
  makeBowlers,
  type ScoringEvent,
} from "../lib/scoring";

function MatchPage() {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"viewer" | "scorer">("viewer");
  const [scorecardTeamIndex, setScorecardTeamIndex] = useState(0);
  const [keyPrompt, setKeyPrompt] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState("");
  const [scorerKey, setScorerKey] = useState("");
  const [graphExpanded, setGraphExpanded] = useState(false);
  const [selectionPrompt, setSelectionPrompt] = useState<
    "batter" | "bowler" | null
  >(null);
  const [noballPrompt, setNoballPrompt] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const battingTeamIndexRef = useRef<number | null>(null);
  const deliveryHistoryRef = useRef<Match[]>([]);
  const createdScorerKey = (
    location.state as { createdScorerKey?: string } | null
  )?.createdScorerKey;

  const load = useCallback(async () => {
    if (!matchId) return;
    try {
      const latest = await getMatch(matchId);
      if (
        battingTeamIndexRef.current === null ||
        battingTeamIndexRef.current !== latest.battingTeamIndex
      ) {
        setScorecardTeamIndex(latest.battingTeamIndex);
      }
      battingTeamIndexRef.current = latest.battingTeamIndex;
      setMatch(latest);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load match");
    }
  }, [matchId]);

  useEffect(() => {
    const startup = window.setTimeout(() => void load(), 0);
    if (mode !== "viewer" || !matchId) {
      return () => window.clearTimeout(startup);
    }
    const events = new EventSource(matchEventsUrl(matchId));
    events.onmessage = (event) => {
      try {
        const latest = JSON.parse(event.data) as Match;
        if (
          battingTeamIndexRef.current === null ||
          battingTeamIndexRef.current !== latest.battingTeamIndex
        ) {
          setScorecardTeamIndex(latest.battingTeamIndex);
        }
        battingTeamIndexRef.current = latest.battingTeamIndex;
        setMatch(latest);
        setError("");
      } catch {
        setError("Could not read live score update");
      }
    };
    return () => {
      window.clearTimeout(startup);
      events.close();
    };
  }, [load, matchId, mode]);

  const save = async (next: Match) => {
    try {
      const updated = await updateMatch(next, scorerKey);
      battingTeamIndexRef.current = updated.battingTeamIndex;
      setMatch(updated);
      return updated;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save score");
      return null;
    }
  };

  const saveDelivery = async (previous: Match, next: Match) => {
    const updated = await save(next);
    if (updated) {
      deliveryHistoryRef.current.push(previous);
      setCanUndo(true);
    }
    return updated;
  };

  if (error && !match)
    return (
      <div className="min-h-screen bg-[#1b1516]">
        <NavBar />
        <p className="pt-24 text-center text-white">{error}</p>
      </div>
    );
  if (!match)
    return (
      <div className="min-h-screen bg-[#1b1516]">
        <NavBar />
        <p className="pt-24 text-center text-white">Loading match…</p>
      </div>
    );

  const battingTeam = match.teams[match.battingTeamIndex];
  const activeBatter = match.batters[match.activeBatterIndex]?.isOut
    ? undefined
    : match.batters[match.activeBatterIndex];
  const isOverStart = match.balls % 6 === 0;
  const controlsDisabled =
    !activeBatter ||
    !match.currentOverBowler ||
    selectionPrompt !== null ||
    noballPrompt;

  const becomeScorer = async () => {
    const enteredKey = keyInput.trim();
    if (!enteredKey) {
      setKeyError("Enter the scorer key to take control.");
      return;
    }
    try {
      await verifyScorerKey(match.id ?? "", enteredKey);
      setScorerKey(enteredKey);
      setKeyPrompt(false);
      setKeyError("");
      setMode("scorer");
      if (isOverStart) setSelectionPrompt("bowler");
      else if (!activeBatter) setSelectionPrompt("batter");
    } catch (cause) {
      setKeyError(
        cause instanceof Error ? cause.message : "That scorer key is not valid",
      );
    }
  };

  const finishDelivery = (event: ScoringEvent, runs = 0) => {
    const nextMatch = applyDelivery(match, event, runs);
    const firstInnings = match.completedInnings[0];
    if (firstInnings && nextMatch.score > firstInnings.score) {
      void saveDelivery(match, {
        ...nextMatch,
        status: "completed",
        result: `${battingTeam.name} won by ${match.batters.length - nextMatch.wickets} wicket${match.batters.length - nextMatch.wickets === 1 ? "" : "s"}`,
      });
      return;
    }
    const allOut =
      event === "wicket" && nextMatch.batters.every((batter) => batter.isOut);
    if (allOut) {
      const finished = {
        teamName: battingTeam.name,
        battingTeamIndex: match.battingTeamIndex,
        score: nextMatch.score,
        wickets: nextMatch.wickets,
        balls: nextMatch.balls,
        batters: nextMatch.batters,
        bowlers: nextMatch.bowlers,
        deliveries: nextMatch.deliveries,
      };
      if (firstInnings) {
        const margin = firstInnings.score - nextMatch.score;
        void saveDelivery(match, {
          ...nextMatch,
          completedInnings: [...match.completedInnings, finished],
          status: "completed",
          result:
            margin === 0
              ? "Match tied"
              : `${firstInnings.teamName} won by ${margin} run${margin === 1 ? "" : "s"}`,
        });
        return;
      }
      const nextIndex = 1 - match.battingTeamIndex;
      setScorecardTeamIndex(nextIndex);
      void saveDelivery(match, {
        ...match,
        completedInnings: [finished],
        battingTeamIndex: nextIndex,
        batters: makeBatters(match.teams[nextIndex].players),
        bowlers: makeBowlers(battingTeam.players),
        activeBatterIndex: 0,
        score: 0,
        wickets: 0,
        balls: 0,
        deliveries: [],
        currentOverBowler: null,
      }).then((updated) => {
        if (updated) setSelectionPrompt("bowler");
      });
      return;
    }
    void saveDelivery(match, nextMatch).then((updated) => {
      if (updated)
        setSelectionPrompt(
          event === "wicket"
            ? "batter"
            : event === "runs" && updated.balls % 6 === 0
              ? "bowler"
              : null,
        );
    });
  };

  const undoLastDelivery = () => {
    const previous = deliveryHistoryRef.current.at(-1);
    if (!previous) return;
    void save(previous).then((updated) => {
      if (updated) {
        deliveryHistoryRef.current.pop();
        setCanUndo(deliveryHistoryRef.current.length > 0);
        setSelectionPrompt(null);
        setNoballPrompt(false);
        setScorecardTeamIndex(updated.battingTeamIndex);
      }
    });
  };

  const recordDelivery = (event: ScoringEvent, runs = 0) => {
    if (event === "noball") {
      setNoballPrompt(true);
      return;
    }
    finishDelivery(event, runs);
  };
  const chooseBatter = (index: number) =>
    void save({ ...match, activeBatterIndex: index }).then((updated) => {
      if (updated)
        setSelectionPrompt(updated.balls % 6 === 0 ? "bowler" : null);
    });
  const chooseBowler = (name: string) =>
    void save({ ...match, currentOverBowler: name }).then((updated) => {
      if (updated)
        setSelectionPrompt(
          !updated.batters[updated.activeBatterIndex] ||
            updated.batters[updated.activeBatterIndex].isOut
            ? "batter"
            : null,
        );
    });

  return (
    <div className="min-h-screen bg-[#1e1b1c] text-white">
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="text-center">
          <p className="font-scorekeeper text-xl text-[#ef9a9a]">
            {match.status === "completed" ? "Match complete" : "Live match"}
          </p>
          <h1 className="mt-1 font-scorekeeper text-4xl">
            {match.teams[0].name} <span className="text-white/35">vs</span>{" "}
            {match.teams[1].name}
          </h1>
          {match.result && (
            <p className="mx-auto mt-4 max-w-xl rounded-full bg-[#b73434] px-5 py-3 text-lg font-semibold shadow-lg">
              {match.result}
            </p>
          )}
        </div>
        {createdScorerKey && (
          <p className="mx-auto mt-5 max-w-xl rounded-lg border border-[#ef9a9a]/40 bg-[#6d1d1d]/40 p-4 text-center text-sm">
            Your scorer key:{" "}
            <strong className="ml-1 tracking-widest text-[#ffb4b4]">
              {createdScorerKey}
            </strong>
            . Share it only with scorers.
          </p>
        )}
        <div className="mt-8 grid items-start gap-4 md:grid-cols-[1fr_auto]">
          <ScoreBoard match={match} />
          <button
            onClick={() => setGraphExpanded(true)}
            className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-left transition-colors hover:bg-white/[0.08]"
            aria-label="Expand score progression graph"
          >
            <ScoreProgressChart match={match} />
          </button>
        </div>
        <Scorecard
          match={match}
          selectedTeamIndex={scorecardTeamIndex}
          onSelectTeam={setScorecardTeamIndex}
        />
        {mode === "viewer" && match.status === "active" && (
          <div className="mt-7 text-center">
            <p className="text-white/60">
              Viewing live score — refreshes automatically.
            </p>
            <button
              onClick={() => {
                setKeyError("");
                setKeyPrompt(true);
              }}
              className="mt-4 rounded-full border border-[#e45a5a] px-5 py-2 text-sm text-[#ffaeae] hover:bg-[#7d2424]/40"
            >
              Become scorer
            </button>
          </div>
        )}
        {mode === "scorer" && match.status === "active" && (
          <ScoringControls
            activeBatterName={activeBatter?.name}
            disabled={controlsDisabled}
            undoDisabled={!canUndo}
            onScore={recordDelivery}
            onUndo={undoLastDelivery}
          />
        )}
        {error && <p className="mt-4 text-center text-red-300">{error}</p>}
        <button
          onClick={() => navigate("/create-match")}
          className="mx-auto mt-10 block text-sm text-white/55 underline hover:text-white"
        >
          Create another match
        </button>
        {keyPrompt && (
          <div className="fixed inset-0 z-20 grid place-items-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#2a1b1d] p-6 shadow-2xl">
              <h2 className="font-scorekeeper text-3xl">Become scorer</h2>
              <p className="mt-2 text-sm text-white/65">
                Enter the scorer key given when this match was created.
              </p>
              <input
                autoFocus
                value={keyInput}
                onChange={(event) => {
                  setKeyInput(
                    event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 4),
                  );
                  setKeyError("");
                }}
                maxLength={4}
                inputMode="text"
                autoComplete="off"
                className="mt-5 w-full rounded-lg border border-white/20 bg-black/20 px-4 py-3 uppercase tracking-widest text-white outline-none focus:border-[#e85b5b]"
                placeholder="SCORER KEY"
              />
              {keyError && (
                <p className="mt-2 text-sm text-red-300">{keyError}</p>
              )}
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setKeyPrompt(false)}
                  className="px-4 py-2 text-white/70"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void becomeScorer()}
                  className="rounded-lg bg-[#c93434] px-4 py-2 font-semibold"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
        {noballPrompt && (
          <div className="fixed inset-0 z-20 grid place-items-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#2a1b1d] p-6 shadow-2xl">
              <h2 className="font-scorekeeper text-3xl">No-ball runs</h2>
              <p className="mt-2 text-sm text-white/65">
                Choose the runs scored in addition to the no-ball.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[0, 1, 2, 3, 4, 6].map((runs) => (
                  <button
                    key={runs}
                    onClick={() => {
                      setNoballPrompt(false);
                      finishDelivery("noball", runs);
                    }}
                    className="h-11 rounded-full bg-white/10 font-bold hover:bg-[#c93434]"
                  >
                    {runs}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setNoballPrompt(false)}
                className="mt-4 w-full px-4 py-2 text-white/70"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {graphExpanded && (
          <div className="fixed inset-0 z-20 grid place-items-center bg-black/70 p-4">
            <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-[#2a1b1d] p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-scorekeeper text-3xl">Score progression</h2>
                <button
                  onClick={() => setGraphExpanded(false)}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
                >
                  Minimise graph
                </button>
              </div>
              <ScoreProgressChart match={match} expanded />
            </div>
          </div>
        )}
        {selectionPrompt && mode === "scorer" && (
          <PlayerSelector
            selection={selectionPrompt}
            match={match}
            onChooseBatter={chooseBatter}
            onChooseBowler={chooseBowler}
          />
        )}
      </main>
    </div>
  );
}

export default MatchPage;
