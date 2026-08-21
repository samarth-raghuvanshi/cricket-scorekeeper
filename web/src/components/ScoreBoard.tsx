import type { Match } from "../lib/match";

function ScoreBoard({ match }: { match: Match }) {
  const battingTeam = match.teams[match.battingTeamIndex];

  return (
    <section className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] shadow-2xl">
      <div className="flex items-end justify-between bg-[#a82b2b] px-6 py-5">
        <div>
          <p className="text-sm text-white/75">
            {battingTeam.name} · innings {match.completedInnings.length + 1}
          </p>
          <p className="mt-1 text-5xl font-bold">
            {match.score}
            <span className="text-xl font-normal text-white/70">
              {" "}
              / {match.wickets}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl">
            {Math.floor(match.balls / 6)}.{match.balls % 6}
          </p>
          <p className="text-xs text-white/70">
            overs
            {match.currentOverBowler ? ` · ${match.currentOverBowler}` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}

export default ScoreBoard;
