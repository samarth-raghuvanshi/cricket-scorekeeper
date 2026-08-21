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
      (item) => item.battingTeamIndex === index,
    );
    const deliveries =
      completed?.deliveries ??
      (match.battingTeamIndex === index ? match.deliveries : []);
    let score = 0;
    let legalBalls = 0;
    const scores = [{ score: 0, over: 0 }];
    deliveries.forEach((delivery) => {
      score += delivery.runs;
      const wicketPoint = delivery.isWicket;
      if (delivery.isLegal !== false) {
        legalBalls += 1;
        if (legalBalls % 6 === 0 || wicketPoint) {
          scores.push({ score, over: legalBalls / 6 });
        }
      } else if (wicketPoint) {
        scores.push({ score, over: legalBalls / 6 });
      }
    });
    if (match.status === "completed" && scores.at(-1)?.score !== score) {
      scores.push({ score, over: legalBalls / 6 });
    }
    return { name: team.name, scores };
  });
  const maxOvers = Math.max(
    1,
    match.overs ?? 0,
    ...innings.flatMap((item) => item.scores.map((point) => point.over)),
  );
  const maxScore = Math.max(
    1,
    ...innings.flatMap((item) => item.scores.map((point) => point.score)),
  );
  const pointString = (scores: { score: number; over: number }[]) =>
    scores
      .map((point) =>
        `${14 + (point.over / maxOvers) * 172},${72 - (point.score / maxScore) * 56}`,
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
        <text x="14" y="82" fill="rgba(255,255,255,.55)" fontSize="6">
          0 ov
        </text>
        <text
          x="186"
          y="82"
          textAnchor="end"
          fill="rgba(255,255,255,.55)"
          fontSize="6"
        >
          {maxOvers} ov
        </text>
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
