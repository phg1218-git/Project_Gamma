import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/profile/[userId] — View a matched partner's profile
 *
 * 익명성 정책:
 *   PENDING  — 기본 정보(닉네임·나이·직군·거주지 시/도·취미·선호·MBTI 등)만 공개.
 *              상세 직장·성격 텍스트·닮은꼴·프로필 사진은 마스킹.
 *   ACCEPTED — 모든 필드 공개 (상호 수락한 경우).
 *
 * Access control: 두 사용자 사이에 PENDING 또는 ACCEPTED 매칭이 있어야 함.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { userId } = await params;
    const currentUserId = session.user.id;

    if (userId === currentUserId) {
      return NextResponse.json({ error: "본인 프로필은 /api/profile을 사용하세요." }, { status: 400 });
    }

    // Verify an active match OR active subthreshold recommendation exists
    const [match, subRec] = await Promise.all([
      prisma.match.findFirst({
        where: {
          status: { in: ["PENDING", "ACCEPTED"] },
          OR: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId },
          ],
        },
        select: { status: true },
      }),
      prisma.subthresholdRecommendation.findFirst({
        where: {
          status: { in: ["SHOWN", "PENDING_B", "ACCEPTED"] },
          expiresAt: { gt: new Date() },
          OR: [
            { fromUserId: currentUserId, toUserId: userId },
            { fromUserId: userId, toUserId: currentUserId },
          ],
        },
        select: { id: true },
      }),
    ]);

    if (!match && !subRec) {
      return NextResponse.json({ error: "매칭된 상대만 조회할 수 있습니다." }, { status: 403 });
    }

    const isAccepted = match?.status === "ACCEPTED";

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        nickname: true,
        dateOfBirth: true,
        gender: true,
        height: true,
        jobCategory: true,
        // PENDING 단계에서 상세 직장 정보는 비공개
        jobDetail: isAccepted,
        // 거주지는 시/도 수준까지만 — 클라이언트에서 parseLocation으로 분리
        residenceLocation: true,
        // 성격 텍스트: ACCEPTED 이후 공개
        personality: isAccepted,
        hobbies: true,
        preferences: true,
        mbti: true,
        bloodType: true,
        religion: true,
        drinking: true,
        smoking: true,
        // 닮은꼴·프로필 사진: 상호 수락 이후 공개
        celebrity: isAccepted,
        profileImage: isAccepted,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "상대방 프로필이 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ ...profile, revealLevel: isAccepted ? "full" : "partial" });
  } catch (error) {
    console.error("[Profile GET userId]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
