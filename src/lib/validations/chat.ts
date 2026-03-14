import { z } from "zod";

/**
 * 이어줌 — Chat Validation Schemas (Zod)
 *
 * Validates message content and chat thread operations.
 * Input sanitization: strips HTML to prevent XSS.
 */

/** Validate new message content */
export const messageSchema = z.object({
  content: z
    .string()
    // Strip HTML and trim first, then validate length on the sanitized value
    .transform((val) => val.replace(/<[^>]*>/g, "").trim())
    .pipe(
      z
        .string()
        .min(1, "메시지를 입력해주세요.")
        .max(1000, "메시지는 1000자 이하여야 합니다."),
    ),
});

export type MessageInput = z.infer<typeof messageSchema>;

/** Validate message polling request (query string params — values arrive as strings) */
export const messagePollSchema = z.object({
  // Cursor for pagination: fetch messages after this timestamp
  after: z
    .string()
    .datetime({ message: "올바른 날짜 형식이 아닙니다." })
    .optional(),
  // Limit number of messages returned (default 50, max 100)
  // z.coerce converts the query-string value from string to number before validation
  limit: z
    .coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50),
});

export type MessagePollInput = z.infer<typeof messagePollSchema>;
