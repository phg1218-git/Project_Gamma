import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * DELETE /api/user
 * 회원 탈퇴 처리:
 * 1. User 개인정보 익명화 (name, email, image 제거)
 * 2. Profile, SurveyResponse 삭제
 * 3. Account, Session 삭제 (재로그인 불가)
 * 4. Match, ChatThread, Message는 공동 기록이므로 유지
 */
export async function DELETE() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = session.user.id;

  await prisma.$transaction([
    // 개인정보 익명화
    prisma.user.update({
      where: { id: userId },
      data: {
        name: "탈퇴한 사용자",
        email: `deleted_${userId}@deleted.invalid`,
        image: null,
        emailVerified: null,
        profileComplete: false,
        termsAgreedAt: null,
        privacyAgreedAt: null,
        deletedAt: new Date(),
      },
    }),
    // 프로필 삭제
    prisma.profile.deleteMany({ where: { userId } }),
    // 설문 삭제
    prisma.surveyResponse.deleteMany({ where: { userId } }),
    // OAuth 계정 삭제 (재로그인 불가)
    prisma.account.deleteMany({ where: { userId } }),
    // 세션 삭제 (즉시 로그아웃)
    prisma.session.deleteMany({ where: { userId } }),
  ]);

  return NextResponse.json({ success: true });
}
