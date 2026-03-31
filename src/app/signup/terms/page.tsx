"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Heart, ChevronDown, ChevronUp, Check } from "lucide-react";

export default function TermsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 로그인 안 된 유저만 /login으로. 약관 동의 여부는 서버(/api/auth/post-login)에서 판단.
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
    }
  }, [session, status, router]);

  const allChecked = termsChecked && privacyChecked;

  async function handleSubmit() {
    if (!allChecked) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/signup/agree-terms", { method: "POST" });
      if (!res.ok) {
        setError("오류가 발생했습니다. 다시 시도해주세요.");
        return;
      }
      // 하드 네비게이션으로 클라이언트 라우터 상태 완전 리셋
      window.location.href = "/profile/setup";
    } catch {
      setError("서버와 통신할 수 없습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Heart size={40} fill="hsl(340, 82%, 62%)" strokeWidth={0} className="mx-auto mb-2" />
          <h1 className="text-xl font-bold text-gradient-pink">이어줌 회원가입</h1>
          <p className="text-sm text-muted-foreground mt-1">
            서비스 이용을 위해 아래 약관에 동의해 주세요
          </p>
        </div>

        <div className="card-romantic p-5 space-y-3">
          {/* 전체 동의 */}
          <button
            onClick={() => {
              const next = !allChecked;
              setTermsChecked(next);
              setPrivacyChecked(next);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors"
          >
            <div
              className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                allChecked ? "bg-primary border-primary" : "border-gray-300"
              }`}
            >
              {allChecked && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
            <span className="text-sm font-semibold text-slate-800">전체 동의</span>
          </button>

          <div className="border-t border-pink-100" />

          {/* 서비스 이용약관 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setTermsChecked(!termsChecked)}
                className="flex items-center gap-3"
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                    termsChecked ? "bg-primary border-primary" : "border-gray-300"
                  }`}
                >
                  {termsChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-sm text-slate-700">
                  서비스 이용약관 동의{" "}
                  <span className="text-primary font-medium">(필수)</span>
                </span>
              </button>
              <button
                onClick={() => setTermsOpen(!termsOpen)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {termsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            {termsOpen && (
              <div className="ml-8 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
                <p className="font-semibold mb-1">제1조 (목적)</p>
                <p>본 약관은 이어줌(이하 &quot;서비스&quot;)이 제공하는 소셜 매칭 서비스의 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                <p className="font-semibold mt-2 mb-1">제2조 (서비스 이용)</p>
                <p>이용자는 본 서비스를 통해 다른 이용자와 매칭되어 채팅할 수 있습니다. 서비스 이용 시 타인을 존중하고 불법적인 행위를 하지 않아야 합니다.</p>
                <p className="font-semibold mt-2 mb-1">제3조 (이용 제한)</p>
                <p>허위 정보 등록, 타인 사칭, 불법 콘텐츠 공유 등의 행위는 서비스 이용이 제한될 수 있습니다.</p>
              </div>
            )}
          </div>

          {/* 개인정보 처리방침 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPrivacyChecked(!privacyChecked)}
                className="flex items-center gap-3"
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                    privacyChecked ? "bg-primary border-primary" : "border-gray-300"
                  }`}
                >
                  {privacyChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-sm text-slate-700">
                  개인정보 처리방침 동의{" "}
                  <span className="text-primary font-medium">(필수)</span>
                </span>
              </button>
              <button
                onClick={() => setPrivacyOpen(!privacyOpen)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {privacyOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            {privacyOpen && (
              <div className="ml-8 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
                <p className="font-semibold mb-1">수집하는 개인정보</p>
                <p>이름, 이메일 주소, 프로필 사진 (소셜 로그인 제공 정보), 서비스 이용 중 입력하는 프로필 정보 (성별, 생년월일, 직업, 거주지 등)</p>
                <p className="font-semibold mt-2 mb-1">수집 및 이용 목적</p>
                <p>매칭 서비스 제공, 채팅 서비스 운영, 서비스 개선 및 통계 분석</p>
                <p className="font-semibold mt-2 mb-1">보유 및 이용 기간</p>
                <p>회원 탈퇴 시까지. 단 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.</p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!allChecked || submitting}
            className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {submitting ? "처리 중..." : "동의하고 가입 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
