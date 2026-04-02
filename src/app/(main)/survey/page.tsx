"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ChevronRight, ChevronLeft, Save, CheckCircle } from "lucide-react";
import { SURVEY_CATEGORIES, SURVEY_QUESTIONS, getQuestionsByCategory, type SurveyQuestion } from "@/constants/survey-questions";

const DRAFT_KEY = "survey_draft";

function loadDraftFromStorage(): Record<string, number | string | string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed.answers ?? {};
  } catch {
    return {};
  }
}

function loadDraftSavedAt(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw).savedAt ?? null;
  } catch {
    return null;
  }
}

/**
 * Survey Page
 *
 * Step-by-step survey form organized by category.
 * Each category is one "page" of questions.
 * Progress bar shows completion status.
 * Draft auto-saved to localStorage; pre-filled from existing survey on load.
 */
export default function SurveyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Initialize answers from localStorage draft (synchronous, before effects run)
  const [answers, setAnswers] = useState<Record<string, number | string | string[]>>(
    () => loadDraftFromStorage(),
  );

  const [loading, setLoading] = useState(false);
  const [serverLoading, setServerLoading] = useState(true); // 서버 데이터 로드 완료 전 로딩
  const [error, setError] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(() => loadDraftSavedAt());
  const [saveIndicator, setSaveIndicator] = useState(false); // 임시저장 완료 표시

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverLoadDone = useRef(false);

  const categories = [...SURVEY_CATEGORIES];
  const currentCategory = categories[currentStep];
  const questions = getQuestionsByCategory(currentCategory.id);
  const progress = ((currentStep + 1) / categories.length) * 100;

  // 페이지 이동 시 맨 위로 스크롤
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [currentStep]);

  // 프로필 완성 여부 확인 — 미완성이면 setup 페이지로 리다이렉트
  useEffect(() => {
    let cancelled = false;
    async function checkProfile() {
      try {
        const res = await fetch("/api/profile");
        if (cancelled) return;
        if (res.status === 401) { router.push("/login"); return; }
        if (res.status === 404) { router.replace("/profile/setup"); return; }
      } catch {
        // 네트워크 오류 시 무시 (설문 페이지 그대로 유지)
      }
    }
    checkProfile();
    return () => { cancelled = true; };
  }, [router]);

  // 서버에서 기존 설문 데이터 로드 (드래프트 없는 경우에만 적용)
  useEffect(() => {
    let cancelled = false;

    async function loadSurvey() {
      try {
        const res = await fetch("/api/survey");

        if (cancelled) return;
        if (res.status === 401) { router.push("/login"); return; }
        if (res.status === 404 || !res.ok) return;

        const data = await res.json();
        const existingAnswers = data?.answers;

        if (
          existingAnswers &&
          typeof existingAnswers === "object" &&
          !Array.isArray(existingAnswers)
        ) {
          // 서버 데이터가 있으면 항상 서버 데이터를 우선 적용
          // 로컬 드래프트는 서버 제출 이후 stale할 수 있으므로 제거
          setAnswers(existingAnswers);
          try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
        }
      } catch {
        // 프리필 실패는 무시
      } finally {
        serverLoadDone.current = true;
        setServerLoading(false);
      }
    }

    loadSurvey();
    return () => { cancelled = true; };
  }, [router]);

  // 답변 변경 시 자동 임시저장 (1.5초 디바운스, 서버 로드 완료 후에만)
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    if (!serverLoadDone.current) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft(false);
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [answers]); // eslint-disable-line react-hooks/exhaustive-deps

  function saveDraft(showIndicator = true) {
    const savedAt = new Date().toISOString();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, savedAt }));
      setDraftSavedAt(savedAt);
      if (showIndicator) {
        setSaveIndicator(true);
        setTimeout(() => setSaveIndicator(false), 2000);
      }
    } catch {
      // localStorage 저장 실패 무시
    }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setDraftSavedAt(null);
  }

  function updateAnswer(questionId: string, value: number | string | string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleMultiSelect(questionId: string, option: string, maxSelect?: number) {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      const updated = current.includes(option)
        ? current.filter((v) => v !== option)
        : maxSelect && current.length >= maxSelect
          ? current
          : [...current, option];
      return { ...prev, [questionId]: updated };
    });
  }

  function canProceed(): boolean {
    return questions.every((q) => {
      if (!q.required) return true;
      if (q.type === "slider") return true; // 슬라이더는 항상 유효한 값(기본값)을 가짐
      const answer = answers[q.id];
      if (answer === undefined || answer === null) return false;
      if (Array.isArray(answer)) return answer.length > 0;
      if (typeof answer === "string") return answer.length > 0;
      return true;
    });
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      // 사용자가 터치하지 않은 슬라이더는 기본값(min)으로 채움
      const effectiveAnswers = { ...answers };
      for (const q of SURVEY_QUESTIONS) {
        if (q.type === "slider" && q.slider && effectiveAnswers[q.id] === undefined) {
          effectiveAnswers[q.id] = q.slider.min;
        }
      }

      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(effectiveAnswers),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "설문 제출에 실패했습니다.");
      }

      clearDraft();
      router.push("/matches");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // 임시저장 시각 포맷
  function formatSavedAt(iso: string): string {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  if (serverLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Heart className="heart-pulse" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} / {categories.length}
          </span>
          <span className="text-xs font-medium text-primary">
            {currentCategory.label}
          </span>
          {/* 임시저장 시각 표시 */}
          {draftSavedAt && (
            <span className="text-xs text-muted-foreground">
              임시저장 {formatSavedAt(draftSavedAt)}
            </span>
          )}
        </div>
        <div className="score-bar">
          <div className="score-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Category Header */}
      <div className="text-center mb-6">
        <Heart className="mx-auto mb-2" size={24} fill="hsl(340, 82%, 62%)" strokeWidth={0} />
        <h2 className="text-lg font-bold">{currentCategory.label}</h2>
        <p className="text-sm text-muted-foreground">{currentCategory.description}</p>
      </div>

      {error && (
        <div className="card-romantic p-3 mb-4 border-destructive/30 bg-red-50">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={answers[question.id]}
            onChange={(val) => updateAnswer(question.id, val)}
            onToggleMulti={(option) => toggleMultiSelect(question.id, option, question.maxSelect)}
          />
        ))}
      </div>

      {/* Navigation — 하단 네비바 위에 고정 */}
      <div className="fixed bottom-16 left-0 right-0 z-40 px-4 py-2">
        <div className="container mx-auto max-w-lg flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep((s) => s - 1)}
              className="flex items-center justify-center gap-1 py-3 px-4 rounded-xl bg-white border border-gray-200 shadow-sm text-sm font-medium text-muted-foreground hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} /> 이전
            </button>
          )}

          {/* 임시저장 버튼 */}
          <button
            type="button"
            onClick={() => saveDraft(true)}
            className="flex items-center justify-center gap-1 py-3 px-4 rounded-xl bg-white border border-gray-200 shadow-sm text-sm font-medium text-muted-foreground hover:bg-gray-50 transition-colors"
          >
            {saveIndicator ? (
              <>
                <CheckCircle size={15} className="text-primary" />
                <span className="text-primary">저장됨</span>
              </>
            ) : (
              <>
                <Save size={15} />
                임시저장
              </>
            )}
          </button>

          {currentStep < categories.length - 1 ? (
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex-1 btn-gradient flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
            >
              다음 <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="flex-1 btn-gradient shadow-sm disabled:opacity-50"
            >
              {loading ? "제출 중..." : "설문 완료"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 나이차 슬라이더 피커 ───────────────────────────────────
function AgeScrollPicker({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (val: number) => void;
}) {
  const current = value ?? 0;
  const label = current === 0 ? "동갑만" : current === 15 ? "15살 이상" : `${current}살`;
  const pct = (current / 15) * 100;

  return (
    <div className="px-1">
      {/* 현재 값 표시 */}
      <div className="text-center mb-3">
        <span className="text-2xl font-bold text-primary">{label}</span>
      </div>

      {/* 슬라이더 트랙 */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={15}
          step={1}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          className="age-slider w-full"
        />
        {/* 눈금 */}
        <div className="flex justify-between mt-1.5 px-0.5">
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-px h-1.5 ${i === current ? "bg-primary" : "bg-pink-200"}`} />
              {(i === 0 || i === 5 || i === 10 || i === 15) && (
                <span className={`text-[10px] mt-0.5 ${i === current ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  {i === 0 ? "0" : i === 15 ? "15" : i}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-1 text-[11px] text-muted-foreground">
        <span>동갑만</span>
        <span>15살 이상</span>
      </div>

      <style>{`
        .age-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 9999px;
          background: linear-gradient(to right, hsl(340, 82%, 62%) ${pct}%, #fce7f3 ${pct}%);
          outline: none;
          cursor: pointer;
        }
        .age-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 2.5px solid hsl(340, 82%, 62%);
          box-shadow: 0 2px 8px rgba(236, 72, 153, 0.3);
          cursor: grab;
        }
        .age-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 2.5px solid hsl(340, 82%, 62%);
          box-shadow: 0 2px 8px rgba(236, 72, 153, 0.3);
          cursor: grab;
        }
      `}</style>
    </div>
  );
}

// ── Individual Question Card Component ──
function PerspectiveBadge({ perspective }: { perspective: "self" | "partner" }) {
  if (perspective === "partner") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-pink-100 text-primary mb-2">
        💑 원하는 상대에 대해
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 mb-2">
      🙋 나에 대해
    </span>
  );
}

function QuestionCard({
  question,
  value,
  onChange,
  onToggleMulti,
}: {
  question: SurveyQuestion;
  value: number | string | string[] | undefined;
  onChange: (val: number | string | string[]) => void;
  onToggleMulti: (option: string) => void;
}) {
  return (
    <div className="card-romantic p-4">
      <PerspectiveBadge perspective={question.perspective} />
      <label className="block text-sm font-semibold mb-3">{question.label}</label>

      {question.type === "slider" && question.slider && (
        (question.id === "pf_age_gap_older" || question.id === "pf_age_gap_younger") ? (
          // 나이차 전용 드럼롤 피커
          <AgeScrollPicker
            value={value as number | undefined}
            onChange={onChange}
          />
        ) : (
          <div>
            {/* Label row */}
            <div className="flex justify-between mb-3">
              <span className="text-xs text-muted-foreground">{question.slider.minLabel}</span>
              <span className="text-xs text-muted-foreground">{question.slider.maxLabel}</span>
            </div>

            {/* Score buttons — 좌우 스크롤 */}
            <div className="flex gap-1.5 mb-2 py-2 overflow-x-auto scrollbar-hide">
              {Array.from(
                { length: Math.floor((question.slider.max - question.slider.min) / question.slider.step) + 1 },
                (_, i) => question.slider!.min + i * question.slider!.step
              ).map((score) => {
                const isSelected = (value as number) === score || (value === undefined && score === question.slider!.min);
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => onChange(score)}
                    className={`flex-shrink-0 w-9 h-9 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-gradient-to-br from-pink-400 to-pink-500 text-white shadow-lg shadow-pink-200 scale-110"
                        : "bg-pink-50 text-muted-foreground hover:bg-pink-100 hover:scale-105"
                    }`}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>
        )
      )}

      {question.type === "select" && question.options && (
        <div className="space-y-2">
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
                value === option
                  ? "bg-primary text-white"
                  : "bg-pink-50 text-muted-foreground hover:bg-pink-100"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {question.type === "multiselect" && question.options && (
        <div className="flex flex-wrap gap-2">
          {question.options.map((option) => {
            const selected = Array.isArray(value) && value.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggleMulti(option)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selected
                    ? "bg-primary text-white"
                    : "bg-pink-50 text-muted-foreground hover:bg-pink-100"
                }`}
              >
                {option}
              </button>
            );
          })}
          {question.maxSelect && (
            <p className="text-xs text-muted-foreground w-full mt-1">
              최대 {question.maxSelect}개 선택
            </p>
          )}
        </div>
      )}
    </div>
  );
}
