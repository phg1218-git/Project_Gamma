import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth-guard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { userId } = await params;

  const [sent, received] = await Promise.all([
    prisma.match.findMany({
      where: { senderId: userId },
      include: { receiver: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.match.findMany({
      where: { receiverId: userId },
      include: { sender: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ sent, received });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  await params; // consume params
  const { matchId, status } = await req.json();

  const validStatuses = ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"];
  if (!matchId || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data: { status },
  });

  return NextResponse.json(match);
}
