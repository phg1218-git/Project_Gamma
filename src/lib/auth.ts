import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";
import { prisma } from "@/lib/prisma";

/* =========================
   NAVER PROVIDER
========================= */

interface NaverProfile {
  response: {
    id: string;
    nickname?: string;
    name?: string;
    email?: string;
    profile_image?: string;
  };
}

function NaverProvider(
  options: OAuthUserConfig<NaverProfile>
): OAuthConfig<NaverProfile> {
  return {
    id: "naver",
    name: "Naver",
    type: "oauth",

    authorization: "https://nid.naver.com/oauth2.0/authorize",
    token: "https://nid.naver.com/oauth2.0/token",
    userinfo: "https://openapi.naver.com/v1/nid/me",

    profile(profile) {
      return {
        id: profile.response.id,
        name: profile.response.nickname || profile.response.name,
        email: profile.response.email,
        image: profile.response.profile_image,
      };
    },

    options,
  };
}

/* =========================
   KAKAO PROVIDER
========================= */

interface KakaoProfile {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

function KakaoProvider(
  options: OAuthUserConfig<KakaoProfile>
): OAuthConfig<KakaoProfile> {
  return {
    id: "kakao",
    name: "Kakao",
    type: "oauth",

    authorization: {
      url: "https://kauth.kakao.com/oauth/authorize",
      params: {
        scope: "profile_nickname account_email",
      },
    },

    token: "https://kauth.kakao.com/oauth/token",
    userinfo: "https://kapi.kakao.com/v2/user/me",

    // ⭐️ 핵심 수정 부분
    client: {
      token_endpoint_auth_method: "client_secret_post",
    },

    profile(profile) {
      return {
        id: String(profile.id),
        name: profile.kakao_account?.profile?.nickname,
        email: profile.kakao_account?.email,
        image: profile.kakao_account?.profile?.profile_image_url,
      };
    },

    options,
  };
}

/* =========================
   AUTH CONFIG
========================= */

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
    }),

    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);