import { PrismaClient, Prisma } from "@prisma/client";

/**
 * TEST-ONLY seed script for matching QA data — 5 males, 5 females.
 *
 * Designed to exercise the full matching pipeline:
 *   - Hard filters: 거주지(서울 통일), 흡연/음주/종교 dealbreaker 없음
 *   - Soft scoring: 다양한 성향 분포 → 고점/중점/저점 매치 모두 발생
 *
 * Safe cleanup target: any user whose email starts with "dummy_".
 */

const prisma = new PrismaClient();

async function upsertUser(input: {
  email: string;
  name: string;
  profile: Omit<Prisma.ProfileUncheckedCreateInput, "userId">;
  surveyAnswers: Record<string, number | string | string[]>;
}) {
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: { name: input.name, profileComplete: true },
    create: { email: input.email, name: input.name, profileComplete: true },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { ...input.profile, stopMatching: false },
    create: { ...input.profile, userId: user.id, stopMatching: false },
  });

  await prisma.surveyResponse.upsert({
    where: { userId: user.id },
    update: { answers: input.surveyAnswers as Prisma.InputJsonValue },
    create: {
      userId: user.id,
      answers: input.surveyAnswers as Prisma.InputJsonValue,
    },
  });

  return user;
}

// ────────────────────────────────────────────────
// MALES (5명)
// ────────────────────────────────────────────────

/**
 * M1 · 김민준 · 29세 · IT 백엔드
 * 내향적 / 계획적 / 절약 / 커리어 중시 / 결혼 천천히
 * → F2(이지우)와 높은 매치 기대 (IT·내향·계획 공통)
 */
const m1 = {
  email: "dummy_m1_minjun@example.com",
  name: "dummy_김민준",
  profile: {
    gender: "MALE" as const,
    dateOfBirth: new Date("1996-07-14"),
    nickname: "민준",
    height: 178,
    jobCategory: "IT" as const,
    jobDetail: "백엔드 개발자",
    companyLocation: "서울특별시|강남구",
    residenceLocation: "서울특별시|관악구",
    hometownLocation: "경기도|수원시",
    personality: "[TEST_DATA] 조용하고 논리적인 편. 깊은 대화를 좋아하며 신중하게 행동합니다.",
    hobbies: ["독서", "게임", "카페탐방"],
    preferences: ["지적인 대화", "독립적인 생활", "가치관 일치"],
    mbti: "INTJ" as const,
    bloodType: "A" as const,
    religion: "NONE" as const,
    drinking: "RARELY" as const,
    smoking: "NEVER" as const,
    dislikedConditions: [],
    minMatchScore: 0,
  },
  surveyAnswers: {
    dv_importance_of_love: 6,
    dv_ideal_relationship_pace: "천천히 알아가기",
    dv_physical_affection: 4,
    dv_jealousy_level: 3,
    dv_conflict_resolution: "시간을 두고 대화",
    dv_deal_with_ex: "완전 연락 안 함",
    ls_weekend_preference: "자기개발",
    ls_sleep_schedule: "12시~2시",
    ls_exercise_frequency: "거의 안 함",
    ls_spending_habits: 3,
    ls_cleanliness: 7,
    ls_pet_preference: "상관없음",
    cm_contact_frequency: "하루 1번",
    cm_communication_style: "문자/카카오톡",
    cm_emotional_expression: 4,
    cm_listening_vs_talking: 3,
    fp_marriage_intent: "천천히 생각 중",
    fp_children_preference: "있으면 좋겠음",
    fp_career_priority: 8,
    fp_living_preference: "도시 중심",
    pd_introvert_extrovert: 2,
    pd_spontaneity: 8,
    pd_risk_tolerance: 3,
    pd_humor_style: ["말장난/언어유머", "블랙코미디"],
    pd_stress_coping: "혼자 시간 보내기",
  },
};

/**
 * M2 · 이준혁 · 32세 · 의료(의사)
 * 외향적 / 즉흥적 / 결혼 적극 / 커리어 중시 / 활동적
 * → F4(최수아)와 중~상 매치 기대 (외향·즉흥 공통)
 */
