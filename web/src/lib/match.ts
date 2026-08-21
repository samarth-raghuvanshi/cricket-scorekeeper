import { request } from "./api";

const apiBase = import.meta.env.VITE_API_URL ?? "/api";

export interface Team {
  name: string;
  players: string[];
}

export interface Match {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  teams: Team[];
  overs: number;
  battingTeamIndex: number;
  activeBatterIndex: number;
  batters: Batter[];
  score: number;
  wickets: number;
  balls: number;
  deliveries: Delivery[];
  completedInnings: Innings[];
  currentOverBowler: string | null;
  bowlers: Bowler[];
  status: "active" | "completed";
  result: string | null;
}

export interface CreatedMatch extends Match {
  scorerKey: string;
}

export interface Batter {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
}

export interface Delivery {
  label: string;
  runs: number;
  isWicket: boolean;
  isLegal: boolean;
  extra?: "wide" | "noball";
}

export interface Innings {
  teamName: string;
  battingTeamIndex: number;
  score: number;
  wickets: number;
  balls: number;
  batters: Batter[];
  bowlers: Bowler[];
  deliveries: Delivery[];
}

export interface Bowler {
  name: string;
  balls: number;
  runs: number;
  wickets: number;
}

export const createMatch = (match: Match) =>
  request<CreatedMatch>("/matches", {
    method: "POST",
    body: JSON.stringify(match),
  });
export const getMatch = (id: string) => request<Match>(`/matches/${id}`);
export const matchEventsUrl = (id: string) => `${apiBase}/matches/${id}/events`;
export const updateMatch = (match: Match, scorerKey: string) =>
  request<Match>(`/matches/${match.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Scorer-Key": scorerKey },
    body: JSON.stringify(match),
  });
export const getMatchHistory = () => request<Match[]>("/matches");
export const deleteMatch = (id: string, adminKey: string) =>
  request<void>(`/matches/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Key": adminKey },
  });
export const verifyScorerKey = (id: string, scorerKey: string) =>
  request<{ valid: true }>(`/matches/${id}/scorer-session`, {
    method: "POST",
    body: JSON.stringify({ scorerKey }),
  });
