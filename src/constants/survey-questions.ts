/**
 * 이어줌 (Connecting) — Survey Question Definitions
 *
 * IMPORTANT: Do NOT rename question IDs. They are used as keys
 * in the SurveyResponse JSON blob and in the matching engine.
 *
 * Types:
 *   - slider: numeric range (min/max/step)
 *   - select: single choice from options
 *   - multiselect: multiple choices from options
 *
 * Categories group questions for UI sections and matching weight buckets.
 */

export type SurveyQuestionType = "slider" | "select" | "multiselect";

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
}

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  category: string;
  label: string;           // Korean question text
  description?: string;    // Optional helper text
  required: boolean;
  options?: string[];      // For select/multiselect
  slider?: SliderConfig;   // For slider type
  maxSelect?: number;      // Max selections for multiselect
}

// ── Survey Categories ──
export const SURVEY_CATEGORIES = [
  { id: "dating_values", label: "연애관", description: "연애에 대한 가치관" },
  { id: "lifestyle", label: "라이프스타일", description: "일상 생활 패턴" },
  { id: "communication", label: "소통 방식", description: "대화와 소통 스타일" },
  { id: "future_plans", label: "미래 계획", description: "장기적인 목표와 계획" },
  { id: "personality_deep", label: "성격 심층", description: "더 깊은 성격 파악" },
] as const;

