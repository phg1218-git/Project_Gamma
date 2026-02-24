import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

/**
 * Root Layout
 *
 * Wraps entire application with:
 * - Auth.js SessionProvider (for useSession hook)
 * - HTML lang attribute (Korean)
 * - Meta/SEO tags
 */

export const metadata: Metadata = {
  title: "이어줌 — 당신의 인연을 이어줍니다",
  description:
    "이어줌은 구조화된 데이터와 가중 점수를 사용하여 호환되는 사용자를 연결하는 익명 데이트 매칭 플랫폼입니다.",
  keywords: ["이어줌", "소개팅", "매칭", "데이트", "연애"],
  openGraph: {
    title: "이어줌 — 당신의 인연을 이어줍니다",
    description: "익명 데이트 매칭 플랫폼",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
