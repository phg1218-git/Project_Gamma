/**
 * 이어줌 — Matching Weight Constants
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  MATCHING SCORE COMPOSITION (Total: 100 points)      │
 * ├──────────────────────────────────────────────────────┤
 * │  Survey Similarity    : 45 points (primary)          │
 * │  Lifestyle Compat.    : 25 points                    │
 * │  Value Alignment      : 20 points                    │
 * │  Personality Weight   : 10 points (bonus)            │
 * └──────────────────────────────────────────────────────┘
 *
 * Design Rationale:
 * - Survey questions capture the most structured preference data,
 *   so they carry the heaviest weight (45%).
 * - Lifestyle compatibility (schedules, habits) is critical for
 *   day-to-day relationship success (25%).
 * - Value alignment (marriage, children, career) affects long-term
 *   compatibility (20%).
 * - Personality (MBTI, introversion, humor) is a bonus signal (10%).
 *   It's useful but less predictive alone.
 */

// ── Top-Level Category Weights (must sum to 100) ──
export const CATEGORY_WEIGHTS = {
  surveySimilarity: 45,
  lifestyle: 25,
  valueAlignment: 20,
  personality: 10,
} as const;

// ── Survey Question → Category Mapping ──
// Maps each survey question ID to the scoring category it belongs to.
export const QUESTION_CATEGORY_MAP: Record<string, keyof typeof CATEGORY_WEIGHTS> = {
  // Dating Values → surveySimilarity
  dv_importance_of_love: "surveySimilarity",
  dv_ideal_relationship_pace: "surveySimilarity",
  dv_physical_affection: "surveySimilarity",
  dv_jealousy_level: "surveySimilarity",
  dv_conflict_resolution: "surveySimilarity",
  dv_deal_with_ex: "surveySimilarity",

  // Lifestyle → lifestyle
  ls_weekend_preference: "lifestyle",
  ls_sleep_schedule: "lifestyle",
  ls_exercise_frequency: "lifestyle",
  ls_spending_habits: "lifestyle",
  ls_cleanliness: "lifestyle",
  ls_pet_preference: "lifestyle",

  // Communication → surveySimilarity (overlaps with core dating values)
  cm_contact_frequency: "surveySimilarity",
  cm_communication_style: "surveySimilarity",
  cm_emotional_expression: "surveySimilarity",
  cm_listening_vs_talking: "surveySimilarity",

  // Future Plans → valueAlignment
  fp_marriage_intent: "valueAlignment",
  fp_children_preference: "valueAlignment",
  fp_career_priority: "valueAlignment",
  fp_living_preference: "valueAlignment",

  // Deep Personality → personality
  pd_introvert_extrovert: "personality",
  pd_spontaneity: "personality",
  pd_risk_tolerance: "personality",
  pd_humor_style: "personality",
  pd_stress_coping: "personality",
} as const;

// ── Individual Question Weight Multipliers ──
// Within each category, some questions matter more.
// Default weight is 1.0. Values > 1.0 mean higher importance.
export const QUESTION_WEIGHTS: Record<string, number> = {
  dv_importance_of_love: 1.2,
  dv_conflict_resolution: 1.3,     // Conflict resolution is very predictive
  fp_marriage_intent: 1.5,         // Marriage intent is a major deal-maker/breaker
  fp_children_preference: 1.4,     // Children is a fundamental life choice
  cm_contact_frequency: 1.1,
  ls_cleanliness: 1.1,
  pd_introvert_extrovert: 1.2,
};

/** Get the weight for a question (default 1.0) */
export function getQuestionWeight(questionId: string): number {
  return QUESTION_WEIGHTS[questionId] || 1.0;
}
