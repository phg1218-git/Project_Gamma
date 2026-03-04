"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ChevronRight, ChevronLeft, Save, CheckCircle } from "lucide-react";
import { SURVEY_CATEGORIES, getQuestionsByCategory, type SurveyQuestion } from "@/constants/survey-questions";

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
  const [error, setError] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(() => loadDraftSavedAt());
  const [saveIndicator, setSaveIndicator] = useState(false); // 임시저장 완료 표시

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categories = [...SURVEY_CATEGORIES];
  const currentCategory = categories[currentStep];
  const questions = getQuestionsByCategory(currentCategory.id);
  const progress = ((currentStep + 1) / categories.length) * 100;

  // 페이지 이동 시 맨 위로 스크롤 + 슬라이더 기본값 초기화
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setAnswers((prev) => {
      const defaults: Record<string, number> = {};
      for (const q of questions) {
        if (q.type === "slider" && q.slider && prev[q.id] === undefined) {
          defaults[q.id] = q.slider.min;
        }
      }
      return Object.keys(defaults).length > 0 ? { ...defaults, ...prev } : prev;
    });
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

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
          // 로컬 드래프트가 없을 때만 서버 데이터로 채움
          setAnswers((prev) => (Object.keys(prev).length === 0 ? existingAnswers : prev));
        }
      } catch {
        // 프리필 실패는 무시
      }
    }

    loadSurvey();
    return () => { cancelled = true; };
  }, [router]);

  // 답변 변경 시 자동 임시저장 (1.5초 디바운스)
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;

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
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
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

  return (
    <div className="animate-fade-in">
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

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep((s) => s - 1)}
            className="flex items-center justify-center gap-1 py-3 px-4 rounded-xl border border-pink-200 text-sm font-medium text-muted-foreground hover:bg-pink-50 transition-colors"
          >
            <ChevronLeft size={16} /> 이전
          </button>
        )}

        {/* 임시저장 버튼 */}
        <button
          type="button"
          onClick={() => saveDraft(true)}
          className="flex items-center justify-center gap-1 py-3 px-4 rounded-xl border border-pink-200 text-sm font-medium text-muted-foreground hover:bg-pink-50 transition-colors"
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
            className="flex-1 btn-gradient flex items-center justify-center gap-1 disabled:opacity-50"
          >
            다음 <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className="flex-1 btn-gradient disabled:opacity-50"
          >
            {loading ? "제출 중..." : "설문 완료"}
          </button>
        )}
      </div>
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
        <div>
          <input
            type="range"
            min={question.slider.min}
            max={question.slider.max}
            step={question.slider.step}
            value={(value as number) || question.slider.min}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">{question.slider.minLabel}</span>
            <span className="text-sm font-medium text-primary">
              {(value as number) || question.slider.min}
            </span>
            <span className="text-xs text-muted-foreground">{question.slider.maxLabel}</span>
          </div>
        </div>
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
