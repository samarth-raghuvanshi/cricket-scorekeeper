import type { Match } from "../lib/match";

type Selection = "batter" | "bowler";

function PlayerSelector({
  selection,
  match,
  onChooseBatter,
  onChooseBowler,
}: {
  selection: Selection;
  match: Match;
  onChooseBatter: (index: number) => void;
  onChooseBowler: (name: string) => void;
}) {
  const bowlingTeam = match.teams[1 - match.battingTeamIndex];

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#ed7777]/40 bg-[#2a1b1d] p-6 shadow-2xl">
        <p className="text-sm uppercase tracking-widest text-[#ff9b9b]">
          {selection === "bowler" ? "New over" : "Wicket fallen"}
        </p>
        <h2 className="mt-1 font-scorekeeper text-3xl">
          Choose next {selection}
        </h2>
        <select
          autoFocus
          defaultValue=""
          onChange={(event) =>
            selection === "bowler"
              ? onChooseBowler(event.target.value)
              : onChooseBatter(Number(event.target.value))
          }
          className="mt-5 w-full rounded-lg border border-white/20 bg-black/20 px-4 py-3 text-white outline-none"
        >
          <option value="" disabled>
            Select {selection}
          </option>
          {selection === "bowler"
            ? bowlingTeam.players.map((player, index) => (
                <option key={`${player}-${index}`} value={player}>
                  {player}
                </option>
              ))
            : match.batters.map(
                (batter, index) =>
                  !batter.isOut && (
                    <option key={`${batter.name}-${index}`} value={index}>
                      {batter.name}
                    </option>
                  ),
              )}
        </select>
      </div>
    </div>
  );
}

export default PlayerSelector;
