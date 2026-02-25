import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { messageSchema } from "@/lib/validations/chat";
import { ZodError } from "zod";

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
    });

    if (!thread) {
      return NextResponse.json({ error: "채팅방을 찾을 수 없습니다." }, { status: 404 });
    }

    // Parse query params for polling cursor
    const url = new URL(request.url);
    const after = url.searchParams.get("after");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

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

    return NextResponse.json({ messages: formattedMessages });
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

    // Verify user is a participant
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "채팅방을 찾을 수 없습니다." }, { status: 404 });
    }

    if (thread.status !== "OPEN") {
      return NextResponse.json(
        { error: "종료된 채팅방에는 메시지를 보낼 수 없습니다.", code: "CHAT_CLOSED" },
        { status: 403 },
      );
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
