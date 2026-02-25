import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MAX_ACTIVE_CHATS_PER_USER } from "@/lib/constants";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = session.user.id;

    const threads = await prisma.chatThread.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { include: { profile: { select: { nickname: true } } } },
        userB: { include: { profile: { select: { nickname: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: userId },
                readAt: null,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const activeCount = await prisma.chatThread.count({
      where: {
        status: "OPEN",
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });

    const formattedThreads = threads.map((thread) => {
      const isUserA = thread.userAId === userId;
      const partner = isUserA ? thread.userB : thread.userA;
      const lastMessage = thread.messages[0];

      return {
        id: thread.id,
        matchId: thread.matchId,
        partnerNickname: partner.profile?.nickname || "익명",
        lastMessage: lastMessage?.content || null,
        lastMessageAt: lastMessage?.createdAt.toISOString() || null,
        unreadCount: thread._count.messages,
        isActive: thread.isActive,
        status: thread.status,
        closedAt: thread.closedAt?.toISOString() || null,
      };
    });

    return NextResponse.json({
      threads: formattedThreads,
      activeChatCount: activeCount,
      maxActiveChats: MAX_ACTIVE_CHATS_PER_USER,
      atCapacity: activeCount >= MAX_ACTIVE_CHATS_PER_USER,
    });
  } catch (error) {
    console.error("[Chat GET]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
