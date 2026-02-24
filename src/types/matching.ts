/**
 * 이어줌 — Matching Types
 */

export interface ScoreBreakdown {
  surveySimilarity: number;
  lifestyle: number;
  valueAlignment: number;
  personality: number;
  total: number;
}

export interface MatchCardData {
  matchId: string;
  userId: string;
  nickname: string;
  age: number;
  jobCategory: string;
  residenceProvince: string;
  score: ScoreBreakdown;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  createdAt: string;
}
