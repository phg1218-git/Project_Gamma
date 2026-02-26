export const runtime = 'nodejs'; // 이 줄을 추가
import { handlers } from "@/lib/auth";

/**
 * Auth.js Route Handler
 *
 * Handles all authentication routes:
 *   GET  /api/auth/signin
 *   GET  /api/auth/signout
 *   POST /api/auth/callback/:provider
 *   GET  /api/auth/session
 *   POST /api/auth/csrf
 */
export const { GET, POST } = handlers;
