import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Chat Threads API
 *
 * GET /api/chat — List all chat threads for the current user
 */

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all threads where the user is a participant
    const threads = await prisma.chatThread.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        isActive: true,
      },
      include: {
        userA: { include: { profile: { select: { nickname: true } } } },
        userB: { include: { profile: { select: { nickname: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Only get the latest message for preview
        },
        // Count unread messages
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

    // Format response
    const formattedThreads = threads.map((thread) => {
      // Determine the partner (the other user)
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
      };
    });

    return NextResponse.json({ threads: formattedThreads });
  } catch (error) {
    console.error("[Chat GET]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
