"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Heart, RefreshCw, MapPin, Briefcase, ChevronDown, ChevronUp,
  User, X, Brain, Droplet, Church, Wine, Cigarette, Ruler, Star,
  Smile, Music,
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
          aria-label="매칭 결과 새로고침"
          className="p-2 rounded-full bg-pink-50 hover:bg-pink-100 transition-colors disabled:opacity-50"
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
            onAccept={() => handleAction(match.matchId, "ACCEPTED")}
            onReject={() => handleAction(match.matchId, "REJECTED")}
            onViewProfile={() => handleViewProfile(match.userId)}
            onZoomImage={setZoomImage}
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

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          role="dialog"
          aria-label="프로필 사진 확대 보기"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomImage}
            alt="프로필 사진"
            className="max-w-full max-h-full rounded-2xl object-contain"
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
  onAccept,
  onReject,
  onViewProfile,
  onZoomImage,
  profileLoading,
}: {
  match: MatchData;
  onAccept: () => void;
  onReject: () => void;
  onViewProfile: () => void;
  onZoomImage: (src: string) => void;
  profileLoading: boolean;
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
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            {match.profileImage ? (
              <button
                type="button"
                onClick={() => onZoomImage(match.profileImage!)}
                aria-label={`${match.nickname} 프로필 사진 확대`}
                className="w-full h-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={match.profileImage}
                  alt={`${match.nickname} 프로필 사진`}
                  className="w-full h-full object-cover"
                />
              </button>
            ) : (
              <div className="w-full h-full bg-pink-100 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {match.nickname.charAt(0)}
                </span>
              </div>
            )}
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
            <ScoreDots label="설문 유사도" value={match.score.surveySimilarity} max={45} />
            <ScoreDots label="라이프스타일" value={match.score.lifestyle} max={25} />
            <ScoreDots label="가치관 일치" value={match.score.valueAlignment} max={20} />
            <ScoreDots label="성격 호환" value={match.score.personality} max={10} />
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

// ── Score Dots Component (5 circles with partial fill) ──
function ScoreDots({ label, value, max }: { label: string; value: number; max: number }) {
  const ratio = max > 0 ? (value / max) * 5 : 0;
  const full = Math.floor(ratio);
  const partial = ratio - full;

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-1.5">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-pink-100 px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold">프로필</h3>
          <button onClick={onClose} aria-label="프로필 닫기" className="p-1 rounded-full hover:bg-pink-50">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Avatar + Basic Info */}
          <div className="text-center">
            {profile.profileImage ? (
              <button
                type="button"
                onClick={() => onZoomImage(profile.profileImage!)}
                className="mx-auto mb-3 block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.profileImage}
                  alt={profile.nickname}
                  className="w-20 h-20 rounded-full object-cover hover:opacity-90 transition-opacity"
                />
              </button>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-pink mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {profile.nickname.charAt(0)}
                </span>
              </div>
            )}
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
            <div className="grid grid-cols-2 gap-1.5 text-sm">
              <div className="flex items-center gap-1.5">
                <Brain size={12} className="text-muted-foreground" />
                MBTI: {profile.mbti}
              </div>
              <div className="flex items-center gap-1.5">
                <Droplet size={12} className="text-muted-foreground" />
                혈액형: {BLOOD_TYPE_LABELS[profile.bloodType] || profile.bloodType}
              </div>
              <div className="flex items-center gap-1.5">
                <Church size={12} className="text-muted-foreground" />
                종교: {RELIGION_LABELS[profile.religion] || profile.religion}
              </div>
              <div className="flex items-center gap-1.5">
                <Wine size={12} className="text-muted-foreground" />
                음주: {DRINKING_LABELS[profile.drinking] || profile.drinking}
              </div>
              <div className="flex items-center gap-1.5">
                <Cigarette size={12} className="text-muted-foreground" />
                흡연: {SMOKING_LABELS[profile.smoking] || profile.smoking}
              </div>
              {profile.height && (
                <div className="flex items-center gap-1.5">
                  <Ruler size={12} className="text-muted-foreground" />
                  키: {profile.height}cm
                </div>
              )}
              {profile.celebrity && (
                <div className="flex items-center gap-1.5 col-span-2">
                  <Star size={12} className="text-muted-foreground" />
                  닮은꼴: {profile.celebrity}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
