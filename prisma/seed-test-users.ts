import { PrismaClient, Prisma } from "@prisma/client";

/**
 * TEST-ONLY seed script for matching QA data.
 *
 * This script creates clearly marked, removable test users.
 * Safe cleanup target: any user whose email starts with "test_".
 */

const prisma = new PrismaClient();

const maleEmail = "test_male_matching@example.com";
const femaleEmail = "test_female_matching@example.com";

const sharedSurveyBase: Record<string, number | string | string[]> = {
  dv_importance_of_love: 8,
  dv_ideal_relationship_pace: "자연스러운 흐름",
  dv_physical_affection: 7,
  dv_jealousy_level: 4,
  dv_conflict_resolution: "바로 대화",
  dv_deal_with_ex: "완전 연락 안 함",

  ls_weekend_preference: "문화생활",
  ls_sleep_schedule: "12시~2시",
  ls_exercise_frequency: "주 3-4회",
  ls_spending_habits: 6,
  ls_cleanliness: 8,
  ls_pet_preference: "상관없음",

  cm_contact_frequency: "하루 몇 번",
  cm_communication_style: "문자/카카오톡",
  cm_emotional_expression: 7,
  cm_listening_vs_talking: 5,

  fp_marriage_intent: "천천히 생각 중",
  fp_children_preference: "있으면 좋겠음",
  fp_career_priority: 6,
  fp_living_preference: "도시 중심",

  pd_introvert_extrovert: 6,
  pd_spontaneity: 6,
  pd_risk_tolerance: 5,
  pd_humor_style: ["말장난/언어유머", "따뜻한 유머"],
  pd_stress_coping: "운동/활동",
};

async function upsertTestUser(input: {
  email: string;
  name: string;
  profile: Omit<Prisma.ProfileUncheckedCreateInput, "userId">;
  surveyAnswers: Record<string, number | string | string[]>;
}) {
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      profileComplete: true,
    },
    create: {
      email: input.email,
      name: input.name,
      profileComplete: true,
    },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      ...input.profile,
      stopMatching: false,
    },
    create: {
      ...input.profile,
      userId: user.id,
      stopMatching: false,
    },
  });

  await prisma.surveyResponse.upsert({
    where: { userId: user.id },
    update: {
      answers: input.surveyAnswers as Prisma.InputJsonValue,
    },
    create: {
      userId: user.id,
      answers: input.surveyAnswers as Prisma.InputJsonValue,
    },
  });

  return user;
}

async function main() {
  console.log("🌱 Seeding matching test users...");

  const maleSurvey = {
    ...sharedSurveyBase,
    dv_physical_affection: 7,
    ls_spending_habits: 6,
    pd_introvert_extrovert: 6,
  };

  const femaleSurvey = {
    ...sharedSurveyBase,
    dv_physical_affection: 8,
    ls_spending_habits: 7,
    pd_introvert_extrovert: 7,
  };

  const male = await upsertTestUser({
    email: maleEmail,
    name: "TEST_MALE_MATCH",
    profile: {
      gender: "MALE",
      dateOfBirth: new Date("1995-04-12"),
      nickname: "TEST_MALE_MATCH",
      jobCategory: "IT",
      jobDetail: "백엔드 개발자",
      companyLocation: "서울특별시|강남구",
      residenceLocation: "서울특별시|서초구",
      hometownLocation: "경기도|성남시",
      personality: "[TEST_DATA] 대화가 잘 통하고 서로 배려하는 관계를 중요하게 생각합니다.",
      hobbies: ["영화감상", "맛집탐방", "운동"],
      preferences: ["유머감각", "배려심", "가치관 일치"],
      mbti: "ENFJ",
      bloodType: "A",
      religion: "NONE",
      drinking: "SOMETIMES",
      smoking: "NEVER",
      dislikedConditions: [],
      stopMatching: false,
    },
    surveyAnswers: maleSurvey,
  });

  const female = await upsertTestUser({
    email: femaleEmail,
    name: "TEST_FEMALE_MATCH",
    profile: {
      gender: "FEMALE",
      dateOfBirth: new Date("1996-09-03"),
      nickname: "TEST_FEMALE_MATCH",
      jobCategory: "MARKETING",
      jobDetail: "브랜드 마케터",
      companyLocation: "서울특별시|송파구",
      residenceLocation: "서울특별시|강동구",
      hometownLocation: "경기도|수원시",
      personality: "[TEST_DATA] 서로의 일상을 존중하면서도 함께 성장하는 연애를 선호해요.",
      hobbies: ["영화감상", "맛집탐방", "운동"],
      preferences: ["유머감각", "배려심", "가치관 일치"],
      mbti: "ENFP",
      bloodType: "A",
      religion: "NONE",
      drinking: "SOMETIMES",
      smoking: "NEVER",
      dislikedConditions: [],
      stopMatching: false,
    },
    surveyAnswers: femaleSurvey,
  });

  console.log("=== TEST MATCHING USERS CREATED ===");
  console.log(`- ${male.email} (${male.id})`);
  console.log(`- ${female.email} (${female.id})`);
}

main()
  .catch((e) => {
    console.error("❌ Failed to seed test matching users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
