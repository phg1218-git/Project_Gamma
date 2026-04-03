"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Heart, RefreshCw, MapPin, Briefcase, ChevronDown, ChevronUp,
  User, X, Brain, Droplet, Church, Wine, Cigarette, Ruler, Star,
  Smile, Music, MessageCircle, Sparkles,
} from "lucide-react";
import { JOB_CATEGORY_LABELS, BLOOD_TYPE_LABELS, RELIGION_LABELS, DRINKING_LABELS, SMOKING_LABELS } from "@/constants/enums";
import { calculateAge, parseLocation } from "@/lib/utils";

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
  profileImage: string | null;
  score: {
    surveySimilarity: number;
    lifestyle: number;
    valueAlignment: number;
    personality: number;
    total: number;
  };
  totalScore: number;
  status: string;
  isSubthreshold: boolean;
  chatThreadId: string | null;
  createdAt: string;
}

interface PartnerProfile {
  nickname: string;
  dateOfBirth: string;
  gender: string;
  height?: number;
  jobCategory: string;
  jobDetail: string;
  residenceLocation: string;
  personality: string;
  hobbies: string[];
  preferences: string[];
  mbti: string;
  bloodType: string;
  religion: string;
  drinking: string;
  smoking: string;
  celebrity?: string;
  profileImage?: string;
}

interface FilterViolation {
  key: string;
  label: string;
}

