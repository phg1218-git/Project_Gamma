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
    .min(1, "메시지를 입력해주세요.")
    .max(1000, "메시지는 1000자 이하여야 합니다.")
    .transform((val) => {
      // Strip HTML tags for XSS prevention
      return val.replace(/<[^>]*>/g, "").trim();
    }),
});

export type MessageInput = z.infer<typeof messageSchema>;

/** Validate message polling request */
export const messagePollSchema = z.object({
  // Cursor for pagination: fetch messages after this timestamp
  after: z
    .string()
    .datetime()
    .optional(),
  // Limit number of messages returned (default 50, max 100)
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50),
});

export type MessagePollInput = z.infer<typeof messagePollSchema>;