const m2 = {
  email: "dummy_m2_junhyuk@example.com",
  name: "dummy_이준혁",
  profile: {
    gender: "MALE" as const,
    dateOfBirth: new Date("1993-03-22"),
    nickname: "준혁",
    height: 182,
    jobCategory: "MEDICAL" as const,
    jobDetail: "내과 전공의",
    companyLocation: "서울특별시|종로구",
    residenceLocation: "서울특별시|마포구",
    hometownLocation: "부산광역시|해운대구",
    personality: "[TEST_DATA] 에너지 넘치고 주변을 밝게 만드는 편. 새로운 경험을 즐깁니다.",
    hobbies: ["등산", "맛집탐방", "여행"],
    preferences: ["활발한 성격", "유머감각", "긍정적인 마인드"],
    mbti: "ENFJ" as const,
    bloodType: "O" as const,
    religion: "NONE" as const,
    drinking: "SOMETIMES" as const,
    smoking: "NEVER" as const,
    dislikedConditions: [],
    minMatchScore: 0,
  },
  surveyAnswers: {
    dv_importance_of_love: 9,
    dv_ideal_relationship_pace: "빠르게 확인하기",
    dv_physical_affection: 8,
    dv_jealousy_level: 5,
    dv_conflict_resolution: "바로 대화",
    dv_deal_with_ex: "인사 정도는 함",
    ls_weekend_preference: "야외 활동",
    ls_sleep_schedule: "10시~12시",
    ls_exercise_frequency: "거의 매일",
    ls_spending_habits: 7,
    ls_cleanliness: 6,
    ls_pet_preference: "키우고 싶음",
    cm_contact_frequency: "수시로 연락",
    cm_communication_style: "전화",
    cm_emotional_expression: 8,
    cm_listening_vs_talking: 7,
    fp_marriage_intent: "빠르게 하고 싶음",
    fp_children_preference: "꼭 갖고 싶음",
    fp_career_priority: 7,
    fp_living_preference: "도시 중심",
    pd_introvert_extrovert: 8,
    pd_spontaneity: 3,
    pd_risk_tolerance: 7,
    pd_humor_style: ["상황극/리액션", "따뜻한 유머"],
    pd_stress_coping: "사람 만나기",
  },
};

/**
 * M3 · 박재원 · 27세 · 금융
 * 내향적 / 즉흥적 / 투자형 / 결혼 미정 / 감성적
 * → 전반적으로 중간 매치들 (독특한 성향 조합)
 */
const m3 = {
  email: "dummy_m3_jaewon@example.com",
  name: "dummy_박재원",
  profile: {
    gender: "MALE" as const,
    dateOfBirth: new Date("1998-11-05"),
    nickname: "재원",
    height: 175,
    jobCategory: "FINANCE" as const,
    jobDetail: "자산운용사 애널리스트",
    companyLocation: "서울특별시|영등포구",
    residenceLocation: "서울특별시|용산구",
    hometownLocation: "서울특별시|성동구",
    personality: "[TEST_DATA] 감성적이고 예술을 좋아합니다. 깊이 있는 사람을 좋아해요.",
    hobbies: ["전시회", "재즈바", "영화감상"],
    preferences: ["감성적인 대화", "취향 공유", "여유로운 성격"],
    mbti: "INFP" as const,
    bloodType: "B" as const,
    religion: "NONE" as const,
    drinking: "SOMETIMES" as const,
    smoking: "NEVER" as const,
    dislikedConditions: [],
    minMatchScore: 0,
  },
  surveyAnswers: {
    dv_importance_of_love: 8,
    dv_ideal_relationship_pace: "자연스러운 흐름",
    dv_physical_affection: 6,
    dv_jealousy_level: 4,
    dv_conflict_resolution: "편지/메시지로 전달",
    dv_deal_with_ex: "친구로 지냄",
    ls_weekend_preference: "문화생활",
    ls_sleep_schedule: "2시 이후",
    ls_exercise_frequency: "주 1-2회",
    ls_spending_habits: 7,
    ls_cleanliness: 5,
    ls_pet_preference: "키우고 있음",
    cm_contact_frequency: "하루 몇 번",
    cm_communication_style: "문자/카카오톡",
    cm_emotional_expression: 7,
    cm_listening_vs_talking: 4,
    fp_marriage_intent: "아직 모르겠음",
    fp_children_preference: "아직 모르겠음",
    fp_career_priority: 4,
    fp_living_preference: "도시 중심",
    pd_introvert_extrovert: 3,
    pd_spontaneity: 2,
    pd_risk_tolerance: 6,
    pd_humor_style: ["블랙코미디", "말장난/언어유머"],
    pd_stress_coping: "혼자 시간 보내기",
  },
};

