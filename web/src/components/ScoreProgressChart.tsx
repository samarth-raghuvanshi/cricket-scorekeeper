import type { Match } from "../lib/match";

function ScoreProgressChart({
  match,
  expanded = false,
}: {
  match: Match;
  expanded?: boolean;
}) {
  const innings = match.teams.map((team, index) => {
    const completed = match.completedInnings.find(
      (item) => item.teamName === team.name,
    );
    const deliveries =
      completed?.deliveries ??
      (match.battingTeamIndex === index ? match.deliveries : []);
    let score = 0;
    let legalBalls = 0;
    const scores = [0];
    deliveries.forEach((delivery) => {
      score += delivery.runs;
      if (delivery.isLegal !== false) {
        legalBalls += 1;
        if (legalBalls % 6 === 0) scores.push(score);
      }
    });
    return { name: team.name, scores };
  });
  const maxBalls = Math.max(
    1,
    ...innings.map((item) => item.scores.length - 1),
  );
  const maxScore = Math.max(1, ...innings.flatMap((item) => item.scores));
  const pointString = (scores: number[]) =>
    scores
      .map(
        (score, ball) =>
          `${14 + (ball / maxBalls) * 172},${72 - (score / maxScore) * 56}`,
      )
      .join(" ");

  return (
    <div className={expanded ? "w-full" : "min-w-0 w-52"}>
      <div className="mb-1 flex flex-wrap gap-x-3 text-[10px] text-white/70">
        <span>Score progression · per over</span>
        <span>
          <i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#ffb0b0]" />
          {innings[0].name}
        </span>
        <span>
          <i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#9cc8ff]" />
          {innings[1].name}
        </span>
      </div>
      <svg
        viewBox="0 0 200 86"
        role="img"
        aria-label="Score progression for both teams at the end of every over"
        className={expanded ? "h-64 w-full" : "h-24 w-full"}
      >
        <path d="M14 16V72H186" stroke="rgba(255,255,255,.35)" fill="none" />
        <polyline
          points={pointString(innings[0].scores)}
          fill="none"
          stroke="#ffb0b0"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={pointString(innings[1].scores)}
          fill="none"
          stroke="#9cc8ff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default ScoreProgressChart;
