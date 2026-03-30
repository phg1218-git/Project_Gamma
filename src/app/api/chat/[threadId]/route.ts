import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Chat Thread Management API
 *
 * PATCH /api/chat/[threadId] — Close a chat thread
 *   isActive를 false로, closedAt을 현재 시각으로 설정.
 *   30일 후 자동 삭제 대상이 됨.
 */

interface RouteContext {
  params: Promise<{ threadId: string }>;
}

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { threadId } = await context.params;
    const userId = session.user.id;

    // 사용자가 참여하고 있는 활성 스레드인지 확인
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        isActive: true,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });

    if (!thread) {
      return NextResponse.json(
        { error: "채팅방을 찾을 수 없거나 이미 종료되었습니다." },
        { status: 404 },
      );
    }

    await prisma.chatThread.update({
      where: { id: threadId },
      data: {
        isActive: false,
        closedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Chat PATCH]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
