import type { Batter, Bowler, Delivery, Match } from "./match";

export type ScoringEvent = "runs" | "wide" | "noball" | "wicket";

export const makeBatters = (players: string[]): Batter[] =>
  players.map((name) => ({
    name,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
  }));

export const makeBowlers = (players: string[]): Bowler[] =>
  players.map((name) => ({ name, balls: 0, runs: 0, wickets: 0 }));

export function applyDelivery(
  match: Match,
  event: ScoringEvent,
  runs = 0,
): Match {
  const isExtra = event === "wide" || event === "noball";
  const isWicket = event === "wicket";
  const isLegal = !isExtra;
  const totalRuns = event === "wide" ? 1 : event === "noball" ? runs + 1 : runs;
  const delivery: Delivery = {
    label: isWicket
      ? "W"
      : event === "wide"
        ? "Wd"
        : event === "noball"
          ? `Nb+${runs}`
          : String(runs),
    runs: totalRuns,
    isWicket,
    isLegal,
    extra: isExtra ? event : undefined,
  };
  const activeBatter = match.batters[match.activeBatterIndex];
  const batters = match.batters.map((batter, index) =>
    !isExtra && index === match.activeBatterIndex
      ? {
          ...batter,
          runs: batter.runs + runs,
          balls: batter.balls + 1,
          fours: batter.fours + (runs === 4 ? 1 : 0),
          sixes: batter.sixes + (runs === 6 ? 1 : 0),
          isOut: isWicket || batter.isOut,
        }
      : batter,
  );
  const bowlers = match.bowlers.map((bowler) =>
    bowler.name === match.currentOverBowler
      ? {
          ...bowler,
          balls: bowler.balls + (isLegal ? 1 : 0),
          runs: bowler.runs + totalRuns,
          wickets: bowler.wickets + (isWicket ? 1 : 0),
        }
      : bowler,
  );
  const balls = match.balls + (isLegal ? 1 : 0);
  const score = match.score + totalRuns;
  const wickets = match.wickets + (isWicket ? 1 : 0);
  return {
    ...match,
    batters,
    bowlers,
    score,
    wickets,
    balls,
    activeBatterIndex: isWicket ? -1 : match.activeBatterIndex,
    deliveries: [...match.deliveries, delivery],
    currentOverBowler:
      isLegal && balls % 6 === 0 ? null : match.currentOverBowler,
    ...(activeBatter ? {} : { activeBatterIndex: -1 }),
  };
}
