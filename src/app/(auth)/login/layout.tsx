import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인",
  description: "소셜 계정으로 간편하게 이어줌에 로그인하세요. Google, 네이버, 카카오 계정을 지원합니다.",
  openGraph: {
    title: "로그인 | 이어줌",
    description: "소셜 계정으로 간편하게 이어줌에 로그인하세요.",
    url: "/login",
  },
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false, // 로그인 페이지는 검색 색인 제외
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
