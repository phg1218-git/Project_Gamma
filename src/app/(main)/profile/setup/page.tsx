"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { GENDER_LABELS, JOB_CATEGORY_LABELS, MBTI_OPTIONS, BLOOD_TYPE_LABELS, RELIGION_LABELS, DRINKING_LABELS, SMOKING_LABELS, HOBBY_OPTIONS, PREFERENCE_OPTIONS, DISLIKED_CONDITIONS } from "@/constants/enums";
import { PROVINCES, getDistricts } from "@/constants/locations";
import { formatLocation } from "@/lib/utils";

/**
 * Profile Setup Page
 *
 * Multi-step form for first-time profile creation.
 * Also used for editing existing profiles.
 * Validates with Zod on the server side.
 */
export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personalityTouched, setPersonalityTouched] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    gender: "",
    dateOfBirth: "",
    nickname: "",
    jobCategory: "",
    jobDetail: "",
    companyProvince: "",
    companyDistrict: "",
    residenceProvince: "",
    residenceDistrict: "",
    hometownProvince: "",
    hometownDistrict: "",
    personality: "",
    hobbies: [] as string[],
    preferences: [] as string[],
    mbti: "",
    bloodType: "",
    religion: "",
    drinking: "",
    smoking: "",
    dislikedConditions: [] as string[],
  });

  const personalityError =
    (personalityTouched || form.personality.length > 0) &&
    form.personality.length < 10
      ? "성격은 10자 이상 작성해주세요."
      : null;


  function splitLocation(location?: string | null) {
    if (!location) return ["", ""] as const;
    const [province = "", district = ""] = location.split("|");
    return [province, district] as const;
  }

  function isFormPristine(currentForm: typeof form) {
    return (
      currentForm.gender === "" &&
      currentForm.dateOfBirth === "" &&
      currentForm.nickname === "" &&
      currentForm.jobCategory === "" &&
      currentForm.jobDetail === "" &&
      currentForm.companyProvince === "" &&
      currentForm.companyDistrict === "" &&
      currentForm.residenceProvince === "" &&
      currentForm.residenceDistrict === "" &&
      currentForm.hometownProvince === "" &&
      currentForm.hometownDistrict === "" &&
      currentForm.personality === "" &&
      currentForm.hobbies.length === 0 &&
      currentForm.preferences.length === 0 &&
      currentForm.mbti === "" &&
      currentForm.bloodType === "" &&
      currentForm.religion === "" &&
      currentForm.drinking === "" &&
      currentForm.smoking === "" &&
      currentForm.dislikedConditions.length === 0
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");

        if (cancelled) return;

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (res.status === 404) {
          return;
        }

        if (!res.ok) {
          return;
        }

        const profile = await res.json();

        if (cancelled) return;

        const [companyProvince, companyDistrict] = splitLocation(profile.companyLocation);
        const [residenceProvince, residenceDistrict] = splitLocation(profile.residenceLocation);
        const [hometownProvince, hometownDistrict] = splitLocation(profile.hometownLocation);

        setForm((prev) => {
          if (!isFormPristine(prev)) return prev;

          return {
            ...prev,
            gender: profile.gender ?? "",
            dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().slice(0, 10) : "",
            nickname: profile.nickname ?? "",
            jobCategory: profile.jobCategory ?? "",
            jobDetail: profile.jobDetail ?? "",
            companyProvince,
            companyDistrict,
            residenceProvince,
            residenceDistrict,
            hometownProvince,
            hometownDistrict,
            personality: profile.personality ?? "",
            hobbies: Array.isArray(profile.hobbies) ? profile.hobbies : [],
            preferences: Array.isArray(profile.preferences) ? profile.preferences : [],
            mbti: profile.mbti ?? "",
            bloodType: profile.bloodType ?? "",
            religion: profile.religion ?? "",
            drinking: profile.drinking ?? "",
            smoking: profile.smoking ?? "",
            dislikedConditions: Array.isArray(profile.dislikedConditions) ? profile.dislikedConditions : [],
          };
        });
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Toggle a value in a multi-select array
  function toggleArrayItem(field: "hobbies" | "preferences" | "dislikedConditions", value: string) {
    setForm((prev) => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        nickname: form.nickname,
        jobCategory: form.jobCategory,
        jobDetail: form.jobDetail,
        companyLocation: formatLocation(form.companyProvince, form.companyDistrict),
        residenceLocation: formatLocation(form.residenceProvince, form.residenceDistrict),
        hometownLocation: formatLocation(form.hometownProvince, form.hometownDistrict),
        personality: form.personality,
        hobbies: form.hobbies,
        preferences: form.preferences,
        mbti: form.mbti,
        bloodType: form.bloodType,
        religion: form.religion,
        drinking: form.drinking,
        smoking: form.smoking,
        dislikedConditions: form.dislikedConditions,
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        // Profile exists, try update
        const updateRes = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!updateRes.ok) {
          const data = await updateRes.json();
          throw new Error(data.error || "프로필 수정에 실패했습니다.");
        }
      } else if (!res.ok) {
        const data = await res.json();

        // Zod details를 사람이 읽을 수 있게 합쳐서 표시
        const details =
          Array.isArray(data?.details)
            ? data.details.map((e: any) => e.message).join("\n")
            : "";
        throw new Error(`${data.error || "프로필 생성에 실패했습니다."}\n${details}`);
      }

      router.push("/survey");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (profileLoading) {
    return <div className="animate-fade-in" />;
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <Heart className="mx-auto mb-2 text-primary" size={32} fill="hsl(340, 82%, 62%)" strokeWidth={0} />
        <h1 className="text-xl font-bold">프로필 설정</h1>
        <p className="text-sm text-muted-foreground">나를 소개해주세요</p>
      </div>

      {error && (
        <div className="card-romantic p-3 mb-4 border-destructive/30 bg-red-50">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Gender */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">성별 *</label>
          <div className="flex gap-3">
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, gender: value }))}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  form.gender === value
                    ? "bg-primary text-white"
                    : "bg-pink-50 text-muted-foreground hover:bg-pink-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date of Birth */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">생년월일 *</label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            required
          />
        </div>

        {/* Nickname */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">닉네임 *</label>
          <input
            type="text"
            value={form.nickname}
            onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
            placeholder="2-20자 한글/영문/숫자"
            maxLength={20}
            className="w-full px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            required
          />
        </div>

        {/* Job */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">직업 *</label>
          <select
            value={form.jobCategory}
            onChange={(e) => setForm((p) => ({ ...p, jobCategory: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm mb-2"
            required
          >
            <option value="">직업 분류 선택</option>
            {Object.entries(JOB_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            type="text"
            value={form.jobDetail}
            onChange={(e) => setForm((p) => ({ ...p, jobDetail: e.target.value }))}
            placeholder="상세 직업 (예: 프론트엔드 개발자)"
            maxLength={50}
            className="w-full px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            required
          />
        </div>

        {/* Locations */}
        {(["company", "residence", "hometown"] as const).map((locType) => {
          const labels = { company: "직장 소재지", residence: "거주지", hometown: "출신지" };
          const provinceKey = `${locType}Province` as keyof typeof form;
          const districtKey = `${locType}District` as keyof typeof form;

          return (
            <div key={locType} className="card-romantic p-4">
              <label className="block text-sm font-semibold mb-2">{labels[locType]} *</label>
              <div className="flex gap-2">
                <select
                  value={form[provinceKey] as string}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [provinceKey]: e.target.value, [districtKey]: "" }))
                  }
                  className="flex-1 px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  required
                >
                  <option value="">시/도</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <select
                  value={form[districtKey] as string}
                  onChange={(e) => setForm((p) => ({ ...p, [districtKey]: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  required
                  disabled={!(form[provinceKey] as string)}
                >
                  <option value="">구/군</option>
                  {getDistricts(form[provinceKey] as string).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}

        {/* Personality */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">성격 소개 *</label>
          <textarea
            value={form.personality}
            onChange={(e) => setForm((p) => ({ ...p, personality: e.target.value }))}
            onBlur={() => setPersonalityTouched(true)}
            placeholder="나의 성격을 자유롭게 소개해주세요 (10-200자)"
            maxLength={200}
            rows={3}
            className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 text-sm resize-none ${
              personalityError
                ? "border-destructive focus:ring-destructive/30"
                : "border-pink-200 focus:ring-primary/30"
            }`}
            required
          />
          {personalityError && (
            <p className="text-xs text-destructive mt-1">{personalityError}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{form.personality.length}/200</p>
        </div>

        {/* Hobbies (Multi-select chips) */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">취미 (최대 5개) *</label>
          <div className="flex flex-wrap gap-2">
            {HOBBY_OPTIONS.map((hobby) => (
              <button
                key={hobby}
                type="button"
                onClick={() => toggleArrayItem("hobbies", hobby)}
                disabled={form.hobbies.length >= 5 && !form.hobbies.includes(hobby)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  form.hobbies.includes(hobby)
                    ? "bg-primary text-white"
                    : "bg-pink-50 text-muted-foreground hover:bg-pink-100"
                } disabled:opacity-40`}
              >
                {hobby}
              </button>
            ))}
          </div>
        </div>

        {/* Preferences (Multi-select chips) */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">선호사항 (최대 5개) *</label>
          <div className="flex flex-wrap gap-2">
            {PREFERENCE_OPTIONS.map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => toggleArrayItem("preferences", pref)}
                disabled={form.preferences.length >= 5 && !form.preferences.includes(pref)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  form.preferences.includes(pref)
                    ? "bg-primary text-white"
                    : "bg-pink-50 text-muted-foreground hover:bg-pink-100"
                } disabled:opacity-40`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        {/* MBTI */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">MBTI *</label>
          <div className="grid grid-cols-4 gap-2">
            {MBTI_OPTIONS.map((mbti) => (
              <button
                key={mbti}
                type="button"
                onClick={() => setForm((p) => ({ ...p, mbti }))}
                className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                  form.mbti === mbti
                    ? "bg-primary text-white"
                    : "bg-pink-50 text-muted-foreground hover:bg-pink-100"
                }`}
              >
                {mbti}
              </button>
            ))}
          </div>
        </div>

        {/* Blood Type */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">혈액형 *</label>
          <div className="flex gap-2">
            {Object.entries(BLOOD_TYPE_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, bloodType: value }))}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  form.bloodType === value
                    ? "bg-primary text-white"
                    : "bg-pink-50 text-muted-foreground hover:bg-pink-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Religion */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">종교 *</label>
          <select
            value={form.religion}
            onChange={(e) => setForm((p) => ({ ...p, religion: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            required
          >
            <option value="">선택</option>
            {Object.entries(RELIGION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Drinking */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">음주 *</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(DRINKING_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, drinking: value }))}
                className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                  form.drinking === value
                    ? "bg-primary text-white"
                    : "bg-pink-50 text-muted-foreground hover:bg-pink-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Smoking */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">흡연 *</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(SMOKING_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, smoking: value }))}
                className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                  form.smoking === value
                    ? "bg-primary text-white"
                    : "bg-pink-50 text-muted-foreground hover:bg-pink-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Disliked Conditions */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">비선호 조건 (최대 5개)</label>
          <div className="flex flex-wrap gap-2">
            {DISLIKED_CONDITIONS.map((cond) => (
              <button
                key={cond}
                type="button"
                onClick={() => toggleArrayItem("dislikedConditions", cond)}
                disabled={form.dislikedConditions.length >= 5 && !form.dislikedConditions.includes(cond)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  form.dislikedConditions.includes(cond)
                    ? "bg-destructive text-white"
                    : "bg-red-50 text-muted-foreground hover:bg-red-100"
                } disabled:opacity-40`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || form.personality.length < 10}
          className="btn-gradient w-full disabled:opacity-50"
        >
          {loading ? "저장 중..." : "프로필 저장"}
        </button>
      </form>
    </div>
  );
}
