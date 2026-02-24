import { z } from "zod";

/**
 * 이어줌 — Profile Validation Schema (Zod)
 *
 * Server-side validation for profile creation and updates.
 * All fields match the Prisma Profile model.
 * Used in API routes — never trust client input.
 */

export const profileSchema = z.object({
  gender: z.enum(["MALE", "FEMALE"], {
    required_error: "성별을 선택해주세요.",
  }),

  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "올바른 날짜를 입력해주세요." })
    .transform((val) => new Date(val))
    .refine((date) => {
      // Must be at least 19 years old (Korean legal adult age)
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      return age >= 19;
    }, { message: "만 19세 이상만 가입할 수 있습니다." })
    .refine((date) => {
      // Must not be unrealistically old
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      return age <= 100;
    }, { message: "올바른 생년월일을 입력해주세요." }),

  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다.")
    .max(20, "닉네임은 20자 이하여야 합니다.")
    .regex(/^[가-힣a-zA-Z0-9]+$/, "닉네임은 한글, 영문, 숫자만 가능합니다."),

  jobCategory: z.enum([
    "OFFICE", "IT", "DESIGN", "MARKETING", "SALES", "FINANCE",
    "EDUCATION", "MEDICAL", "LAW", "ENGINEERING", "MEDIA",
    "SERVICE", "PUBLIC", "FREELANCE", "STUDENT", "OTHER",
  ], { required_error: "직업 분류를 선택해주세요." }),

  jobDetail: z
    .string()
    .min(1, "직업 상세를 입력해주세요.")
    .max(50, "직업 상세는 50자 이하여야 합니다."),

  companyLocation: z
    .string()
    .min(1, "직장 소재지를 선택해주세요.")
    .regex(/^.+\|.+$/, "올바른 형식이 아닙니다."),

  residenceLocation: z
    .string()
    .min(1, "거주지를 선택해주세요.")
    .regex(/^.+\|.+$/, "올바른 형식이 아닙니다."),

  hometownLocation: z
    .string()
    .min(1, "출신지를 선택해주세요.")
    .regex(/^.+\|.+$/, "올바른 형식이 아닙니다."),

  personality: z
    .string()
    .min(10, "성격은 10자 이상 작성해주세요.")
    .max(200, "성격은 200자 이하여야 합니다."),

  hobbies: z
    .array(z.string())
    .min(1, "취미를 하나 이상 선택해주세요.")
    .max(5, "취미는 최대 5개까지 선택 가능합니다."),

  preferences: z
    .array(z.string())
    .min(1, "선호사항을 하나 이상 선택해주세요.")
    .max(5, "선호사항은 최대 5개까지 선택 가능합니다."),

  mbti: z.enum([
    "ISTJ", "ISFJ", "INFJ", "INTJ",
    "ISTP", "ISFP", "INFP", "INTP",
    "ESTP", "ESFP", "ENFP", "ENTP",
    "ESTJ", "ESFJ", "ENFJ", "ENTJ",
  ], { required_error: "MBTI를 선택해주세요." }),

  bloodType: z.enum(["A", "B", "O", "AB"], {
    required_error: "혈액형을 선택해주세요.",
  }),

  religion: z.enum(["NONE", "CHRISTIANITY", "CATHOLICISM", "BUDDHISM", "OTHER"], {
    required_error: "종교를 선택해주세요.",
  }),

  drinking: z.enum(["NEVER", "RARELY", "SOMETIMES", "OFTEN"], {
    required_error: "음주 수준을 선택해주세요.",
  }),

  smoking: z.enum(["NEVER", "QUIT", "SOMETIMES", "OFTEN"], {
    required_error: "흡연 수준을 선택해주세요.",
  }),

  dislikedConditions: z
    .array(z.string())
    .max(5, "비선호 조건은 최대 5개까지 선택 가능합니다.")
    .default([]),

  stopMatching: z.boolean().default(false),
});

export type ProfileInput = z.infer<typeof profileSchema>;

/**
 * Partial profile schema for updates.
 * All fields become optional — only provided fields are updated.
 */
export const profileUpdateSchema = profileSchema.partial();

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
