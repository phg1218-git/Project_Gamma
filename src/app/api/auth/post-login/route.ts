import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * POST-LOGIN REDIRECT
 * OAuth 로그인 완료 후 분기:
 * - 약관 동의 이력 있음 → /profile (기존 회원)
 * - 약관 동의 이력 없음 → /signup/terms (신규 회원)
 */
export async function GET(req: Request) {
  const baseUrl = new URL(req.url).origin;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { termsAgreedAt: true, profile: { select: { id: true } } },
  });

  // 이미 약관 동의한 유저 → 기존 회원
  if (user?.termsAgreedAt) {
    return NextResponse.redirect(`${baseUrl}/profile`);
  }

  // 약관 동의는 없지만 프로필이 있는 유저 → 약관 도입 이전 가입한 기존 회원
  // termsAgreedAt을 현재 시각으로 자동 처리 후 통과
  if (user?.profile) {
    const now = new Date();
    await prisma.user.update({
      where: { id: session.user.id },
      data: { termsAgreedAt: now, privacyAgreedAt: now },
    });
    return NextResponse.redirect(`${baseUrl}/profile`);
  }

  // 신규 유저 → 약관 동의 페이지
  return NextResponse.redirect(`${baseUrl}/signup/terms`);
}
