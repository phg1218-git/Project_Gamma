import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "이어줌 개인정보처리방침을 확인하세요.",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <div className="w-full max-w-lg animate-fade-in">
      <div className="card-romantic p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Heart size={20} className="text-primary" fill="hsl(340, 82%, 62%)" strokeWidth={0} />
          <h1 className="text-lg font-bold text-gradient-pink">개인정보처리방침</h1>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <p className="text-xs text-muted-foreground">최종 수정일: 2025년 1월 1일</p>

          <section>
            <h2 className="font-semibold mb-1">1. 수집하는 개인정보 항목</h2>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>소셜 로그인 정보: 이름, 이메일 주소, 프로필 사진 URL (Google/네이버/카카오 제공)</li>
              <li>프로필 정보: 생년월일, 닉네임, 직업, 거주지, MBTI, 취미 등</li>
              <li>설문 답변: 연애관·라이프스타일·가치관 관련 설문 응답</li>
              <li>채팅 내용: 매칭된 상대와 주고받은 메시지</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-1">2. 개인정보 수집 및 이용 목적</h2>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>회원 가입 및 본인 확인</li>
              <li>알고리즘 기반 매칭 서비스 제공</li>
              <li>익명 채팅 서비스 운영</li>
              <li>서비스 개선 및 통계 분석</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-1">3. 개인정보 보유 및 이용 기간</h2>
            <p className="text-muted-foreground">
              회원 탈퇴 시 즉시 삭제합니다. 단, 관계 법령에 의해 보존이 필요한 경우 해당 기간 동안
              보관합니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1">4. 개인정보 제3자 제공</h2>
            <p className="text-muted-foreground">
              서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의한
              요청이 있는 경우 예외로 합니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1">5. 이용자 권리</h2>
            <p className="text-muted-foreground">
              이용자는 언제든지 자신의 개인정보에 대한 열람, 수정, 삭제를 요청할 수 있습니다.
              계정 삭제는 설정 페이지에서 직접 처리하거나 운영팀에 문의하세요.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1">6. 쿠키 및 세션</h2>
            <p className="text-muted-foreground">
              서비스는 로그인 세션 유지를 위해 데이터베이스 기반 세션을 사용합니다. 브라우저 쿠키에는
              세션 식별자만 저장됩니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1">7. 개인정보 보호책임자</h2>
            <p className="text-muted-foreground">
              개인정보 관련 문의는 서비스 내 문의 채널을 이용해 주세요.
            </p>
          </section>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="flex-1 py-2 rounded-xl border border-pink-200 text-sm font-medium text-center text-primary hover:bg-pink-50 transition-colors"
          >
            로그인으로 돌아가기
          </Link>
          <Link
            href="/terms"
            className="flex-1 py-2 rounded-xl bg-pink-50 text-sm font-medium text-center text-primary hover:bg-pink-100 transition-colors"
          >
            서비스 이용약관
          </Link>
        </div>
      </div>
    </div>
  );
}