// ── Survey Questions ──
export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  // ━━━ 연애관 (Dating Values) ━━━
  {
    id: "dv_importance_of_love",
    type: "slider",
    category: "dating_values",
    label: "인생에서 연애의 중요도는?",
    required: true,
    slider: { min: 1, max: 10, step: 1, minLabel: "낮음", maxLabel: "매우 높음" },
  },
  {
    id: "dv_ideal_relationship_pace",
    type: "select",
    category: "dating_values",
    label: "이상적인 연애 진행 속도는?",
    required: true,
    options: ["천천히 알아가기", "자연스러운 흐름", "빠르게 확인하기", "상대에 맞추기"],
  },
  {
    id: "dv_physical_affection",
    type: "slider",
    category: "dating_values",
    label: "스킨십에 대한 적극성은?",
    required: true,
    slider: { min: 1, max: 10, step: 1, minLabel: "소극적", maxLabel: "적극적" },
  },
  {
    id: "dv_jealousy_level",
    type: "slider",
    category: "dating_values",
    label: "질투의 정도는?",
    required: true,
    slider: { min: 1, max: 10, step: 1, minLabel: "전혀 안 함", maxLabel: "많이 함" },
  },
  {
    id: "dv_conflict_resolution",
    type: "select",
    category: "dating_values",
    label: "갈등 해결 방식은?",
    required: true,
    options: ["바로 대화", "시간을 두고 대화", "편지/메시지로 전달", "자연스럽게 풀리길 기다림"],
  },
  {
    id: "dv_deal_with_ex",
    type: "select",
    category: "dating_values",
    label: "전 연인과의 관계는?",
    required: true,
    options: ["완전 연락 안 함", "인사 정도는 함", "친구로 지냄", "상관없음"],
  },

  // ━━━ 라이프스타일 (Lifestyle) ━━━
  {
    id: "ls_weekend_preference",
    type: "select",
    category: "lifestyle",
    label: "주말에 주로 하는 활동은?",
    required: true,
    options: ["집에서 쉬기", "야외 활동", "문화생활", "친구 만남", "자기개발"],
  },
  {
    id: "ls_sleep_schedule",
    type: "select",
    category: "lifestyle",
    label: "주로 몇 시에 자나요?",
    required: true,
    options: ["10시 이전", "10시~12시", "12시~2시", "2시 이후"],
  },
  {
    id: "ls_exercise_frequency",
    type: "select",
    category: "lifestyle",
    label: "운동 빈도는?",
    required: true,
    options: ["거의 안 함", "주 1-2회", "주 3-4회", "거의 매일"],
  },
  {
    id: "ls_spending_habits",
    type: "slider",
    category: "lifestyle",
    label: "소비 성향은? (절약형 vs 소비형)",
    required: true,
    slider: { min: 1, max: 10, step: 1, minLabel: "절약형", maxLabel: "소비형" },
  },
  {
    id: "ls_cleanliness",
    type: "slider",
    category: "lifestyle",
    label: "정리정돈/청결 수준은?",
    required: true,
    slider: { min: 1, max: 10, step: 1, minLabel: "자유로움", maxLabel: "깔끔함" },
  },
  {
    id: "ls_pet_preference",
    type: "select",
    category: "lifestyle",
    label: "반려동물에 대한 생각은?",
    required: true,
    options: ["키우고 있음", "키우고 싶음", "상관없음", "선호하지 않음"],
  },

  // ━━━ 소통 방식 (Communication) ━━━
  {
    id: "cm_contact_frequency",
    type: "select",
    category: "communication",
    label: "연인과의 이상적인 연락 빈도는?",
    required: true,
    options: ["수시로 연락", "하루 몇 번", "하루 1번", "필요할 때만"],
  },
  {
    id: "cm_communication_style",
    type: "select",
    category: "communication",
    label: "선호하는 소통 방식은?",
    required: true,
    options: ["전화", "문자/카카오톡", "직접 만남", "영상통화"],
  },
  {
    id: "cm_emotional_expression",
    type: "slider",
    category: "communication",
    label: "감정 표현의 정도는?",
    required: true,
    slider: { min: 1, max: 10, step: 1, minLabel: "표현 안 함", maxLabel: "적극 표현" },
  },
  {
    id: "cm_listening_vs_talking",
    type: "slider",
    category: "communication",
    label: "대화에서의 역할은? (듣기 vs 말하기)",
    required: true,
    slider: { min: 1, max: 10, step: 1, minLabel: "듣기형", maxLabel: "말하기형" },
  },

  // ━━━ 미래 계획 (Future Plans) ━━━
  {
    id: "fp_marriage_intent",
    type: "select",
    category: "future_plans",
    label: "결혼에 대한 생각은?",
    required: true,
    options: ["빠르게 하고 싶음", "천천히 생각 중", "아직 모르겠음", "결혼 생각 없음"],
  },
  {
    id: "fp_children_preference",
    type: "select",
    category: "future_plans",
    label: "자녀 계획은?",
    required: true,
    options: ["꼭 갖고 싶음", "있으면 좋겠음", "아직 모르겠음", "갖고 싶지 않음"],
  },
  {
    id: "fp_career_priority",
    type: "slider",
    category: "future_plans",
    label: "커리어 우선순위는?",
    required: true,
    slider: { min: 1, max: 10, step: 1, minLabel: "여유로운 삶", maxLabel: "커리어 우선" },
  },
  {
    id: "fp_living_preference",
    type: "select",
    category: "future_plans",
    label: "선호하는 거주 형태는?",
    required: true,
    options: ["도시 중심", "도시 외곽", "교외/시골", "상관없음"],
  },

  // ━━━ 성격 심층 (Deep Personality) ━━━
  {
    id: "pd_introvert_extrovert",
    type: "slider",
    category: "personality_deep",
    label: "내향적 vs 외향적?",
    required: true,
    slider: { min: 1, max: 10, step: 1, minLabel: "내향적", maxLabel: "외향적" },
  },
  {
    id: "pd_spontaneity",
    type: "slider",
    category: "personality_deep",
    label: "즉흥적 vs 계획적?",
    required: true,
    slider: { min: 1, max: 10, step: 1, minLabel: "즉흥적", maxLabel: "계획적" },
  },
  {
    id: "pd_risk_tolerance",
    type: "slider",
    category: "personality_deep",
    label: "도전 성향은?",
    required: true,
    slider: { min: 1, max: 10, step: 1, minLabel: "안정 추구", maxLabel: "도전 추구" },
  },
  {
    id: "pd_humor_style",
    type: "multiselect",
    category: "personality_deep",
    label: "유머 스타일은? (복수 선택)",
    required: true,
    options: ["말장난/언어유머", "상황극/리액션", "블랙코미디", "자기비하", "따뜻한 유머"],
    maxSelect: 3,
  },
  {
    id: "pd_stress_coping",
    type: "select",
    category: "personality_deep",
    label: "스트레스 해소 방법은?",
    required: true,
    options: ["혼자 시간 보내기", "사람 만나기", "운동/활동", "먹기/마시기", "잠자기"],
  },
];

/**
 * Get questions by category ID.
 */
export function getQuestionsByCategory(categoryId: string): SurveyQuestion[] {
  return SURVEY_QUESTIONS.filter((q) => q.category === categoryId);
}

/**
 * Get all question IDs (for validation).
 */
export function getAllQuestionIds(): string[] {
  return SURVEY_QUESTIONS.map((q) => q.id);
}
