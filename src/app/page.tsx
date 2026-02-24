import Link from "next/link";
import { Heart } from "lucide-react";

/**
 * Landing Page
 *
 * Public page shown to unauthenticated users.
 * Romantic pink theme with call-to-action to sign in.
 */
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-romantic flex flex-col items-center justify-center px-4">
      {/* Hero Section */}
      <div className="text-center animate-fade-in">
        {/* Animated Heart Icon */}
        <div className="mb-6">
          <Heart
            className="mx-auto heart-pulse"
            size={64}
            fill="hsl(340, 82%, 62%)"
            strokeWidth={0}
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gradient-pink mb-2">이어줌</h1>
        <p className="text-lg text-muted-foreground mb-8">
          당신의 인연을 이어줍니다
        </p>

        {/* Description */}
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-10 leading-relaxed">
          구조화된 설문과 과학적 매칭 알고리즘으로
          <br />
          나에게 꼭 맞는 사람을 찾아보세요.
        </p>

        {/* CTA Button */}
        <Link href="/login" className="btn-gradient inline-block text-lg px-8 py-3">
          시작하기
        </Link>

        {/* Features */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto text-center">
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
              <Heart size={20} className="text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">과학적 매칭</p>
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
              <Heart size={20} className="text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">완전 익명</p>
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
              <Heart size={20} className="text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">투명한 점수</p>
          </div>
        </div>
      </div>
    </main>
  );
}