/**
 * M4 · 최현우 · 30세 · 교육(중학교 체육교사)
 * 외향적 / 즉흥적 / 결혼 적극 / 활동적 / 유머 있음
 * → F1(김서연)과 중~상 매치 기대 (외향·활동·유머 공통)
 */
const m4 = {
  email: "dummy_m4_hyunwoo@example.com",
  name: "dummy_최현우",
  profile: {
    gender: "MALE" as const,
    dateOfBirth: new Date("1995-08-19"),
    nickname: "현우",
    height: 180,
    jobCategory: "EDUCATION" as const,
    jobDetail: "중학교 체육교사",
    companyLocation: "서울특별시|노원구",
    residenceLocation: "서울특별시|노원구",
    hometownLocation: "경기도|의정부시",
    personality: "[TEST_DATA] 활발하고 사람 좋아하는 스타일. 함께 있으면 즐거운 사람이 되고 싶어요.",
    hobbies: ["풋살", "농구", "캠핑"],
    preferences: ["긍정적인 에너지", "함께하는 활동", "솔직한 성격"],
    mbti: "ESTP" as const,
    bloodType: "O" as const,
    religion: "NONE" as const,
    drinking: "SOMETIMES" as const,
    smoking: "NEVER" as const,
    dislikedConditions: [],
    minMatchScore: 0,
  },
  surveyAnswers: {
    dv_importance_of_love: 8,
    dv_ideal_relationship_pace: "빠르게 확인하기",
    dv_physical_affection: 9,
    dv_jealousy_level: 6,
    dv_conflict_resolution: "바로 대화",
    dv_deal_with_ex: "완전 연락 안 함",
    ls_weekend_preference: "친구 만남",
    ls_sleep_schedule: "12시~2시",
    ls_exercise_frequency: "주 3-4회",
    ls_spending_habits: 5,
    ls_cleanliness: 6,
    ls_pet_preference: "키우고 싶음",
    cm_contact_frequency: "수시로 연락",
    cm_communication_style: "직접 만남",
    cm_emotional_expression: 7,
    cm_listening_vs_talking: 7,
    fp_marriage_intent: "빠르게 하고 싶음",
    fp_children_preference: "꼭 갖고 싶음",
    fp_career_priority: 5,
    fp_living_preference: "도시 외곽",
    pd_introvert_extrovert: 9,
    pd_spontaneity: 3,
    pd_risk_tolerance: 8,
    pd_humor_style: ["상황극/리액션", "따뜻한 유머", "자기비하"],
    pd_stress_coping: "운동/활동",
  },
};

/**
 * M5 · 정성호 · 33세 · 공무원
 * 내향적 / 계획적 / 절약형 / 결혼 적극 / 안정 추구
 * → F3(박민지), F5(정하은)과 높은 매치 기대 (결혼·계획·내향 공통)
 */
