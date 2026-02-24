import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * Auth.js (NextAuth v5) Configuration
 *
 * Providers: Google, Naver, Kakao
 * Adapter: Prisma (stores sessions/accounts in Neon DB)
 * Strategy: Database sessions (not JWT) for better security
 *
 * Naver and Kakao use custom provider definitions because
 * they are not built-in to Auth.js v5.
 */

/**
 * Naver OAuth Provider
 * Docs: https://developers.naver.com/docs/login/api/api.md
 */
const NaverProvider = {
  id: "naver",
  name: "Naver",
  type: "oauth" as const,
  authorization: {
    url: "https://nid.naver.com/oauth2.0/authorize",
    params: { response_type: "code" },
  },
  token: "https://nid.naver.com/oauth2.0/token",
  userinfo: "https://openapi.naver.com/v1/nid/me",
  clientId: process.env.NAVER_CLIENT_ID!,
  clientSecret: process.env.NAVER_CLIENT_SECRET!,
  profile(profile: Record<string, unknown>) {
    const response = profile.response as Record<string, string>;
    return {
      id: response.id,
      name: response.name || response.nickname,
      email: response.email,
      image: response.profile_image,
    };
  },
};

/**
 * Kakao OAuth Provider
 * Docs: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api
 */
const KakaoProvider = {
  id: "kakao",
  name: "Kakao",
  type: "oauth" as const,
  authorization: {
    url: "https://kauth.kakao.com/oauth/authorize",
    params: { response_type: "code" },
  },
  token: "https://kauth.kakao.com/oauth/token",
  userinfo: "https://kapi.kakao.com/v2/user/me",
  clientId: process.env.KAKAO_CLIENT_ID!,
  clientSecret: process.env.KAKAO_CLIENT_SECRET!,
  profile(profile: Record<string, unknown>) {
    const kakaoAccount = profile.kakao_account as Record<string, unknown> | undefined;
    const kakaoProfile = kakaoAccount?.profile as Record<string, string> | undefined;
    return {
      id: String(profile.id),
      name: kakaoProfile?.nickname,
      email: kakaoAccount?.email as string | undefined,
      image: kakaoProfile?.profile_image_url,
    };
  },
};

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    NaverProvider,
    KakaoProvider,
  ],

  // Use database sessions (not JWT) — more secure, revocable
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",  // Custom login page
    error: "/login",   // Redirect auth errors to login page
  },

  callbacks: {
    /**
     * Session callback: attach user ID and profileComplete flag to session.
     * This lets client components know if profile setup is needed.
     */
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // TypeScript: extend session type in types/next-auth.d.ts
      }
      return session;
    },

    /**
     * Redirect callback: force profile completion on first login.
     * After sign-in, check if the user has completed their profile.
     */
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow same-origin URLs
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  // CSRF protection is built-in to Auth.js
  // Secure cookies are automatically enabled in production (HTTPS)
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
