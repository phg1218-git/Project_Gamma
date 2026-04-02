import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "서비스 이용약관",
  description: "이어줌 서비스 이용약관을 확인하세요.",
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <div className="w-full max-w-lg animate-fade-in">
      <div className="card-romantic p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Heart size={20} className="text-primary" fill="hsl(340, 82%, 62%)" strokeWidth={0} />
          <h1 className="text-lg font-bold text-gradient-pink">서비스 이용약관</h1>
        </div>

        <div className="prose prose-sm max-w-none text-foreground space-y-4 text-sm leading-relaxed">
          <p className="text-xs text-muted-foreground">최종 수정일: 2025년 1월 1일</p>

          <section>
            <h2 className="font-semibold mb-1">제1조 (목적)</h2>
            <p>
              이 약관은 이어줌(이하 &ldquo;서비스&rdquo;)이 제공하는 익명 매칭 서비스의 이용에 관한
              조건 및 절차, 회사와 이용자의 권리·의무·책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1">제2조 (정의)</h2>
            <p>
              &ldquo;서비스&rdquo;란 이어줌이 제공하는 익명 데이트 매칭 플랫폼을 의미합니다.
              &ldquo;이용자&rdquo;란 이 약관에 동의하고 서비스를 이용하는 자를 말합니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1">제3조 (이용 자격)</h2>
            <p>
              서비스는 만 19세 이상인 자만 이용할 수 있습니다. 만 19세 미만의 이용자가 서비스에
              가입한 경우, 서비스는 해당 계정을 즉시 삭제할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1">제4조 (서비스 제공 및 변경)</h2>
            <p>
              서비스는 설문 기반 매칭, 익명 채팅, 프로필 공개 기능을 제공합니다. 서비스는 운영상
              필요한 경우 사전 고지 후 내용을 변경하거나 중단할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1">제5조 (이용자 의무)</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>타인을 사칭하거나 허위 정보를 제공하지 않습니다.</li>
              <li>다른 이용자를 희롱·욕설·위협하지 않습니다.</li>
              <li>상업적 광고나 스팸 메시지를 발송하지 않습니다.</li>
              <li>타인의 개인정보를 무단 수집·이용하지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-1">제6조 (책임 제한)</h2>
            <p>
              서비스는 이용자 간 발생하는 분쟁에 대해 책임을 지지 않습니다. 서비스는 천재지변,
              시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1">제7조 (준거법)</h2>
            <p>이 약관은 대한민국 법률에 따라 해석됩니다.</p>
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
            href="/privacy"
            className="flex-1 py-2 rounded-xl bg-pink-50 text-sm font-medium text-center text-primary hover:bg-pink-100 transition-colors"
          >
            개인정보처리방침
          </Link>
        </div>
      </div>
    </div>
  );
}
