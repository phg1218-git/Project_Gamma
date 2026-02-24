"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ChevronRight, ChevronLeft } from "lucide-react";
import { SURVEY_CATEGORIES, getQuestionsByCategory, type SurveyQuestion } from "@/constants/survey-questions";

/**
 * Survey Page
 *
 * Step-by-step survey form organized by category.
 * Each category is one "page" of questions.
 * Progress bar shows completion status.
 */
export default function SurveyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string | string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [...SURVEY_CATEGORIES];
  const currentCategory = categories[currentStep];
  const questions = getQuestionsByCategory(currentCategory.id);
  const progress = ((currentStep + 1) / categories.length) * 100;

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

      router.push("/matches");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} / {categories.length}
          </span>
          <span className="text-xs font-medium text-primary">
            {currentCategory.label}
          </span>
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
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl border border-pink-200 text-sm font-medium text-muted-foreground hover:bg-pink-50 transition-colors"
          >
            <ChevronLeft size={16} /> 이전
          </button>
        )}
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