const m5 = {
  email: "dummy_m5_sungho@example.com",
  name: "dummy_정성호",
  profile: {
    gender: "MALE" as const,
    dateOfBirth: new Date("1992-01-30"),
    nickname: "성호",
    height: 176,
    jobCategory: "PUBLIC" as const,
    jobDetail: "행정직 공무원",
    companyLocation: "서울특별시|중구",
    residenceLocation: "서울특별시|동작구",
    hometownLocation: "충청남도|천안시",
    personality: "[TEST_DATA] 성실하고 믿음직한 편. 가정적이고 안정적인 삶을 중요하게 생각합니다.",
    hobbies: ["요리", "독서", "조깅"],
    preferences: ["가정적인 성격", "성실함", "배려심"],
    mbti: "ISTJ" as const,
    bloodType: "A" as const,
    religion: "NONE" as const,
    drinking: "RARELY" as const,
    smoking: "NEVER" as const,
    dislikedConditions: [],
    minMatchScore: 0,
  },
  surveyAnswers: {
    dv_importance_of_love: 7,
    dv_ideal_relationship_pace: "천천히 알아가기",
    dv_physical_affection: 5,
    dv_jealousy_level: 4,
    dv_conflict_resolution: "시간을 두고 대화",
    dv_deal_with_ex: "완전 연락 안 함",
    ls_weekend_preference: "집에서 쉬기",
    ls_sleep_schedule: "10시~12시",
    ls_exercise_frequency: "주 3-4회",
    ls_spending_habits: 2,
    ls_cleanliness: 9,
    ls_pet_preference: "선호하지 않음",
    cm_contact_frequency: "하루 1번",
    cm_communication_style: "문자/카카오톡",
    cm_emotional_expression: 5,
    cm_listening_vs_talking: 3,
    fp_marriage_intent: "빠르게 하고 싶음",
    fp_children_preference: "꼭 갖고 싶음",
    fp_career_priority: 4,
    fp_living_preference: "도시 외곽",
    pd_introvert_extrovert: 2,
    pd_spontaneity: 9,
    pd_risk_tolerance: 2,
    pd_humor_style: ["따뜻한 유머", "말장난/언어유머"],
    pd_stress_coping: "혼자 시간 보내기",
  },
};

// ────────────────────────────────────────────────
// FEMALES (5명)
// ────────────────────────────────────────────────

/**
 * F1 · 김서연 · 27세 · 마케팅
 * 외향적 / 즉흥적 / 활발 / 결혼 천천히 / 문화생활
 * → M4(최현우)와 중~상 매치 기대 (외향·즉흥·활발 공통)
 */
const f1 = {
  email: "dummy_f1_seoyeon@example.com",
  name: "dummy_김서연",
  profile: {
    gender: "FEMALE" as const,
    dateOfBirth: new Date("1998-04-07"),
    nickname: "서연",
    height: 163,
    jobCategory: "MARKETING" as const,
    jobDetail: "SNS 마케터",
    companyLocation: "서울특별시|강남구",
    residenceLocation: "서울특별시|강남구",
    hometownLocation: "서울특별시|강동구",
    personality: "[TEST_DATA] 트렌드에 민감하고 활발한 편. 새로운 사람 만나는 걸 좋아합니다.",
    hobbies: ["전시회", "맛집탐방", "쇼핑"],
    preferences: ["유머감각", "사교적인 성격", "함께 즐길 수 있는 취미"],
    celebrity: "아이유",
    mbti: "ENFP" as const,
    bloodType: "AB" as const,
    religion: "NONE" as const,
    drinking: "SOMETIMES" as const,
    smoking: "NEVER" as const,
    dislikedConditions: [],
    minMatchScore: 0,
  },
  surveyAnswers: {
    dv_importance_of_love: 8,
    dv_ideal_relationship_pace: "자연스러운 흐름",
    dv_physical_affection: 7,
    dv_jealousy_level: 5,
    dv_conflict_resolution: "바로 대화",
    dv_deal_with_ex: "인사 정도는 함",
    ls_weekend_preference: "문화생활",
    ls_sleep_schedule: "12시~2시",
    ls_exercise_frequency: "주 1-2회",
    ls_spending_habits: 7,
    ls_cleanliness: 6,
    ls_pet_preference: "키우고 싶음",
    cm_contact_frequency: "하루 몇 번",
    cm_communication_style: "문자/카카오톡",
    cm_emotional_expression: 8,
    cm_listening_vs_talking: 6,
    fp_marriage_intent: "천천히 생각 중",
    fp_children_preference: "있으면 좋겠음",
    fp_career_priority: 6,
    fp_living_preference: "도시 중심",
    pd_introvert_extrovert: 7,
    pd_spontaneity: 3,
    pd_risk_tolerance: 6,
    pd_humor_style: ["상황극/리액션", "따뜻한 유머"],
    pd_stress_coping: "사람 만나기",
  },
};

