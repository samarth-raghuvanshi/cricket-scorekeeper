import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/navbar";
import { createMatch, type Team } from "../lib/match";

type Step = "names" | "toss" | "players" | "review";
type TossDecision = "bat" | "bowl";

const formatPlayerName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function CreateMatch() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([
    { name: "", players: [] },
    { name: "", players: [] },
  ]);
  const [overs, setOvers] = useState("20");
  const [step, setStep] = useState<Step>("names");
  const [tossWinner, setTossWinner] = useState<number | null>(null);
  const [tossDecision, setTossDecision] = useState<TossDecision | null>(null);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [playerInput, setPlayerInput] = useState("");

  const oversValue = Number(overs);
  const canProceedToPlayers =
    teams[0].name.trim() &&
    teams[1].name.trim() &&
    Number.isInteger(oversValue) &&
    oversValue > 0 &&
    oversValue <= 50;

  const startPlayerEntry = () => {
    if (!canProceedToPlayers) return;
    setStep("players");
    setCurrentTeamIndex(0);
  };

  const simulateToss = () => {
    setTossWinner(Math.random() < 0.5 ? 0 : 1);
    setTossDecision(null);
  };

  const addPlayer = () => {
    const name = formatPlayerName(playerInput);
    if (!name) return;
    if (teams[currentTeamIndex].players.length >= 11) return;

    setTeams((prev) =>
      prev.map((team, i) =>
        i === currentTeamIndex
          ? { ...team, players: [...team.players, name] }
          : team,
      ),
    );
    setPlayerInput("");
  };

  const removePlayer = (playerIndex: number) => {
    setTeams((prev) =>
      prev.map((team, i) =>
        i === currentTeamIndex
          ? {
              ...team,
              players: team.players.filter((_, j) => j !== playerIndex),
            }
          : team,
      ),
    );
  };

  const finishTeam = () => {
    if (currentTeamIndex === 0) {
      setCurrentTeamIndex(1);
      setPlayerInput("");
    } else {
      setStep("toss");
    }
  };

  const startMatch = async () => {
    if (tossWinner === null || tossDecision === null) return;
    const battingTeamIndex =
      tossDecision === "bat" ? tossWinner : 1 - tossWinner;
    const bowlingTeamIndex = 1 - battingTeamIndex;
    const match = await createMatch({
      teams,
      overs: oversValue,
      battingTeamIndex,
      activeBatterIndex: 0,
      batters: teams[battingTeamIndex].players.map((name) => ({
        name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
      })),
      score: 0,
      wickets: 0,
      balls: 0,
      deliveries: [],
      completedInnings: [],
      currentOverBowler: null,
      bowlers: teams[bowlingTeamIndex].players.map((name) => ({
        name,
        balls: 0,
        runs: 0,
        wickets: 0,
      })),
      status: "active",
      result: null,
    });
    navigate(`/match/${match.id}`, {
      state: { createdScorerKey: match.scorerKey },
    });
  };

  return (
    <div className="min-h-screen bg-[#1e1b1c]">
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-center font-scorekeeper py-3 text-lg text-[#ef9a9a]">
          Set up a game
        </p>
        <h1 className="mb-8 text-center text-4xl font-scorekeeper text-white">
          Create Match
        </h1>

        {step === "names" && (
          <div className="rounded-lg border border-white/15 bg-white/[0.04] p-6 font-scorekeeper text-center shadow-xl sm:p-8">
            <h2 className="mb-6 text-3xl text-white">Enter Team Names</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={teams[0].name}
                onChange={(e) =>
                  setTeams((prev) => [
                    { ...prev[0], name: e.target.value },
                    prev[1],
                  ])
                }
                placeholder="Team 1 name"
                className="w-full rounded-md border-2 border-white bg-transparent px-4 py-3 text-center text-xl text-white placeholder-white/60 focus:border-[#D32F2F] focus:outline-none"
              />
              <input
                type="text"
                value={teams[1].name}
                onChange={(e) =>
                  setTeams((prev) => [
                    prev[0],
                    { ...prev[1], name: e.target.value },
                  ])
                }
                placeholder="Team 2 name"
                className="w-full rounded-md border-2 border-white bg-transparent px-4 py-3 text-center text-xl text-white placeholder-white/60 focus:border-[#D32F2F] focus:outline-none"
              />
              <label className="block text-center text-sm text-white/70" htmlFor="overs">
                Match length
              </label>
              <div className="flex items-center mx-auto rounded-md border-2 w-5/12 border-white px-4 focus-within:border-[#D32F2F]">
                <input
                  id="overs"
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={overs}
                  onChange={(event) => setOvers(event.target.value)}
                  aria-label="Number of overs"
                  className="w-full bg-transparent py-3 text-center text-xl text-white outline-none"
                />
                <span className="text-xl text-white/75">overs</span>
              </div>
            </div>
            <button
              type="button"
              onClick={startPlayerEntry}
              disabled={!canProceedToPlayers}
              className="mt-8 rounded-md bg-[#D32F2F] px-8 py-3 text-xl font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-white/20"
            >
              Add Players
            </button>
          </div>
        )}

        {step === "toss" && (
          <div className="rounded-lg border border-white/15 bg-white/[0.04] p-6 text-center shadow-xl sm:p-8">
            <h2 className="mb-2 font-scorekeeper text-3xl text-white">
              Toss
            </h2>
            <p className="mb-6 text-white/70">
              Select the toss winner, or simulate a coin toss.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {teams.map((team, index) => (
                <button
                  key={team.name}
                  type="button"
                  onClick={() => {
                    setTossWinner(index);
                    setTossDecision(null);
                  }}
                  className={`rounded-md border-2 px-4 py-3 text-white text-lg font-semibold ${tossWinner === index ? "border-[#D32F2F] bg-[#D32F2F]" : "border-white/30 bg-white/[0.04] hover:border-white"}`}
                >
                  {team.name} won the toss
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={simulateToss}
              className="mt-4 rounded-md border border-[#ef9a9a] px-5 py-3 font-semibold text-white hover:bg-[#7d2424]/40"
            >
              Simulate coin toss
            </button>
            {tossWinner !== null && (
              <div className="mt-7 border-t border-white/10 pt-6">
                <p className="mb-3 text-white/70">
                  {teams[tossWinner].name} chooses to:
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTossDecision("bat");
                      setStep("review");
                    }}
                    className="rounded-md text-white bg-[#D32F2F] px-6 py-3 font-semibold"
                  >
                    Bat first
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTossDecision("bowl");
                      setStep("review");
                    }}
                    className="rounded-md text-white bg-[#D32F2F] px-6 py-3 font-semibold"
                  >
                    Bowl first
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "players" && (
          <div className="rounded-lg border border-white/15 bg-white/[0.04] p-6 font-scorekeeper text-center shadow-xl sm:p-8">
            <h2 className="mb-2 text-3xl text-white">
              {teams[currentTeamIndex].name}
            </h2>
            <p className="mb-6 text-lg text-white/70">
              Players {teams[currentTeamIndex].players.length}/11 (casual teams
              can be any size)
            </p>

            <div className="mb-6 flex items-center justify-center gap-2">
              <input
                type="text"
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addPlayer();
                }}
                placeholder="Player name"
                className="w-full max-w-md rounded-md border-2 border-white bg-transparent px-4 py-3 text-center text-xl text-white placeholder-white/60 focus:border-[#D32F2F] focus:outline-none"
              />
              <button
                type="button"
                onClick={addPlayer}
                disabled={
                  !playerInput.trim() ||
                  teams[currentTeamIndex].players.length >= 11
                }
                className="rounded-md bg-[#D32F2F] px-6 py-3 text-xl font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-white/20"
              >
                Add
              </button>
            </div>

            {teams[currentTeamIndex].players.length > 0 && (
              <ul className="mb-6 space-y-2">
                {teams[currentTeamIndex].players.map((player, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between rounded-md border border-white/30 px-4 py-2 text-xl text-white"
                  >
                    <span>
                      {index + 1}. {player}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      className="text-sm text-[#D32F2F] hover:text-red-400"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={finishTeam}
              disabled={teams[currentTeamIndex].players.length === 0}
              className="rounded-md bg-[#D32F2F] px-8 py-3 text-xl font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-white/20"
            >
              {currentTeamIndex === 0
                ? `Next: ${teams[1].name || "Team 2"}`
                : "Proceed to Toss"}
            </button>
          </div>
        )}

        {step === "review" && (
          <div className="rounded-lg border border-white/15 bg-white/[0.04] p-6 font-scorekeeper text-center shadow-xl sm:p-8">
            <h2 className="mb-6 text-3xl text-white">Review Teams</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {teams.map((team, index) => (
                <div
                  key={index}
                  className="rounded-md border border-white/30 p-4"
                >
                  <h3 className="mb-3 text-2xl text-white">{team.name}</h3>
                  <ul className="space-y-1">
                    {team.players.map((player, i) => (
                      <li key={i} className="text-lg text-white/80">
                        {i + 1}. {player}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={startMatch}
              className="mt-8 rounded-md bg-[#D32F2F] px-8 py-3 text-xl font-semibold text-white transition-colors hover:bg-red-700"
            >
              Start Match
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default CreateMatch;
