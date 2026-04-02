"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Heart, Briefcase, MapPin, Smile, Music, Brain, Droplet,
  Church, Wine, Cigarette, ShieldX, Ruler, Star, Target,
} from "lucide-react";
import type { ProfileData } from "@/types/profile";
import { JOB_CATEGORY_LABELS, MBTI_OPTIONS, BLOOD_TYPE_LABELS, RELIGION_LABELS, DRINKING_LABELS, SMOKING_LABELS } from "@/constants/enums";
import { calculateAge, parseLocation } from "@/lib/utils";

/**
 * Profile View Page
 *
 * Displays the user's completed profile as a romantic card.
 * Shows all profile fields with Korean labels.
 * Edit button leads to profile form.
 */
export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.status === 404) {
          router.push("/profile/setup");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Heart className="heart-pulse" size={32} />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const age = calculateAge(new Date(profile.dateOfBirth));
  const residence = parseLocation(profile.residenceLocation);
  const company = parseLocation(profile.companyLocation);
  const hometown = parseLocation(profile.hometownLocation);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Card */}
      <div className="card-romantic p-6 text-center">
        {profile.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.profileImage}
            alt={profile.nickname}
            className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
          />
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

      {/* Job Info */}
      <div className="card-romantic p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
          <Briefcase size={16} className="text-primary" /> 직업
        </h3>
        <p className="text-sm">
          {JOB_CATEGORY_LABELS[profile.jobCategory]} · {profile.jobDetail}
        </p>
      </div>

      {/* Location Info */}
      <div className="card-romantic p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
          <MapPin size={16} className="text-primary" /> 지역
        </h3>
        <div className="space-y-1 text-sm">
          <p>직장: {company.province} {company.district}</p>
          <p>거주지: {residence.province} {residence.district}</p>
          <p>출신지: {hometown.province} {hometown.district}</p>
        </div>
      </div>

      {/* Personality */}
      <div className="card-romantic p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
          <Smile size={16} className="text-primary" /> 성격
        </h3>
        <p className="text-sm">{profile.personality}</p>
      </div>

      {/* Hobbies & Preferences */}
      <div className="card-romantic p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
          <Music size={16} className="text-primary" /> 취미 & 선호
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {profile.hobbies.map((h) => (
            <span key={h} className="px-3 py-1 rounded-full bg-pink-50 text-xs text-primary font-medium">
              {h}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.preferences.map((p) => (
            <span key={p} className="px-3 py-1 rounded-full bg-accent/20 text-xs text-accent-foreground font-medium">
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Attributes */}
      <div className="card-romantic p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
          <Brain size={16} className="text-primary" /> 속성
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-muted-foreground flex-shrink-0" />
            <span>MBTI: {profile.mbti}</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplet size={14} className="text-muted-foreground flex-shrink-0" />
            <span>혈액형: {BLOOD_TYPE_LABELS[profile.bloodType]}</span>
          </div>
          <div className="flex items-center gap-2">
            <Church size={14} className="text-muted-foreground flex-shrink-0" />
            <span>종교: {RELIGION_LABELS[profile.religion]}</span>
          </div>
          <div className="flex items-center gap-2">
            <Wine size={14} className="text-muted-foreground flex-shrink-0" />
            <span>음주: {DRINKING_LABELS[profile.drinking]}</span>
          </div>
          <div className="flex items-center gap-2">
            <Cigarette size={14} className="text-muted-foreground flex-shrink-0" />
            <span>흡연: {SMOKING_LABELS[profile.smoking]}</span>
          </div>
          {profile.height && (
            <div className="flex items-center gap-2">
              <Ruler size={14} className="text-muted-foreground flex-shrink-0" />
              <span>키: {profile.height}cm</span>
            </div>
          )}
          {profile.celebrity && (
            <div className="flex items-center gap-2 sm:col-span-2">
              <Star size={14} className="text-muted-foreground flex-shrink-0" />
              <span>닮은꼴: {profile.celebrity}</span>
            </div>
          )}
        </div>
      </div>

      {/* Disliked Conditions */}
      {profile.dislikedConditions.length > 0 && (
        <div className="card-romantic p-4">
          <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
            <ShieldX size={16} className="text-destructive" /> 비선호 조건
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.dislikedConditions.map((c) => (
              <span key={c} className="px-3 py-1 rounded-full bg-red-50 text-xs text-destructive font-medium">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Matching Settings */}
      <div className="card-romantic p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
          <Target size={16} className="text-primary" /> 매칭 설정
        </h3>
        <div className="text-sm space-y-1">
          <p className="text-muted-foreground">
            최소 매칭 점수:{" "}
            <span className="text-foreground font-medium">
              {profile.minMatchScore > 0 ? `${profile.minMatchScore}점 이상` : "제한 없음"}
            </span>
          </p>
          <p className="text-muted-foreground">
            매칭 상태:{" "}
            <span className={`font-medium ${profile.stopMatching ? "text-destructive" : "text-primary"}`}>
              {profile.stopMatching ? "일시 중단" : "활성"}
            </span>
          </p>
        </div>
      </div>

      {/* Edit Button */}
      <button
        onClick={() => router.push("/profile/setup")}
        className="btn-gradient w-full"
      >
        프로필 수정
      </button>
    </div>
  );
}
