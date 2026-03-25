import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth-guard";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { matchId } = await params;
  const { status } = await req.json();

  const validStatuses = ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "잘못된 상태입니다." }, { status: 400 });
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data: { status },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(match);
}
