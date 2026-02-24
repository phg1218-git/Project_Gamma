import { SURVEY_QUESTIONS } from "@/constants/survey-questions";
import {
  CATEGORY_WEIGHTS,
  QUESTION_CATEGORY_MAP,
  getQuestionWeight,
} from "./weights";

/**
 * 이어줌 — Matching Scoring Engine
 *
 * Computes compatibility scores between two users based on survey responses.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  SCORING ALGORITHM                                          │
 * │                                                             │
 * │  For each question pair (user A, user B):                   │
 * │                                                             │
 * │  1. Slider questions:                                       │
 * │     similarity = 1 - |A - B| / (max - min)                 │
 * │     → 1.0 = identical, 0.0 = opposite ends                 │
 * │                                                             │
 * │  2. Select questions:                                       │
 * │     similarity = A === B ? 1.0 : 0.0                        │
 * │     → Binary: same choice = full score                      │
 * │                                                             │
 * │  3. Multiselect questions:                                  │
 * │     similarity = |A ∩ B| / |A ∪ B|  (Jaccard index)       │
 * │     → Overlap ratio of selected options                     │
 * │                                                             │
 * │  Each question's similarity is multiplied by its weight     │
 * │  and accumulated into its category bucket.                  │
 * │                                                             │
 * │  Category scores are normalized (0-1) then multiplied       │
 * │  by CATEGORY_WEIGHTS to produce the final 0-100 score.      │
 * └─────────────────────────────────────────────────────────────┘
 */

type SurveyAnswers = Record<string, number | string | string[]>;

export interface ScoreBreakdown {
  surveySimilarity: number;   // 0-45
  lifestyle: number;          // 0-25
  valueAlignment: number;     // 0-20
  personality: number;        // 0-10
  total: number;              // 0-100
}

/**
 * Compute similarity between two slider values.
 * Returns 0.0 (completely different) to 1.0 (identical).
 */
function sliderSimilarity(a: number, b: number, min: number, max: number): number {
  const range = max - min;
  if (range === 0) return 1.0;
  return 1 - Math.abs(a - b) / range;
}

/**
 * Compute similarity between two select values.
 * Binary: 1.0 if same, 0.0 if different.
 */
function selectSimilarity(a: string, b: string): number {
  return a === b ? 1.0 : 0.0;
}

/**
 * Compute Jaccard similarity between two multiselect arrays.
 * |A ∩ B| / |A ∪ B|
 * Returns 0.0 (no overlap) to 1.0 (identical sets).
 */
function multiselectSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Compute the full compatibility score between two users.
 *
 * @param answersA - Survey answers for user A
 * @param answersB - Survey answers for user B
 * @returns ScoreBreakdown with per-category and total scores
 */
export function computeCompatibilityScore(
  answersA: SurveyAnswers,
  answersB: SurveyAnswers,
): ScoreBreakdown {
  // Accumulate weighted similarities per category
  const categoryScores: Record<string, { total: number; weightSum: number }> = {
    surveySimilarity: { total: 0, weightSum: 0 },
    lifestyle: { total: 0, weightSum: 0 },
    valueAlignment: { total: 0, weightSum: 0 },
    personality: { total: 0, weightSum: 0 },
  };

  for (const question of SURVEY_QUESTIONS) {
    const valA = answersA[question.id];
    const valB = answersB[question.id];

    // Skip if either user hasn't answered this question
    if (valA === undefined || valB === undefined) continue;

    let similarity = 0;

    switch (question.type) {
      case "slider":
        similarity = sliderSimilarity(
          valA as number,
          valB as number,
          question.slider!.min,
          question.slider!.max,
        );
        break;

      case "select":
        similarity = selectSimilarity(valA as string, valB as string);
        break;

      case "multiselect":
        similarity = multiselectSimilarity(valA as string[], valB as string[]);
        break;
    }

    // Apply question-specific weight multiplier
    const weight = getQuestionWeight(question.id);
    const category = QUESTION_CATEGORY_MAP[question.id];

    if (category && categoryScores[category]) {
      categoryScores[category].total += similarity * weight;
      categoryScores[category].weightSum += weight;
    }
  }

  // Normalize each category to 0-1, then scale by category weight
  const breakdown: ScoreBreakdown = {
    surveySimilarity: 0,
    lifestyle: 0,
    valueAlignment: 0,
    personality: 0,
    total: 0,
  };

  for (const [category, { total, weightSum }] of Object.entries(categoryScores)) {
    const normalized = weightSum > 0 ? total / weightSum : 0; // 0-1
    const categoryKey = category as keyof typeof CATEGORY_WEIGHTS;
    const scaled = normalized * CATEGORY_WEIGHTS[categoryKey]; // 0-maxWeight
    breakdown[categoryKey] = Math.round(scaled * 100) / 100;
  }

  breakdown.total = Math.round(
    (breakdown.surveySimilarity +
      breakdown.lifestyle +
      breakdown.valueAlignment +
      breakdown.personality) * 100,
  ) / 100;

  return breakdown;
}
