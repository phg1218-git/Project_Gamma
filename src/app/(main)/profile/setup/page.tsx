"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Camera } from "lucide-react";
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [personalityTouched, setPersonalityTouched] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Separate DOB inputs for auto-focus UX
  const [dobYear, setDobYear] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const dobMonthRef = useRef<HTMLInputElement>(null);
  const dobDayRef = useRef<HTMLInputElement>(null);

  // Section refs for scroll-to-error
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Form state
  const [form, setForm] = useState({
    gender: "",
    nickname: "",
    height: "",
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
    celebrity: "",
    profileImage: "",
    minMatchScore: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 300;
        let w = img.width;
        let h = img.height;

        if (w > MAX || h > MAX) {
          if (w > h) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setForm((p) => ({ ...p, profileImage: dataUrl }));
      };
      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  const personalityError =
    (personalityTouched || form.personality.length > 0) &&
    form.personality.length < 10
      ? "성격은 10자 이상 작성해주세요."
      : null;

  // DOB 유효성: 세 필드가 모두 채워진 경우 날짜 형식 검사
  const dobError = (() => {
    if (!dobYear && !dobMonth && !dobDay) return null; // 미입력 상태 — 그냥 비워둠
    if (!dobYear || !dobMonth || !dobDay) return null; // 일부만 입력 — 포커스 이동 중
    const y = Number(dobYear);
    const m = Number(dobMonth);
    const d = Number(dobDay);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return "숫자만 입력해주세요.";
    if (m < 1 || m > 12) return "월은 1~12 사이여야 합니다.";
    if (d < 1 || d > 31) return "일은 1~31 사이여야 합니다.";
    // 해당 월의 마지막 날 초과 체크
    const maxDay = new Date(y, m, 0).getDate();
    if (d > maxDay) return `${m}월은 최대 ${maxDay}일까지 있습니다.`;
    return null;
  })();

  // 필수 항목 전부 채워졌는지 확인
  function isFormValid(): boolean {
    if (!form.gender) return false;
    if (!dobYear || dobYear.length < 4) return false;
    if (!dobMonth) return false;
    if (!dobDay) return false;
    if (dobError) return false;
    if (!form.nickname || form.nickname.trim().length < 2) return false;
    if (!form.jobCategory) return false;
    if (!form.jobDetail || form.jobDetail.trim().length < 1) return false;
    if (!form.companyProvince || !form.companyDistrict) return false;
    if (!form.residenceProvince || !form.residenceDistrict) return false;
    if (!form.hometownProvince || !form.hometownDistrict) return false;
    if (form.personality.length < 10) return false;
    if (form.hobbies.length === 0) return false;
    if (form.preferences.length === 0) return false;
    if (!form.mbti) return false;
    if (!form.bloodType) return false;
    if (!form.religion) return false;
    if (!form.drinking) return false;
    if (!form.smoking) return false;
    return true;
  }

  function splitLocation(location?: string | null) {
    if (!location) return ["", ""] as const;
    const [province = "", district = ""] = location.split("|");
    return [province, district] as const;
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

        if (res.status === 404 || !res.ok) {
          return;
        }

        const profile = await res.json();

        if (cancelled) return;

        // Load DOB into separate fields
        if (profile.dateOfBirth) {
          const dob = new Date(profile.dateOfBirth);
          setDobYear(String(dob.getUTCFullYear()));
          setDobMonth(String(dob.getUTCMonth() + 1).padStart(2, "0"));
          setDobDay(String(dob.getUTCDate()).padStart(2, "0"));
        }

        const [companyProvince, companyDistrict] = splitLocation(profile.companyLocation);
        const [residenceProvince, residenceDistrict] = splitLocation(profile.residenceLocation);
        const [hometownProvince, hometownDistrict] = splitLocation(profile.hometownLocation);

        setForm((prev) => ({
          ...prev,
          gender: profile.gender ?? "",
          nickname: profile.nickname ?? "",
          height: profile.height ? String(profile.height) : "",
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
          celebrity: profile.celebrity ?? "",
          profileImage: profile.profileImage ?? "",
          minMatchScore: profile.minMatchScore ?? 0,
        }));
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Map Zod field errors from API response → fieldErrors state, then scroll to first error
  function applyFieldErrors(data: { error?: string; details?: Array<{ path: (string | number)[]; message: string }> }) {
    const errors: Record<string, string> = {};

    if (Array.isArray(data.details)) {
      for (const detail of data.details) {
        const field = String(detail.path[0] ?? "");
        if (field && !errors[field]) {
          errors[field] = detail.message;
        }
      }
    }

    if (Object.keys(errors).length === 0) {
      errors._global = data.error || "프로필 저장에 실패했습니다.";
    }

    setFieldErrors(errors);

    // Scroll to first error field in visual order
    const fieldOrder = [
      "gender", "dateOfBirth", "nickname", "height",
      "jobCategory", "jobDetail",
      "companyLocation", "residenceLocation", "hometownLocation",
      "personality", "hobbies", "preferences",
      "mbti", "bloodType", "religion", "drinking", "smoking",
    ];
    // Map Zod field name → section ref key
    const fieldToSection: Record<string, string> = {
      jobCategory: "job",
      jobDetail: "job",
      companyLocation: "company",
      residenceLocation: "residence",
      hometownLocation: "hometown",
    };

    const firstField = fieldOrder.find((f) => errors[f]);
    if (firstField) {
      const sectionKey = fieldToSection[firstField] ?? firstField;
      setTimeout(() => {
        sectionRefs.current[sectionKey]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    const dateOfBirth =
      dobYear && dobMonth && dobDay
        ? `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`
        : "";

    try {
      const payload = {
        gender: form.gender,
        dateOfBirth,
        nickname: form.nickname,
        height: form.height ? Number(form.height) : undefined,
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
        celebrity: form.celebrity || undefined,
        profileImage: form.profileImage || undefined,
        minMatchScore: form.minMatchScore,
      };

      let res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        // Profile exists — update instead
        res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        applyFieldErrors(data);
        return;
      }

      // 설문 완료 여부 확인 후 분기
      const surveyCheck = await fetch("/api/survey");
      if (surveyCheck.status === 404) {
        router.push("/survey?mode=quick");
      } else {
        router.push("/profile");
      }
    } catch (err) {
      setFieldErrors({ _global: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  if (profileLoading) {
    return <div className="animate-fade-in" />;
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-4">
        <Heart className="mx-auto mb-2 text-primary" size={32} fill="hsl(340, 82%, 62%)" strokeWidth={0} />
        <h1 className="text-xl font-bold">프로필 설정</h1>
        <p className="text-sm text-muted-foreground">나를 소개해주세요</p>
      </div>

      {/* 프로필은 전부 나에 대한 정보 */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 mb-5">
        <span className="text-base">🙋</span>
        <p className="text-xs text-blue-600 font-medium">
          이 페이지의 모든 항목은 <strong>나에 대한 정보</strong>입니다.
        </p>
      </div>

      {/* 글로벌 에러 (필드 특정 불가한 경우만) */}
      {fieldErrors._global && (
        <div className="card-romantic p-3 mb-4 border-destructive/30 bg-red-50">
          <p className="text-sm text-destructive">{fieldErrors._global}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Profile Image */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-3">프로필 사진 (선택)</label>
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-pink-50 border-2 border-dashed border-pink-200 flex items-center justify-center overflow-hidden hover:border-primary transition-colors"
            >
              {form.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.profileImage} alt="프로필 미리보기" className="w-full h-full object-cover" />
              ) : (
                <Camera size={28} className="text-pink-300" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">탭하여 사진 선택 (최대 300x300 자동 리사이즈)</p>
            {form.profileImage && (
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, profileImage: "" }))}
                className="text-xs text-destructive hover:underline"
              >
                사진 삭제
              </button>
            )}
          </div>
        </div>

        {/* Gender */}
        <div
          className="card-romantic p-4"
          ref={(el) => { sectionRefs.current["gender"] = el; }}
        >
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
          {fieldErrors.gender && <p className="text-xs text-destructive mt-2">{fieldErrors.gender}</p>}
        </div>

        {/* Date of Birth — 년/월/일 분리 입력, 자동 포커스 이동 */}
        <div
          className="card-romantic p-4"
          ref={(el) => { sectionRefs.current["dateOfBirth"] = el; }}
        >
          <label className="block text-sm font-semibold mb-2">생년월일 *</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={dobYear}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setDobYear(val);
                if (val.length === 4) dobMonthRef.current?.focus();
              }}
              placeholder="년도"
              maxLength={4}
              className="w-24 px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm text-center"
            />
            <span className="text-muted-foreground text-sm">년</span>
            <input
              ref={dobMonthRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={dobMonth}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                setDobMonth(val);
                if (val.length === 2) dobDayRef.current?.focus();
              }}
              placeholder="월"
              maxLength={2}
              className="w-16 px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm text-center"
            />
            <span className="text-muted-foreground text-sm">월</span>
            <input
              ref={dobDayRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={dobDay}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                setDobDay(val);
              }}
              placeholder="일"
              maxLength={2}
              className="w-16 px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm text-center"
            />
            <span className="text-muted-foreground text-sm">일</span>
          </div>
          {(dobError || fieldErrors.dateOfBirth) && (
            <p className="text-xs text-destructive mt-2">{dobError || fieldErrors.dateOfBirth}</p>
          )}
        </div>

        {/* Nickname */}
        <div
          className="card-romantic p-4"
          ref={(el) => { sectionRefs.current["nickname"] = el; }}
        >
          <label className="block text-sm font-semibold mb-2">닉네임 *</label>
          <input
            type="text"
            value={form.nickname}
            onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
            placeholder="2-20자 한글/영문/숫자"
            maxLength={20}
            className="w-full px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
          {fieldErrors.nickname && <p className="text-xs text-destructive mt-2">{fieldErrors.nickname}</p>}
        </div>

        {/* Height */}
        <div
          className="card-romantic p-4"
          ref={(el) => { sectionRefs.current["height"] = el; }}
        >
          <label className="block text-sm font-semibold mb-2">키 (선택)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={form.height}
              onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))}
              placeholder="예: 175"
              min={140}
              max={220}
              className="w-32 px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
            <span className="text-sm text-muted-foreground">cm</span>
          </div>
          {fieldErrors.height && <p className="text-xs text-destructive mt-2">{fieldErrors.height}</p>}
        </div>

        {/* Job */}
        <div
          className="card-romantic p-4"
          ref={(el) => { sectionRefs.current["job"] = el; }}
        >
          <label className="block text-sm font-semibold mb-2">직업 *</label>
          <select
            value={form.jobCategory}
            onChange={(e) => setForm((p) => ({ ...p, jobCategory: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm mb-2"
          >
            <option value="">직업 분류 선택</option>
            {Object.entries(JOB_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {fieldErrors.jobCategory && <p className="text-xs text-destructive mb-2">{fieldErrors.jobCategory}</p>}
          <input
            type="text"
            value={form.jobDetail}
            onChange={(e) => setForm((p) => ({ ...p, jobDetail: e.target.value }))}
            placeholder="상세 직업 (예: 프론트엔드 개발자)"
            maxLength={50}
            className="w-full px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
          {fieldErrors.jobDetail && <p className="text-xs text-destructive mt-2">{fieldErrors.jobDetail}</p>}
        </div>

        {/* Locations */}
        {(["company", "residence", "hometown"] as const).map((locType) => {
          const labels = { company: "직장 소재지", residence: "거주지", hometown: "출신지" };
          const locationFieldKey = `${locType}Location` as "companyLocation" | "residenceLocation" | "hometownLocation";
          const provinceKey = `${locType}Province` as keyof typeof form;
          const districtKey = `${locType}District` as keyof typeof form;

          return (
            <div
              key={locType}
              className="card-romantic p-4"
              ref={(el) => { sectionRefs.current[locType] = el; }}
            >
              <label className="block text-sm font-semibold mb-2">{labels[locType]} *</label>
              <div className="flex gap-2">
                <select
                  value={form[provinceKey] as string}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [provinceKey]: e.target.value, [districtKey]: "" }))
                  }
                  className="flex-1 px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
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
                  disabled={!(form[provinceKey] as string)}
                >
                  <option value="">구/군</option>
                  {getDistricts(form[provinceKey] as string).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              {fieldErrors[locationFieldKey] && (
                <p className="text-xs text-destructive mt-2">{fieldErrors[locationFieldKey]}</p>
              )}
            </div>
          );
        })}

        {/* Personality */}
        <div
          className="card-romantic p-4"
          ref={(el) => { sectionRefs.current["personality"] = el; }}
        >
          <label className="block text-sm font-semibold mb-2">성격 소개 *</label>
          <textarea
            value={form.personality}
            onChange={(e) => setForm((p) => ({ ...p, personality: e.target.value }))}
            onBlur={() => setPersonalityTouched(true)}
            placeholder="나의 성격을 자유롭게 소개해주세요 (10-200자)"
            maxLength={200}
            rows={3}
            className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 text-sm resize-none ${
              personalityError || fieldErrors.personality
                ? "border-destructive focus:ring-destructive/30"
                : "border-pink-200 focus:ring-primary/30"
            }`}
          />
          {(personalityError || fieldErrors.personality) && (
            <p className="text-xs text-destructive mt-1">{personalityError || fieldErrors.personality}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{form.personality.length}/200</p>
        </div>

        {/* Hobbies (Multi-select chips) */}
        <div
          className="card-romantic p-4"
          ref={(el) => { sectionRefs.current["hobbies"] = el; }}
        >
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
          {fieldErrors.hobbies && <p className="text-xs text-destructive mt-2">{fieldErrors.hobbies}</p>}
        </div>

        {/* Preferences (Multi-select chips) */}
        <div
          className="card-romantic p-4"
          ref={(el) => { sectionRefs.current["preferences"] = el; }}
        >
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
          {fieldErrors.preferences && <p className="text-xs text-destructive mt-2">{fieldErrors.preferences}</p>}
        </div>

        {/* MBTI */}
        <div
          className="card-romantic p-4"
          ref={(el) => { sectionRefs.current["mbti"] = el; }}
        >
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
          {fieldErrors.mbti && <p className="text-xs text-destructive mt-2">{fieldErrors.mbti}</p>}
        </div>

        {/* Blood Type */}
        <div
          className="card-romantic p-4"
          ref={(el) => { sectionRefs.current["bloodType"] = el; }}
        >
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
          {fieldErrors.bloodType && <p className="text-xs text-destructive mt-2">{fieldErrors.bloodType}</p>}
        </div>

        {/* Religion */}
        <div
          className="card-romantic p-4"
          ref={(el) => { sectionRefs.current["religion"] = el; }}
        >
          <label className="block text-sm font-semibold mb-2">종교 *</label>
          <select
            value={form.religion}
            onChange={(e) => setForm((p) => ({ ...p, religion: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          >
            <option value="">선택</option>
            {Object.entries(RELIGION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {fieldErrors.religion && <p className="text-xs text-destructive mt-2">{fieldErrors.religion}</p>}
        </div>

        {/* Drinking */}
        <div
          className="card-romantic p-4"
          ref={(el) => { sectionRefs.current["drinking"] = el; }}
        >
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
          {fieldErrors.drinking && <p className="text-xs text-destructive mt-2">{fieldErrors.drinking}</p>}
        </div>

        {/* Smoking */}
        <div
          className="card-romantic p-4"
          ref={(el) => { sectionRefs.current["smoking"] = el; }}
        >
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
          {fieldErrors.smoking && <p className="text-xs text-destructive mt-2">{fieldErrors.smoking}</p>}
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

        {/* Celebrity Lookalike */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">닮은꼴 연예인 (선택)</label>
          <input
            type="text"
            value={form.celebrity}
            onChange={(e) => setForm((p) => ({ ...p, celebrity: e.target.value }))}
            placeholder="예: 아이유, 차은우 (50자 이내)"
            maxLength={50}
            className="w-full px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>

        {/* Min Match Score */}
        <div className="card-romantic p-4">
          <label className="block text-sm font-semibold mb-2">매칭 최소 점수</label>
          <p className="text-xs text-muted-foreground mb-3">이 점수 이상인 상대만 매칭 목록에 표시됩니다.</p>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={form.minMatchScore}
            onChange={(e) => setForm((p) => ({ ...p, minMatchScore: Number(e.target.value) }))}
            className="w-full accent-primary outline-none border-0 focus:outline-none"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">0점 (제한 없음)</span>
            <span className="text-sm font-medium text-primary">{form.minMatchScore}점 이상</span>
            <span className="text-xs text-muted-foreground">100점</span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !isFormValid()}
          className="btn-gradient w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "저장 중..." : "프로필 저장"}
        </button>
        {!isFormValid() && !loading && (
          <p className="text-xs text-center text-muted-foreground mt-1">
            * 표시된 필수 항목을 모두 입력해야 저장할 수 있습니다.
          </p>
        )}
      </form>
    </div>
  );
}
