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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      surveyResponse: true,
      sentMatches: {
        include: { receiver: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      receivedMatches: {
        include: { sender: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      chatThreadsA: {
        include: {
          userB: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      chatThreadsB: {
        include: {
          userA: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { userId } = await params;
  const body = await req.json();

  // Only allow updating specific fields
  const { name, email, profileComplete, profile } = body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(profileComplete !== undefined && { profileComplete }),
      ...(profile && {
        profile: {
          update: profile,
        },
      }),
    },
    include: { profile: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { userId } = await params;

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}
