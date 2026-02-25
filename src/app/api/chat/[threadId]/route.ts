import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ threadId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { threadId } = await context.params;

    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        OR: [{ userAId: session.user.id }, { userBId: session.user.id }],
      },
      select: {
        id: true,
        status: true,
        closedAt: true,
        endedByUserId: true,
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "채팅방을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({
      ...thread,
      closedAt: thread.closedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("[Chat Thread GET]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { threadId } = await context.params;

    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        OR: [{ userAId: session.user.id }, { userBId: session.user.id }],
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "채팅방을 찾을 수 없습니다." }, { status: 404 });
    }

    if (thread.status === "CLOSED") {
      return NextResponse.json({
        id: thread.id,
        status: thread.status,
        closedAt: thread.closedAt?.toISOString() || null,
      });
    }

    const updated = await prisma.chatThread.update({
      where: { id: threadId },
      data: {
        status: "CLOSED",
        isActive: false,
        closedAt: new Date(),
        endedByUserId: session.user.id,
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      closedAt: updated.closedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("[Chat Thread PATCH]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