/**
 * F2 · 이지우 · 28세 · IT(프론트엔드)
 * 내향적 / 계획적 / 커리어 중시 / 결혼 천천히
 * → M1(김민준)과 높은 매치 기대 (IT·내향·계획·절약 공통)
 */
const f2 = {
  email: "dummy_f2_jiwoo@example.com",
  name: "dummy_이지우",
  profile: {
    gender: "FEMALE" as const,
    dateOfBirth: new Date("1997-09-18"),
    nickname: "지우",
    height: 165,
    jobCategory: "IT" as const,
    jobDetail: "프론트엔드 개발자",
    companyLocation: "서울특별시|서초구",
    residenceLocation: "서울특별시|관악구",
    hometownLocation: "경기도|안양시",
    personality: "[TEST_DATA] 논리적이고 독립적인 성격. 혼자만의 시간이 중요하지만 깊은 관계를 소중히 여깁니다.",
    hobbies: ["독서", "코딩", "산책"],
    preferences: ["지적인 대화", "개인 공간 존중", "솔직함"],
    mbti: "INTP" as const,
    bloodType: "A" as const,
    religion: "NONE" as const,
    drinking: "RARELY" as const,
    smoking: "NEVER" as const,
    dislikedConditions: [],
    minMatchScore: 0,
  },
  surveyAnswers: {
    dv_importance_of_love: 6,
    dv_ideal_relationship_pace: "천천히 알아가기",
    dv_physical_affection: 4,
    dv_jealousy_level: 2,
    dv_conflict_resolution: "시간을 두고 대화",
    dv_deal_with_ex: "완전 연락 안 함",
    ls_weekend_preference: "자기개발",
    ls_sleep_schedule: "12시~2시",
    ls_exercise_frequency: "거의 안 함",
    ls_spending_habits: 3,
    ls_cleanliness: 8,
    ls_pet_preference: "상관없음",
    cm_contact_frequency: "하루 1번",
    cm_communication_style: "문자/카카오톡",
    cm_emotional_expression: 3,
    cm_listening_vs_talking: 4,
    fp_marriage_intent: "천천히 생각 중",
    fp_children_preference: "아직 모르겠음",
    fp_career_priority: 8,
    fp_living_preference: "도시 중심",
    pd_introvert_extrovert: 2,
    pd_spontaneity: 7,
    pd_risk_tolerance: 4,
    pd_humor_style: ["블랙코미디", "말장난/언어유머"],
    pd_stress_coping: "혼자 시간 보내기",
  },
};

/**
 * F3 · 박민지 · 29세 · 의료(간호사)
 * 내향적 / 계획적 / 절약형 / 결혼 적극 / 따뜻함
 * → M5(정성호)과 높은 매치 기대 (결혼·내향·계획·절약 공통)
 */