interface SubthresholdRecommendation {
  id: string;
  score: number;
  breakdown: unknown;
  myMinScore: number;
  violations: FilterViolation[];
  targetUser: {
    id: string;
    nickname: string;
    age: number;
    gender: string;
    jobCategory: string;
    residenceProvince: string;
    personality: string;
    hobbies: string[];
    preferences: string[];
    mbti: string;
    height: number | null;
    celebrity: string | null;
  };
}

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [profileModal, setProfileModal] = useState<PartnerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<SubthresholdRecommendation | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recActing, setRecActing] = useState(false);

  async function handleViewProfile(userId: string) {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/profile/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfileModal(data);
      }
    } catch (error) {
      console.error("Failed to fetch partner profile:", error);
    } finally {
      setProfileLoading(false);
    }
  }

  async function fetchRecommendation() {
    setRecLoading(true);
    try {
      const res = await fetch("/api/matches/recommendation");
      if (res.ok) {
        const data = await res.json();
        setRecommendation(data.recommendation ?? null);
      }
    } catch (error) {
      console.error("Failed to fetch recommendation:", error);
    } finally {
      setRecLoading(false);
    }
  }

  // 나중에: 로컬에서만 닫기 (DB 변경 없음 → 다음 방문 시 재노출)
  function handleRecDismiss() {
    setRecommendation(null);
  }

  async function handleRecAction(action: "ACCEPT" | "DECLINE") {
    if (!recommendation) return;
    setRecActing(true);

    // 거절(DECLINE): 모달 즉시 닫고 백그라운드 API 호출 (영구 비노출)
    if (action === "DECLINE") {
      setRecommendation(null);
      fetch("/api/matches/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: recommendation.id, action }),
      }).catch(console.error).finally(() => setRecActing(false));
      return;
    }

    try {
      const res = await fetch("/api/matches/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: recommendation.id, action }),
      });

      if (!res.ok) return;
      const data = await res.json();

      setRecommendation(null);

      if (data.case === 1 && data.chatThreadId) {
        router.push(`/chat/${data.chatThreadId}`);
      } else if (data.case === 2) {
        setMessage("매칭 요청을 보냈습니다! 상대방의 응답을 기다려주세요. 💌");
      }
    } catch (error) {
      console.error("Failed to act on recommendation:", error);
    } finally {
      setRecActing(false);
    }
  }

  const fetchMatches = useCallback(async () => {
    setFetchError(false);
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
        setMessage(data.message || null);
        setNeedsSetup(data.needsSetup ?? false);
      } else {
        setFetchError(true);
      }
    } catch (error) {
      console.error("Failed to fetch matches:", error);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    fetchRecommendation();
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
          <h1 className="text-xl sm:text-2xl font-bold">매칭 결과</h1>
          <p className="text-sm text-muted-foreground">
            {matches.length}명의 추천 상대
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="매칭 결과 새로고침"
          className="p-3 rounded-full bg-pink-50 hover:bg-pink-100 active:bg-pink-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={`text-primary ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 서버 통신 오류 */}
      {fetchError && (
        <div className="card-romantic p-6 mb-4 text-center" role="alert">
          <p className="text-sm text-destructive font-medium mb-3">
            매칭 정보를 불러오지 못했습니다.
          </p>
          <button
            onClick={fetchMatches}
            className="py-2 px-4 rounded-xl border border-pink-200 text-sm font-medium text-primary hover:bg-pink-50 transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 프로필/설문 미완성 — 작성 유도 */}
      {needsSetup && message && (
        <div className="card-romantic p-6 mb-4 text-center">
          <Heart className="mx-auto mb-3 text-pink-200" size={40} />
          <p className="text-sm text-muted-foreground mb-4">{message}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/profile/setup")}
              className="btn-gradient text-sm py-2"
            >
              프로필 작성하기
            </button>
            <button
              onClick={() => router.push("/survey")}
              className="py-2 rounded-xl border border-pink-200 text-sm font-medium text-primary hover:bg-pink-50 transition-colors"
            >
              설문 작성하기
            </button>
          </div>
        </div>
      )}

      {/* 매칭 후보 없음 (프로필/설문은 완성된 상태) */}
      {matches.length === 0 && message && !needsSetup && (
        <div className="card-romantic p-8 text-center">
          <Heart className="mx-auto mb-3 text-pink-200" size={48} />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      )}

      {/* Match Cards */}
      <div className="space-y-4">
        {matches.map((match) => (
          <MatchCard
            key={match.matchId}
            match={match}
            isSubthreshold={match.isSubthreshold}
            onAccept={() => handleAction(match.matchId, "ACCEPTED")}
            onReject={() => handleAction(match.matchId, "REJECTED")}
            onViewProfile={() => handleViewProfile(match.userId)}
            onZoomImage={setZoomImage}
            onChatStart={match.chatThreadId ? () => router.push(`/chat/${match.chatThreadId}`) : undefined}
            profileLoading={profileLoading}
          />
        ))}
      </div>

      {/* Partner Profile Modal */}
      {profileModal && (
        <ProfileModal
          profile={profileModal}
          onClose={() => setProfileModal(null)}
          onZoomImage={setZoomImage}
        />
      )}

      {/* 기준 점수 미만 추천 모달 */}
      {!recLoading && recommendation && (
        <RecommendationModal
          recommendation={recommendation}
          onDismiss={handleRecDismiss}
          onDecline={() => handleRecAction("DECLINE")}
          onAccept={() => handleRecAction("ACCEPT")}
          onViewProfile={() => handleViewProfile(recommendation.targetUser.id)}
          acting={recActing}
          profileLoading={profileLoading}
        />
      )}

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          role="dialog"
          aria-label="프로필 사진 확대 보기"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomImage}
            alt="프로필 사진"
            className="max-w-full max-h-full rounded-2xl object-contain touch-manipulation"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ── Match Card Component ──
function MatchCard({
  match,
  isSubthreshold = false,
  onAccept,
  onReject,
  onViewProfile,
  onZoomImage,
  onChatStart,
  profileLoading,
}: {
  match: MatchData;
  isSubthreshold?: boolean;
  onAccept: () => void;
  onReject: () => void;
  onViewProfile: () => void;
  onZoomImage: (src: string) => void;
  onChatStart?: () => void;
  profileLoading: boolean;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className={`overflow-hidden rounded-2xl shadow-sm border ${isSubthreshold ? "border-violet-200" : "border-pink-100 bg-white"}`}>
      {/* Score Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${isSubthreshold ? "bg-gradient-to-r from-violet-500 to-purple-500" : "bg-gradient-pink"}`}>
        <div className="flex items-center gap-2 text-white">
          {isSubthreshold ? (
            <>
              <Sparkles size={15} fill="white" strokeWidth={0} />
              <span className="text-sm font-medium">인연 제안</span>
            </>
          ) : (
            <>
              <Heart size={16} fill="white" strokeWidth={0} />
              <span className="text-sm font-medium">호환도</span>
            </>
          )}
        </div>
        <span className="text-xl font-bold text-white">
          {match.totalScore.toFixed(1)}점
        </span>
      </div>

      {/* Profile Info */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            <div className="w-full h-full bg-pink-100 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {match.nickname.charAt(0)}
              </span>
            </div>
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

        {/* Profile View Button */}
        <button
          onClick={onViewProfile}
          disabled={profileLoading}
          className="flex items-center gap-1 text-xs text-primary font-medium mb-2 disabled:opacity-50"
        >
          <User size={14} />
          프로필 보기
        </button>

        {/* Score Breakdown Toggle */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center gap-1 text-xs text-primary font-medium mb-2"
        >
          점수 상세
          {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showBreakdown && match.score && (
          <div className="space-y-2.5 mb-3">
            <ScoreDots label="설문 유사도" value={match.score.surveySimilarity} max={45} description="연애관·갈등 해결·소통 방식의 유사도" />
            <ScoreDots label="라이프스타일" value={match.score.lifestyle} max={25} description="주말 활동·취침 시간·소비 성향·청결도" />
            <ScoreDots label="가치관 일치" value={match.score.valueAlignment} max={20} description="결혼·자녀 계획·커리어 방향성" />
            <ScoreDots label="성격 호환" value={match.score.personality} max={10} description="내외향성·즉흥성·도전 성향·유머 스타일" />
          </div>
        )}

        {/* Action Buttons */}
        {match.status === "PENDING" && !isSubthreshold && (
          <div className="flex gap-2">
            <button
              onClick={onReject}
              className="flex-1 py-3 rounded-xl border border-pink-200 text-sm font-medium text-muted-foreground hover:bg-pink-50 active:bg-pink-100 transition-colors"
            >
              넘기기
            </button>
            <button onClick={onAccept} className="flex-1 btn-gradient text-sm py-3">
              관심있어요
            </button>
          </div>
        )}
        {match.status === "PENDING" && isSubthreshold && (
          <div className="space-y-2">
            <div className="flex items-start gap-2 px-1 pb-1">
              <Sparkles size={13} className="text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-violet-500 leading-relaxed">
                기준 점수에 미치지 못하지만 먼저 용기 내어 제안했어요. 대화를 나눠볼까요?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onReject}
                className="flex-1 py-3 rounded-xl border border-violet-200 text-sm font-medium text-violet-400 hover:bg-violet-50 active:bg-violet-100 transition-colors"
              >
                넘기기
              </button>
              <button
                onClick={onAccept}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-sm font-medium text-white hover:brightness-105 active:brightness-95 transition-all"
              >
                <Sparkles size={14} />
                인연 맺기
              </button>
            </div>
          </div>
        )}
        {match.status === "ACCEPTED" && onChatStart && !isSubthreshold && (
          <button
            onClick={onChatStart}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-pink text-sm font-medium text-white hover:brightness-105 active:brightness-95 transition-all"
          >
            <MessageCircle size={15} />
            서로 통했습니다! 채팅을 시작해보세요
          </button>
        )}
        {match.status === "ACCEPTED" && onChatStart && isSubthreshold && (
          <button
            onClick={onChatStart}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-sm font-medium text-white hover:brightness-105 active:brightness-95 transition-all"
          >
            <Sparkles size={15} />
            인연이 이어졌습니다! 채팅을 시작해보세요
          </button>
        )}
        {match.status === "ACCEPTED" && !onChatStart && (
          <div className="text-center py-3 rounded-xl bg-pink-50 text-sm font-medium text-primary">
            관심을 보냈습니다! 상대방의 응답을 기다리고 있어요 💌
          </div>
        )}
        {match.status === "REJECTED" && (
          <div className="text-center py-3 rounded-xl bg-gray-50 text-sm font-medium text-muted-foreground">
            넘김
          </div>
        )}
      </div>
    </div>
  );
}

// ── Score Dots Component (5 circles with partial fill + hover tooltip) ──
function ScoreDots({ label, value, max, description }: { label: string; value: number; max: number; description: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const ratio = max > 0 ? (value / max) * 5 : 0;
  const full = Math.floor(ratio);
  const partial = ratio - full;
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div
        className="relative flex gap-1.5 cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip((v) => !v)}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          if (i < full) {
            return <div key={i} className="w-3.5 h-3.5 rounded-full bg-primary" />;
          }
          if (i === full && partial > 0) {
            return (
              <div key={i} className="w-3.5 h-3.5 rounded-full bg-primary" style={{ opacity: 0.3 + partial * 0.7 }} />
            );
          }
          return <div key={i} className="w-3.5 h-3.5 rounded-full bg-pink-100" />;
        })}

        {showTooltip && (
          <div className="absolute right-0 bottom-6 z-10 bg-white border border-pink-100 rounded-xl p-3 shadow-lg w-48 pointer-events-none">
            <p className="font-semibold text-xs text-foreground mb-1">{label}</p>
            <p className="text-xs text-primary font-medium">
              {value.toFixed(1)} / {max}점 ({percentage}%)
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Partner Profile Modal ──
function ProfileModal({
  profile,
  onClose,
  onZoomImage,
}: {
  profile: PartnerProfile;
  onClose: () => void;
  onZoomImage: (src: string) => void;
}) {
  const age = calculateAge(new Date(profile.dateOfBirth));
  const residence = parseLocation(profile.residenceLocation);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-pink-100 px-4 py-3 flex items-center justify-between z-10">
          <h3 className="font-semibold">프로필</h3>
          <button onClick={onClose} aria-label="프로필 닫기" className="p-2 rounded-full hover:bg-pink-50 active:bg-pink-100 transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Avatar + Basic Info */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-pink mx-auto mb-3 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {profile.nickname.charAt(0)}
              </span>
            </div>
            <h2 className="text-xl font-bold">{profile.nickname}</h2>
            <p className="text-sm text-muted-foreground">
              {age}세 · {profile.gender === "MALE" ? "남성" : "여성"}
              {profile.height ? ` · ${profile.height}cm` : ""}
            </p>
          </div>

          {/* Job */}
          <div className="card-romantic p-3">
            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
              <Briefcase size={14} className="text-primary" /> 직업
            </h4>
            <p className="text-sm">
              {JOB_CATEGORY_LABELS[profile.jobCategory] || profile.jobCategory} · {profile.jobDetail}
            </p>
          </div>

          {/* Location */}
          <div className="card-romantic p-3">
            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
              <MapPin size={14} className="text-primary" /> 거주지
            </h4>
            <p className="text-sm">{residence.province} {residence.district}</p>
          </div>

          {/* Personality */}
          <div className="card-romantic p-3">
            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
              <Smile size={14} className="text-primary" /> 성격
            </h4>
            <p className="text-sm">{profile.personality}</p>
          </div>

          {/* Hobbies & Preferences */}
          <div className="card-romantic p-3">
            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
              <Music size={14} className="text-primary" /> 취미 & 선호
            </h4>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {profile.hobbies.map((h) => (
                <span key={h} className="px-2.5 py-0.5 rounded-full bg-pink-50 text-xs text-primary font-medium">
                  {h}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.preferences.map((p) => (
                <span key={p} className="px-2.5 py-0.5 rounded-full bg-accent/20 text-xs text-accent-foreground font-medium">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Attributes */}
          <div className="card-romantic p-3">
            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
              <Brain size={14} className="text-primary" /> 속성
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-1.5 text-sm">
              <div className="flex items-center gap-1.5">
                <Brain size={12} className="text-muted-foreground flex-shrink-0" />
                <span>MBTI: {profile.mbti}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Droplet size={12} className="text-muted-foreground flex-shrink-0" />
                <span>혈액형: {BLOOD_TYPE_LABELS[profile.bloodType] || profile.bloodType}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Church size={12} className="text-muted-foreground flex-shrink-0" />
                <span>종교: {RELIGION_LABELS[profile.religion] || profile.religion}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wine size={12} className="text-muted-foreground flex-shrink-0" />
                <span>음주: {DRINKING_LABELS[profile.drinking] || profile.drinking}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cigarette size={12} className="text-muted-foreground flex-shrink-0" />
                <span>흡연: {SMOKING_LABELS[profile.smoking] || profile.smoking}</span>
              </div>
              {profile.height && (
                <div className="flex items-center gap-1.5">
                  <Ruler size={12} className="text-muted-foreground flex-shrink-0" />
                  <span>키: {profile.height}cm</span>
                </div>
              )}
              {profile.celebrity && (
                <div className="flex items-center gap-1.5 sm:col-span-2">
                  <Star size={12} className="text-muted-foreground flex-shrink-0" />
                  <span>닮은꼴: {profile.celebrity}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 기준 점수 미만 추천 모달 ─────────────────────────────────
function RecommendationModal({
  recommendation,
  onDismiss,
  onDecline,
  onAccept,
  onViewProfile,
  acting,
  profileLoading,
}: {
  recommendation: SubthresholdRecommendation;
  onDismiss: () => void;
  onDecline: () => void;
  onAccept: () => void;
  onViewProfile: () => void;
  acting: boolean;
  profileLoading: boolean;
}) {
  const { targetUser, score, myMinScore, violations } = recommendation;
  const diff = myMinScore - score;
  const hasViolations = violations && violations.length > 0;
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-pink px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-white" />
            <span className="text-white font-semibold text-sm">이런 분은 어떠세요?</span>
          </div>
          <button
            onClick={onDismiss}
            aria-label="닫기"
            className="p-1 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        <div className="p-5">
          {/* 메시지 */}
          <div className="bg-pink-50 rounded-xl p-3 mb-4">
            <p className="text-sm text-center text-foreground leading-relaxed">
              당신의 기준 점수는{" "}
              <span className="font-bold text-primary">{myMinScore}점</span>이지만,{" "}
              <span className="font-bold text-primary">{score.toFixed(1)}점</span>의 잘 맞는 분이 있어요.
              <br />
              <span className="text-muted-foreground text-xs">({diff.toFixed(1)}점 차이)</span>
              <br />
              한 번 매칭해볼까요? 💫
            </p>
          </div>

          {/* 하드 필터 위반 경고 */}
          {hasViolations && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-amber-700 mb-2">⚠️ 내 조건과 다른 점</p>
              <div className="flex flex-wrap gap-1.5">
                {violations.map((v) => (
                  <span
                    key={v.key}
                    className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium"
                  >
                    {v.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 프로필 요약 */}
          <div className="card-romantic p-3 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-pink flex-shrink-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {targetUser.nickname.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold">{targetUser.nickname}</p>
                <p className="text-xs text-muted-foreground">
                  {targetUser.age}세
                  {targetUser.height ? ` · ${targetUser.height}cm` : ""}
                  {" · "}MBTI {targetUser.mbti}
                </p>
              </div>
              {/* 점수 뱃지 */}
              <div className="ml-auto flex-shrink-0 text-center">
                <div className="text-lg font-bold text-primary">{score.toFixed(1)}</div>
                <div className="text-[10px] text-muted-foreground">호환도</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Briefcase size={12} />
                {JOB_CATEGORY_LABELS[targetUser.jobCategory] || targetUser.jobCategory}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {targetUser.residenceProvince}
              </span>
            </div>

            {/* 취미 */}
            {targetUser.hobbies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {targetUser.hobbies.slice(0, 4).map((h) => (
                  <span
                    key={h}
                    className="px-2 py-0.5 rounded-full bg-pink-50 text-xs text-primary font-medium"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}

            {/* 프로필 보기 + 점수 상세 토글 */}
            <div className="flex items-center gap-3 pt-1 border-t border-pink-50">
              <button
                onClick={onViewProfile}
                disabled={profileLoading}
                className="flex items-center gap-1 text-xs text-primary font-medium disabled:opacity-50"
              >
                <User size={13} />
                프로필 보기
              </button>
              <button
                onClick={() => setShowBreakdown((v) => !v)}
                className="flex items-center gap-1 text-xs text-primary font-medium"
              >
                점수 상세
                {showBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {/* 점수 상세 */}
            {showBreakdown && (recommendation.breakdown as Record<string, number>) && (
              <div className="space-y-2 mt-3">
                <ScoreDots label="설문 유사도" value={(recommendation.breakdown as Record<string, number>).surveySimilarity ?? 0} max={45} description="연애관·갈등 해결·소통 방식의 유사도" />
                <ScoreDots label="라이프스타일" value={(recommendation.breakdown as Record<string, number>).lifestyle ?? 0} max={25} description="주말 활동·취침 시간·소비 성향·청결도" />
                <ScoreDots label="가치관 일치" value={(recommendation.breakdown as Record<string, number>).valueAlignment ?? 0} max={20} description="결혼·자녀 계획·커리어 방향성" />
                <ScoreDots label="성격 호환" value={(recommendation.breakdown as Record<string, number>).personality ?? 0} max={10} description="내외향성·즉흥성·도전 성향·유머 스타일" />
              </div>
            )}
          </div>

          {/* 버튼: 상단 2개 + 하단 1개 */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={onDismiss}
              disabled={acting}
              className="flex-1 py-2.5 rounded-xl border border-pink-200 text-sm font-medium text-muted-foreground hover:bg-pink-50 active:bg-pink-100 transition-colors disabled:opacity-50"
            >
              나중에
            </button>
            <button
              onClick={onDecline}
              disabled={acting}
              className="flex-1 py-2.5 rounded-xl border border-red-200 text-sm font-medium text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-50"
            >
              거절
            </button>
          </div>
          <button
            onClick={onAccept}
            disabled={acting}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-pink text-sm font-medium text-white hover:brightness-105 active:brightness-95 transition-all disabled:opacity-50"
          >
            <Heart size={15} fill="white" strokeWidth={0} />
            {acting ? "처리 중..." : "매칭 해볼게요!"}
          </button>
        </div>
      </div>
    </div>
  );
}
