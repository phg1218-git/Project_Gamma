"use client";

import { signIn } from "next-auth/react";
import { Heart } from "lucide-react";

/**
 * Login Page
 *
 * Social login buttons for Google, Naver, Kakao.
 * Romantic pink card design.
 */
export default function LoginPage() {
  return (
    <div className="w-full max-w-sm animate-fade-in">
      {/* Card */}
      <div className="card-romantic p-8 text-center">
        {/* Logo */}
        <Heart
          className="mx-auto mb-4 text-primary"
          size={48}
          fill="hsl(340, 82%, 62%)"
          strokeWidth={0}
        />
        <h1 className="text-2xl font-bold text-gradient-pink mb-1">이어줌</h1>
        <p className="text-sm text-muted-foreground mb-8">
          소셜 계정으로 간편 로그인
        </p>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          {/* Google */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/after-login" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 계속하기
          </button>

          {/* Naver */}
          <button
            onClick={() => signIn("naver", { callbackUrl: "/after-login" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium transition-colors"
            style={{ backgroundColor: "#03C75A" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" />
            </svg>
            네이버로 계속하기
          </button>

          {/* Kakao */}
          <button
            onClick={() => signIn("kakao", { callbackUrl: "/after-login" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: "#FEE500", color: "#191919" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#191919">
              <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.734 1.81 5.134 4.534 6.508l-.916 3.376a.37.37 0 0 0 .56.396l3.87-2.576c.632.09 1.28.137 1.952.137 5.523 0 10-3.463 10-7.691S17.523 3 12 3" />
            </svg>
            카카오로 계속하기
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-muted-foreground">
          로그인하면 이어줌의 서비스 약관에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
