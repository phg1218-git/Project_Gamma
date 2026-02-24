"use client";

import { useEffect, useState, useCallback } from "react";
import { Heart, RefreshCw, MapPin, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { JOB_CATEGORY_LABELS } from "@/constants/enums";

/**
 * Matches Page
 *
 * Displays ranked match results with score breakdowns.
 * Users can accept or reject matches.
 * Refresh button triggers re-computation.
 */

interface MatchData {
  matchId: string;
  userId: string;
  nickname: string;
  age: number;
  jobCategory: string;
  residenceProvince: string;
  score: {
    surveySimilarity: number;
    lifestyle: number;
    valueAlignment: number;
    personality: number;
    total: number;
  };
  totalScore: number;
  status: string;
  createdAt: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
        setMessage(data.message || null);
      }
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch("/api/matches", { method: "POST" });
      await fetchMatches();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleAction(matchId: string, status: "ACCEPTED" | "REJECTED") {
    try {
      const res = await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, status }),
      });
      if (res.ok) {
        setMatches((prev) =>
          prev.map((m) => (m.matchId === matchId ? { ...m, status } : m)),
        );
      }
    } catch (error) {
      console.error("Failed to update match:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Heart className="heart-pulse" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">매칭 결과</h1>
          <p className="text-sm text-muted-foreground">
            {matches.length}명의 추천 상대
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-full bg-pink-50 hover:bg-pink-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={`text-primary ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {message && (
        <div className="card-romantic p-4 mb-4 text-center">
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      )}

      {matches.length === 0 && !message && (
        <div className="card-romantic p-8 text-center">
          <Heart className="mx-auto mb-3 text-pink-200" size={48} />
          <p className="text-sm text-muted-foreground">
            아직 매칭 결과가 없습니다.
            <br />
            프로필과 설문을 완료하면 매칭이 시작됩니다.
          </p>
        </div>
      )}

      {/* Match Cards */}
      <div className="space-y-4">
        {matches.map((match) => (
          <MatchCard
            key={match.matchId}
            match={match}
            onAccept={() => handleAction(match.matchId, "ACCEPTED")}
            onReject={() => handleAction(match.matchId, "REJECTED")}
          />
        ))}
      </div>
    </div>
  );
}

// ── Match Card Component ──
function MatchCard({
  match,
  onAccept,
  onReject,
}: {
  match: MatchData;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className="card-romantic overflow-hidden">
      {/* Score Header */}
      <div className="bg-gradient-pink px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Heart size={16} fill="white" strokeWidth={0} />
          <span className="text-sm font-medium">호환도</span>
        </div>
        <span className="text-xl font-bold text-white">
          {match.totalScore.toFixed(1)}점
        </span>
      </div>

      {/* Profile Info */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">
              {match.nickname.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold">{match.nickname}</h3>
            <p className="text-xs text-muted-foreground">
              {match.age}세
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Briefcase size={14} />
            {JOB_CATEGORY_LABELS[match.jobCategory] || match.jobCategory}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {match.residenceProvince}
          </span>
        </div>

        {/* Score Breakdown Toggle */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center gap-1 text-xs text-primary font-medium mb-2"
        >
          점수 상세
          {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showBreakdown && match.score && (
          <div className="space-y-2 mb-3">
            <ScoreBar label="설문 유사도" value={match.score.surveySimilarity} max={45} />
            <ScoreBar label="라이프스타일" value={match.score.lifestyle} max={25} />
            <ScoreBar label="가치관 일치" value={match.score.valueAlignment} max={20} />
            <ScoreBar label="성격 호환" value={match.score.personality} max={10} />
          </div>
        )}

        {/* Action Buttons */}
        {match.status === "PENDING" && (
          <div className="flex gap-2">
            <button
              onClick={onReject}
              className="flex-1 py-2 rounded-xl border border-pink-200 text-sm font-medium text-muted-foreground hover:bg-pink-50 transition-colors"
            >
              넘기기
            </button>
            <button onClick={onAccept} className="flex-1 btn-gradient text-sm">
              관심있어요
            </button>
          </div>
        )}
        {match.status === "ACCEPTED" && (
          <div className="text-center py-2 rounded-xl bg-pink-50 text-sm font-medium text-primary">
            수락됨 — 상대방의 수락을 기다리고 있습니다
          </div>
        )}
        {match.status === "REJECTED" && (
          <div className="text-center py-2 rounded-xl bg-gray-50 text-sm font-medium text-muted-foreground">
            넘김
          </div>
        )}
      </div>
    </div>
  );
}

// ── Score Bar Component ──
function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-primary">{value.toFixed(1)}/{max}</span>
      </div>
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
