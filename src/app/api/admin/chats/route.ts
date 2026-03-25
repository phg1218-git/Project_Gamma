import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth-guard";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const threads = await prisma.chatThread.findMany({
    select: {
      id: true,
      isActive: true,
      createdAt: true,
      closedAt: true,
      userA: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      userB: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100, // Limit to 100 most recent chats
  });

  return NextResponse.json(threads);
}
