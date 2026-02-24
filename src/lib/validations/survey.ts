import { z } from "zod";
import { SURVEY_QUESTIONS } from "@/constants/survey-questions";

/**
 * 이어줌 — Survey Validation Schema (Zod)
 *
 * Dynamically builds validation from SURVEY_QUESTIONS definition.
 * Ensures all required questions are answered with valid values.
 * The resulting JSON blob is stored in SurveyResponse.answers.
 */

// Build a dynamic Zod schema from survey question definitions
function buildSurveySchema() {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const question of SURVEY_QUESTIONS) {
    let fieldSchema: z.ZodTypeAny;

    switch (question.type) {
      case "slider":
        // Slider: number within min/max range
        fieldSchema = z
          .number()
          .min(question.slider!.min, `${question.label}: 최소값은 ${question.slider!.min}입니다.`)
          .max(question.slider!.max, `${question.label}: 최대값은 ${question.slider!.max}입니다.`);
        break;

      case "select":
        // Select: must be one of the defined options
        fieldSchema = z.string().refine(
          (val) => question.options!.includes(val),
          { message: `${question.label}: 올바른 선택지가 아닙니다.` },
        );
        break;

      case "multiselect":
        // Multiselect: array of valid options, with optional max count
        fieldSchema = z
          .array(z.string())
          .refine(
            (arr) => arr.every((val) => question.options!.includes(val)),
            { message: `${question.label}: 올바르지 않은 선택지가 포함되어 있습니다.` },
          )
          .refine(
            (arr) => arr.length >= 1,
            { message: `${question.label}: 하나 이상 선택해주세요.` },
          )
          .refine(
            (arr) => !question.maxSelect || arr.length <= question.maxSelect,
            { message: `${question.label}: 최대 ${question.maxSelect}개까지 선택 가능합니다.` },
          );
        break;
    }

    // Required fields are non-optional
    if (question.required) {
      shape[question.id] = fieldSchema;
    } else {
      shape[question.id] = fieldSchema.optional();
    }
  }

  return z.object(shape);
}

export const surveySchema = buildSurveySchema();

export type SurveyInput = z.infer<typeof surveySchema>;
