import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import MobileNativeBridgeProvider from "@/components/MobileNativeBridgeProvider";
import "./globals.css";

/**
 * Root Layout
 *
 * Wraps entire application with:
 * - Auth.js SessionProvider (for useSession hook)
 * - HTML lang attribute (Korean)
 * - Meta/SEO tags
 * - next/font 기반 폰트 최적화 (Noto Sans KR)
 *
 * 폰트 참고:
 *   현재 Noto Sans KR을 사용합니다. Pretendard로 교체하려면:
 *   1. https://github.com/orioncactus/pretendard/releases 에서
 *      PretendardVariable.woff2 를 다운로드해 public/fonts/ 에 저장
 *   2. import localFont from "next/font/local" 으로 교체
 *   3. const pretendard = localFont({ src: "../../../public/fonts/PretendardVariable.woff2", ... })
 */
const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
  preload: true,
});

const BASE_URL = "https://earzum.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "이어줌 — 당신의 인연을 이어줍니다",
    template: "%s | 이어줌",
  },
  description:
    "구조화된 설문과 가중 점수 매칭 알고리즘으로 나에게 꼭 맞는 사람을 찾아보세요. 완전 익명 데이트 매칭 플랫폼.",
  keywords: ["이어줌", "소개팅", "매칭", "데이트", "연애", "익명 매칭", "궁합"],
  authors: [{ name: "이어줌" }],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  openGraph: {
    title: "이어줌 — 당신의 인연을 이어줍니다",
    description: "구조화된 설문과 과학적 매칭으로 당신의 인연을 이어줍니다.",
    type: "website",
    url: BASE_URL,
    siteName: "이어줌",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "이어줌 — 당신의 인연을 이어줍니다",
      },
    ],
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "이어줌 — 당신의 인연을 이어줍니다",
    description: "구조화된 설문과 과학적 매칭으로 당신의 인연을 이어줍니다.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body className="min-h-screen">
        <SessionProvider>
          <MobileNativeBridgeProvider />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
