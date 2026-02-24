/**
 * 이어줌 — Survey Types
 */

/** Survey answer value — varies by question type */
export type SurveyAnswerValue = number | string | string[];

/** Complete survey response (question ID → answer) */
export type SurveyAnswers = Record<string, SurveyAnswerValue>;
