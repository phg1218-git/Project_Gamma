import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth-guard";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [
    totalUsers,
    profileCompleteUsers,
    totalMatches,
    acceptedMatches,
    activeChats,
    totalMessages,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { profileComplete: true } }),
    prisma.match.count(),
    prisma.match.count({ where: { status: "ACCEPTED" } }),
    prisma.chatThread.count({ where: { isActive: true } }),
    prisma.message.count(),
  ]);

  return NextResponse.json({
    totalUsers,
    profileCompleteUsers,
    totalMatches,
    acceptedMatches,
    activeChats,
    totalMessages,
  });
}
