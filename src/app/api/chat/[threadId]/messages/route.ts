import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { messageSchema, messagePollSchema } from "@/lib/validations/chat";
import { ZodError } from "zod";
import { sendPushToUser } from "@/lib/push";

/**
 * Chat Messages API (Polling-based)
 *
 * GET  /api/chat/[threadId]/messages — Fetch messages (with cursor for polling)
 * POST /api/chat/[threadId]/messages — Send a new message
 *
 * Polling Strategy:
 *   Client polls GET every 3-5 seconds with ?after=<ISO timestamp>
 *   to fetch only new messages since last poll.
 */

interface RouteContext {
  params: Promise<{ threadId: string }>;
}

// ── GET: Fetch messages with optional cursor ──
export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { threadId } = await context.params;
    const userId = session.user.id;

    // Verify user is a participant of this thread
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      select: {
        id: true,
        isActive: true,
        userAId: true,
        photoRevealA: true,
        photoRevealB: true,
        userA: { select: { profile: { select: { nickname: true, profileImage: true } } } },
        userB: { select: { profile: { select: { nickname: true, profileImage: true } } } },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "채팅방을 찾을 수 없습니다." }, { status: 404 });
    }

    const isUserA = thread.userAId === userId;
    const partner = isUserA ? thread.userB : thread.userA;
    const partnerNickname = partner?.profile?.nickname ?? "상대방";

    // photo reveal 상태 계산 (별도 API 폴링 대체)
    const myReveal = isUserA ? thread.photoRevealA : thread.photoRevealB;
    const partnerReveal = isUserA ? thread.photoRevealB : thread.photoRevealA;
    const bothRevealed = thread.photoRevealA && thread.photoRevealB;
    const partnerPhoto = bothRevealed ? (partner?.profile?.profileImage ?? null) : null;

    // Parse and validate query params
    const url = new URL(request.url);
    const rawParams = {
      after: url.searchParams.get("after") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    };

    let pollParams: { after?: string; limit: number };
    try {
      pollParams = messagePollSchema.parse(rawParams);
    } catch (e) {
      if (e instanceof ZodError) {
        return NextResponse.json({ error: "잘못된 요청 파라미터입니다.", details: e.errors }, { status: 400 });
      }
      throw e;
    }

    const { after, limit } = pollParams;

    // Build query conditions
    const whereCondition: Record<string, unknown> = { threadId };
    if (after) {
      whereCondition.createdAt = { gt: new Date(after) };
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: whereCondition,
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    // Mark unread messages from the other user as read
    await prisma.message.updateMany({
      where: {
        threadId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    // Format response
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      readAt: msg.readAt?.toISOString() || null,
      isMine: msg.senderId === userId,
    }));

    // 내가 보낸 메시지 중 상대방이 읽은 것들의 readAt 전달 (읽음 표시 갱신용)
    const readReceipts = await prisma.message.findMany({
      where: {
        threadId,
        senderId: userId,
        readAt: { not: null },
      },
      select: { id: true, readAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      messages: formattedMessages,
      isActive: thread.isActive,
      partnerNickname,
      readReceipts: readReceipts.map((r) => ({
        id: r.id,
        readAt: r.readAt!.toISOString(),
      })),
      photoReveal: { myReveal, partnerReveal, partnerPhoto },
    });
  } catch (error) {
    console.error("[Messages GET]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// ── POST: Send a new message ──
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { threadId } = await context.params;
    const userId = session.user.id;

    // Verify user is a participant (닉네임도 함께 조회 — 푸시 발신자 이름에 사용)
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        isActive: true,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      select: {
        id: true,
        userAId: true,
        userBId: true,
        userA: { select: { profile: { select: { nickname: true } } } },
        userB: { select: { profile: { select: { nickname: true } } } },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "채팅방을 찾을 수 없거나 비활성화되었습니다." }, { status: 404 });
    }

    // Validate message content
    const body = await request.json();
    const { content } = messageSchema.parse(body);

    // Create the message
    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: userId,
        content,
      },
    });

    // Update thread's updatedAt for sorting
    await prisma.chatThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    // 수신자에게 푸시 발송 (fire-and-forget — 실패해도 응답에 영향 없음)
    const isUserA = thread.userAId === userId;
    const recipientId = isUserA ? thread.userBId : thread.userAId;
    const senderNickname = isUserA
      ? (thread.userA?.profile?.nickname ?? "상대방")
      : (thread.userB?.profile?.nickname ?? "상대방");

    sendPushToUser(recipientId, {
      title: senderNickname,
      body: content.length > 60 ? content.slice(0, 60) + "…" : content,
      path: `/chat/${threadId}`,
      type: "chat",
    });

    return NextResponse.json(
      {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        readAt: null,
        isMine: true,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "메시지가 올바르지 않습니다.", details: error.errors },
        { status: 400 },
      );
    }
    console.error("[Messages POST]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
