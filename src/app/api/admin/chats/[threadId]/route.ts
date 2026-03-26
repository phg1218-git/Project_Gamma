import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth-guard";

/**
 * GET /api/admin/chats/[threadId]
 * 특정 채팅 스레드의 상세 정보를 조회합니다.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { threadId } = await params;

  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    include: {
      userA: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: {
              nickname: true,
              gender: true,
            },
          },
        },
      },
      userB: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: {
              nickname: true,
              gender: true,
            },
          },
        },
      },
      match: {
        select: {
          score: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  if (!thread) {
    return NextResponse.json(
      { error: "채팅 스레드를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json(thread);
}
