import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Photo Reveal API
 *
 * POST /api/chat/[threadId]/reveal — Toggle my photo reveal consent
 * GET  /api/chat/[threadId]/reveal — Get reveal status + partner photo (if both revealed)
 */

interface RouteContext {
  params: Promise<{ threadId: string }>;
}

// ── GET: 사진 공개 현황 조회 ──
export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { threadId } = await context.params;
    const userId = session.user.id;

    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { include: { profile: { select: { profileImage: true } } } },
        userB: { include: { profile: { select: { profileImage: true } } } },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "채팅방을 찾을 수 없습니다." }, { status: 404 });
    }

    const isUserA = thread.userAId === userId;
    const myReveal = isUserA ? thread.photoRevealA : thread.photoRevealB;
    const partnerReveal = isUserA ? thread.photoRevealB : thread.photoRevealA;
    const bothRevealed = thread.photoRevealA && thread.photoRevealB;

    const partner = isUserA ? thread.userB : thread.userA;
    const partnerPhoto = bothRevealed ? (partner.profile?.profileImage ?? null) : null;

    return NextResponse.json({ myReveal, partnerReveal, partnerPhoto });
  } catch (error) {
    console.error("[Photo Reveal GET]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// ── POST: 사진 공개 동의 토글 ──
export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { threadId } = await context.params;
    const userId = session.user.id;

    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        isActive: true,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { include: { profile: { select: { profileImage: true } } } },
        userB: { include: { profile: { select: { profileImage: true } } } },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "채팅방을 찾을 수 없습니다." }, { status: 404 });
    }

    const isUserA = thread.userAId === userId;
    const currentReveal = isUserA ? thread.photoRevealA : thread.photoRevealB;
    const newReveal = !currentReveal;

    const updated = await prisma.chatThread.update({
      where: { id: threadId },
      data: isUserA
        ? { photoRevealA: newReveal }
        : { photoRevealB: newReveal },
    });

    const myReveal = isUserA ? updated.photoRevealA : updated.photoRevealB;
    const partnerReveal = isUserA ? updated.photoRevealB : updated.photoRevealA;
    const bothRevealed = updated.photoRevealA && updated.photoRevealB;

    const partner = isUserA ? thread.userB : thread.userA;
    const partnerPhoto = bothRevealed ? (partner.profile?.profileImage ?? null) : null;

    return NextResponse.json({ myReveal, partnerReveal, partnerPhoto });
  } catch (error) {
    console.error("[Photo Reveal POST]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
