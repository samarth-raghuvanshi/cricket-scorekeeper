import type { Match } from "../lib/match";

function ScoreBoard({ match }: { match: Match }) {
  const firstInnings = match.completedInnings[0];
  const inningsScores = match.teams.map((team, index) => {
    const completed = match.completedInnings.find(
      (innings) => innings.battingTeamIndex === index,
    );
    if (completed) return completed;
    if (index === match.battingTeamIndex) {
      return {
        teamName: team.name,
        score: match.score,
        wickets: match.wickets,
      };
    }
    return { teamName: team.name, score: 0, wickets: 0 };
  });
  const runRate = match.balls > 0 ? (match.score * 6) / match.balls : 0;
  const target = firstInnings ? firstInnings.score + 1 : null;
  const remainingBalls = Math.max(match.overs * 6 - match.balls, 0);
  const requiredRunRate =
    target !== null && remainingBalls > 0
      ? Math.max(target - match.score, 0) * 6 / remainingBalls
      : 0;

  return (
    <section className="overflow-hidden rounded-lg border border-white/15 bg-white/[0.04] shadow-2xl">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-[#a82b2b] px-4 py-5 sm:gap-6 sm:px-6">
        {inningsScores.map((innings, index) => (
          <div
            key={innings.teamName}
            className={`${index === 0 ? "col-start-1" : "col-start-3 text-right"} ${index === match.battingTeamIndex ? "" : "opacity-75"}`}
          >
            <p className="truncate text-sm text-white/75">{innings.teamName}</p>
            <p
              className={`mt-1 font-bold ${index === match.battingTeamIndex ? "text-5xl" : "text-4xl"}`}
            >
              {innings.score}
              <span className="text-xl font-normal text-white/70">
                {" "}/ {innings.wickets}
              </span>
            </p>
          </div>
        ))}
        <div className="col-start-2 row-start-1 text-center text-xs text-white/80">
          {!firstInnings && <p>CRR: {runRate.toFixed(2)}</p>}
          {firstInnings && target !== null && (
            <>
              <p>Target: {target}</p>
              <p>RRR: {requiredRunRate.toFixed(2)}</p>
            </>
          )}
          <p className="mt-1 text-xl text-white">
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
