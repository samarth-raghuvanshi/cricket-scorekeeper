import type { Batter, Bowler, Match } from "../lib/match";

type ScorecardInnings = {
  teamName: string;
  score: number;
  wickets: number;
  balls: number;
  batters: Batter[];
  bowlers: Bowler[];
};

function Scorecard({
  match,
  selectedTeamIndex,
  onSelectTeam,
}: {
  match: Match;
  selectedTeamIndex: number;
  onSelectTeam: (index: number) => void;
}) {
  const battingTeam = match.teams[match.battingTeamIndex];
  const selected: ScorecardInnings | undefined =
    match.battingTeamIndex === selectedTeamIndex
      ? {
          teamName: battingTeam.name,
          score: match.score,
          wickets: match.wickets,
          balls: match.balls,
          batters: match.batters,
          bowlers: match.bowlers,
        }
      : match.completedInnings.find(
          (innings) => innings.teamName === match.teams[selectedTeamIndex].name,
        );

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04]">
      <div className="flex gap-2 border-b border-white/10 p-3">
        {match.teams.map((team, index) => (
          <button
            key={team.name}
            onClick={() => onSelectTeam(index)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedTeamIndex === index ? "bg-[#c93434] shadow-md" : "bg-white/10 text-white/70 hover:bg-white/15"}`}
          >
            {team.name}
          </button>
        ))}
      </div>
      {selected ? (
        <div className="overflow-x-auto p-5">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-scorekeeper text-2xl">{selected.teamName}</h2>
            <p className="text-white/60">
              {selected.score}/{selected.wickets} ·{" "}
              {Math.floor(selected.balls / 6)}.{selected.balls % 6} ov
            </p>
          </div>
          <div className="min-w-[470px]">
            <div className="mb-2 grid grid-cols-[minmax(150px,1fr)_48px_48px_52px_40px_40px] gap-2 border-b border-white/15 pb-2 text-xs uppercase text-white/45">
              <span>Batting</span>
              <span>R</span>
              <span>B</span>
              <span>SR</span>
              <span>4s</span>
              <span>6s</span>
            </div>
            {selected.batters.map((batter, index) => (
              <div
                key={`${batter.name}-${index}`}
                className="grid grid-cols-[minmax(150px,1fr)_48px_48px_52px_40px_40px] gap-2 py-1.5"
              >
                <span>{batter.name}</span>
                <span>{batter.runs}</span>
                <span>{batter.balls}</span>
                <span>
                  {batter.balls ? ((batter.runs / batter.balls) * 100).toFixed(2) : "-"}
                </span>
                <span>{batter.fours}</span>
                <span>{batter.sixes}</span>
              </div>
            ))}
            <div className="mt-5 mb-2 grid grid-cols-[minmax(150px,1fr)_64px_64px_64px_64px] gap-2 border-b border-white/15 pb-2 text-xs uppercase text-white/45">
              <span>Bowling</span>
              <span>O</span>
              <span>R</span>
              <span>W</span>
              <span>Econ</span>
            </div>
            {selected.bowlers.map((bowler, index) => (
              <div
                key={`${bowler.name}-${index}`}
                className="grid grid-cols-[minmax(150px,1fr)_64px_64px_64px_64px] gap-2 py-1.5"
              >
                <span>{bowler.name}</span>
                <span>
                  {Math.floor(bowler.balls / 6)}.{bowler.balls % 6}
                </span>
                <span>{bowler.runs}</span>
                <span>{bowler.wickets}</span>
                <span>
                  {bowler.balls ? ((bowler.runs * 6) / bowler.balls).toFixed(2) : "-"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="p-5 text-white/60">This team has not batted yet.</p>
      )}
    </section>
  );
}

export default Scorecard;