const f3 = {
  email: "dummy_f3_minji@example.com",
  name: "dummy_박민지",
  profile: {
    gender: "FEMALE" as const,
    dateOfBirth: new Date("1996-12-03"),
    nickname: "민지",
    height: 161,
    jobCategory: "MEDICAL" as const,
    jobDetail: "병원 간호사",
    companyLocation: "서울특별시|종로구",
    residenceLocation: "서울특별시|은평구",
    hometownLocation: "전라북도|전주시",
    personality: "[TEST_DATA] 따뜻하고 배려 깊은 성격. 가족과 안정적인 삶을 꿈꿉니다.",
    hobbies: ["요리", "꽃꽂이", "넷플릭스"],
    preferences: ["성실하고 가정적인 성격", "안정적인 직업", "따뜻한 마음"],
    mbti: "ISFJ" as const,
    bloodType: "A" as const,
    religion: "CATHOLICISM" as const,
    drinking: "RARELY" as const,
    smoking: "NEVER" as const,
    dislikedConditions: ["흡연자"],
    minMatchScore: 0,
  },
  surveyAnswers: {
    dv_importance_of_love: 9,
    dv_ideal_relationship_pace: "천천히 알아가기",
    dv_physical_affection: 6,
    dv_jealousy_level: 5,
    dv_conflict_resolution: "바로 대화",
    dv_deal_with_ex: "완전 연락 안 함",
    ls_weekend_preference: "집에서 쉬기",
    ls_sleep_schedule: "10시~12시",
    ls_exercise_frequency: "주 1-2회",
    ls_spending_habits: 3,
    ls_cleanliness: 9,
    ls_pet_preference: "키우고 있음",
    cm_contact_frequency: "하루 몇 번",
    cm_communication_style: "전화",
    cm_emotional_expression: 7,
    cm_listening_vs_talking: 3,
    fp_marriage_intent: "빠르게 하고 싶음",
    fp_children_preference: "꼭 갖고 싶음",
    fp_career_priority: 5,
    fp_living_preference: "도시 외곽",
    pd_introvert_extrovert: 3,
    pd_spontaneity: 7,
    pd_risk_tolerance: 3,
    pd_humor_style: ["따뜻한 유머", "상황극/리액션"],
    pd_stress_coping: "잠자기",
  },
};

/**
 * F4 · 최수아 · 26세 · 디자인
 * 외향적 / 즉흥적 / 투자형 / 결혼 미정 / 창의적
 * → M2(이준혁)과 중~상 매치 기대 (외향·즉흥·활동적 공통)
 */
const f4 = {
  email: "dummy_f4_sua@example.com",
  name: "dummy_최수아",
  profile: {
    gender: "FEMALE" as const,
    dateOfBirth: new Date("1999-06-25"),
    nickname: "수아",
    height: 167,
    jobCategory: "DESIGN" as const,
    jobDetail: "UX/UI 디자이너",
    companyLocation: "서울특별시|마포구",
    residenceLocation: "서울특별시|마포구",
    hometownLocation: "경기도|고양시",
    personality: "[TEST_DATA] 창의적이고 자유로운 영혼. 예술과 여행을 통해 영감을 얻습니다.",
    hobbies: ["여행", "사진", "미술관"],
    preferences: ["창의적인 생각", "자유로운 분위기", "여행 동반자"],
    celebrity: "손석구",
    mbti: "ENFJ" as const,
    bloodType: "B" as const,
    religion: "NONE" as const,
    drinking: "SOMETIMES" as const,
    smoking: "NEVER" as const,
    dislikedConditions: [],
    minMatchScore: 0,
  },
  surveyAnswers: {
    dv_importance_of_love: 9,
    dv_ideal_relationship_pace: "빠르게 확인하기",
    dv_physical_affection: 8,
    dv_jealousy_level: 6,
    dv_conflict_resolution: "바로 대화",
    dv_deal_with_ex: "상관없음",
    ls_weekend_preference: "야외 활동",
    ls_sleep_schedule: "2시 이후",
    ls_exercise_frequency: "주 1-2회",
    ls_spending_habits: 8,
    ls_cleanliness: 5,
    ls_pet_preference: "상관없음",
    cm_contact_frequency: "수시로 연락",
    cm_communication_style: "영상통화",
    cm_emotional_expression: 9,
    cm_listening_vs_talking: 6,
    fp_marriage_intent: "아직 모르겠음",
    fp_children_preference: "아직 모르겠음",
    fp_career_priority: 6,
    fp_living_preference: "상관없음",
    pd_introvert_extrovert: 8,
    pd_spontaneity: 2,
    pd_risk_tolerance: 8,
    pd_humor_style: ["상황극/리액션", "블랙코미디", "자기비하"],
    pd_stress_coping: "사람 만나기",
  },
};

/**
 * F5 · 정하은 · 31세 · 교육(입시강사)
 * 내향적 / 계획적 / 결혼 적극 / 지적 / 안정 추구
 * → M5(정성호)과 높은 매치 기대 (결혼·내향·계획·안정 공통)
 */
