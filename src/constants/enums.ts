/**
 * 이어줌 (Connecting) — Enum Label Maps
 *
 * All Prisma enums use English identifiers.
 * This file provides Korean display labels for the UI.
 * Always use these maps for rendering — never hardcode Korean strings in components.
 */

// ── 성별 (Gender) ──
export const GENDER_LABELS: Record<string, string> = {
  MALE: "남성",
  FEMALE: "여성",
};

// ── 직업 대분류 (Job Category) ──
export const JOB_CATEGORY_LABELS: Record<string, string> = {
  OFFICE: "사무/행정",
  IT: "IT/개발",
  DESIGN: "디자인",
  MARKETING: "마케팅/광고",
  SALES: "영업",
  FINANCE: "금융/회계",
  EDUCATION: "교육",
  MEDICAL: "의료/보건",
  LAW: "법률",
  ENGINEERING: "공학/기술",
  MEDIA: "미디어/방송",
  SERVICE: "서비스업",
  PUBLIC: "공무원/공공",
  FREELANCE: "프리랜서",
  STUDENT: "학생",
  OTHER: "기타",
};

// ── MBTI ──
export const MBTI_OPTIONS = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
] as const;

// ── 혈액형 (Blood Type) ──
export const BLOOD_TYPE_LABELS: Record<string, string> = {
  A: "A형",
  B: "B형",
  O: "O형",
  AB: "AB형",
};

// ── 종교 (Religion) ──
export const RELIGION_LABELS: Record<string, string> = {
  NONE: "무교",
  CHRISTIANITY: "기독교",
  CATHOLICISM: "천주교",
  BUDDHISM: "불교",
  OTHER: "기타",
};

// ── 음주 (Drinking) ──
export const DRINKING_LABELS: Record<string, string> = {
  NEVER: "전혀 안 함",
  RARELY: "거의 안 함",
  SOMETIMES: "가끔",
  OFTEN: "자주",
};

// ── 흡연 (Smoking) ──
export const SMOKING_LABELS: Record<string, string> = {
  NEVER: "비흡연",
  QUIT: "금연 중",
  SOMETIMES: "가끔",
  OFTEN: "흡연",
};

// ── 매칭 상태 (Match Status) ──
export const MATCH_STATUS_LABELS: Record<string, string> = {
  PENDING: "대기 중",
  ACCEPTED: "수락됨",
  REJECTED: "거절됨",
  EXPIRED: "만료됨",
};

// ── 취미 선택지 (Hobby Options) ──
export const HOBBY_OPTIONS = [
  "운동/피트니스",
  "독서",
  "영화/드라마",
  "음악감상",
  "요리",
  "여행",
  "게임",
  "등산",
  "카페탐방",
  "사진/촬영",
  "그림/미술",
  "반려동물",
  "봉사활동",
  "명상/요가",
  "쇼핑",
  "스포츠관람",
  "캠핑",
  "보드게임",
  "와인/맥주",
  "악기연주",
] as const;

// ── 선호사항 (Preference Options) ──
export const PREFERENCE_OPTIONS = [
  "유머감각",
  "진지한 대화",
  "신체활동",
  "문화생활",
  "집에서 쉬기",
  "야외활동",
  "맛집탐방",
  "자기개발",
  "파티/모임",
  "조용한 분위기",
] as const;

// ── 비선호 조건 (Disliked Conditions) ──
export const DISLIKED_CONDITIONS = [
  "흡연자",
  "과음자",
  "종교차이",
  "나이차이 큰 경우",
  "장거리",
  "직업 불안정",
  "반려동물 못 키우는 경우",
  "운동 안 하는 경우",
] as const;
