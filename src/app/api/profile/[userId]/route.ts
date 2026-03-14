import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/profile/[userId] — View a matched partner's profile
 *
 * Access control: Only allows viewing profiles of users
 * with whom the current user has an existing match.
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

    // Verify an active match exists between the two users (PENDING or ACCEPTED only)
    const match = await prisma.match.findFirst({
      where: {
        status: { in: ["PENDING", "ACCEPTED"] },
        OR: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId },
        ],
      },
    });

    if (!match) {
      return NextResponse.json({ error: "매칭된 상대만 조회할 수 있습니다." }, { status: 403 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        nickname: true,
        dateOfBirth: true,
        gender: true,
        height: true,
        jobCategory: true,
        jobDetail: true,
        residenceLocation: true,
        personality: true,
        hobbies: true,
        preferences: true,
        mbti: true,
        bloodType: true,
        religion: true,
        drinking: true,
        smoking: true,
        celebrity: true,
        profileImage: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "상대방 프로필이 없습니다." }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[Profile GET userId]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