const f5 = {
  email: "dummy_f5_haeun@example.com",
  name: "dummy_정하은",
  profile: {
    gender: "FEMALE" as const,
    dateOfBirth: new Date("1994-02-14"),
    nickname: "하은",
    height: 162,
    jobCategory: "EDUCATION" as const,
    jobDetail: "수학 입시강사",
    companyLocation: "서울특별시|양천구",
    residenceLocation: "서울특별시|동작구",
    hometownLocation: "경상남도|창원시",
    personality: "[TEST_DATA] 차분하고 지적인 편. 깊은 대화와 진지한 관계를 선호합니다.",
    hobbies: ["독서", "클래식", "홈카페"],
    preferences: ["성실하고 믿음직한 사람", "깊은 대화", "안정적인 미래"],
    mbti: "INFJ" as const,
    bloodType: "O" as const,
    religion: "NONE" as const,
    drinking: "RARELY" as const,
    smoking: "NEVER" as const,
    dislikedConditions: ["흡연자"],
    minMatchScore: 0,
  },
  surveyAnswers: {
    dv_importance_of_love: 8,
    dv_ideal_relationship_pace: "천천히 알아가기",
    dv_physical_affection: 5,
    dv_jealousy_level: 4,
    dv_conflict_resolution: "편지/메시지로 전달",
    dv_deal_with_ex: "완전 연락 안 함",
    ls_weekend_preference: "집에서 쉬기",
    ls_sleep_schedule: "10시~12시",
    ls_exercise_frequency: "주 1-2회",
    ls_spending_habits: 3,
    ls_cleanliness: 8,
    ls_pet_preference: "선호하지 않음",
    cm_contact_frequency: "하루 1번",
    cm_communication_style: "문자/카카오톡",
    cm_emotional_expression: 6,
    cm_listening_vs_talking: 3,
    fp_marriage_intent: "빠르게 하고 싶음",
    fp_children_preference: "꼭 갖고 싶음",
    fp_career_priority: 5,
    fp_living_preference: "도시 외곽",
    pd_introvert_extrovert: 2,
    pd_spontaneity: 8,
    pd_risk_tolerance: 3,
    pd_humor_style: ["따뜻한 유머", "말장난/언어유머"],
    pd_stress_coping: "혼자 시간 보내기",
  },
};

// ────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding dummy matching users (5M / 5F)...\n");

  const users = await Promise.all([
    upsertUser(m1),
    upsertUser(m2),
    upsertUser(m3),
    upsertUser(m4),
    upsertUser(m5),
    upsertUser(f1),
    upsertUser(f2),
    upsertUser(f3),
    upsertUser(f4),
    upsertUser(f5),
  ]);

  console.log("=== DUMMY USERS CREATED ===");
  console.log("\n[MALES]");
  users.slice(0, 5).forEach((u) => console.log(`  ${u.email} (${u.id})`));
  console.log("\n[FEMALES]");
  users.slice(5).forEach((u) => console.log(`  ${u.email} (${u.id})`));

  console.log("\n[EXPECTED MATCH SCORES (approximate)]");
  console.log("  M1(김민준) ↔ F2(이지우)   : 높음  — IT·내향·계획·절약 일치");
  console.log("  M5(정성호) ↔ F3(박민지)   : 높음  — 결혼적극·내향·계획·절약 일치");
  console.log("  M5(정성호) ↔ F5(정하은)   : 높음  — 결혼적극·내향·계획·절약 일치");
  console.log("  M2(이준혁) ↔ F4(최수아)   : 중상  — 외향·즉흥·활동적 일치, 결혼관 차이");
  console.log("  M4(최현우) ↔ F1(김서연)   : 중상  — 외향·활발·유머 일치, 연락빈도 차이");
  console.log("  M3(박재원) ↔ F4(최수아)   : 중간  — 즉흥·문화생활 일치, 다수 차이");
  console.log("  M1(김민준) ↔ F1(김서연)   : 낮음  — 내향↔외향, 절약↔소비 충돌");
  console.log("  M2(이준혁) ↔ F2(이지우)   : 낮음  — 외향↔내향, 연락빈도 충돌");
}

main()
  .catch((e) => {
    console.error("❌ Failed to seed dummy users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
