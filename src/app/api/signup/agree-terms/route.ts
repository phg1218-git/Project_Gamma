import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const now = new Date();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      termsAgreedAt: now,
      privacyAgreedAt: now,
    },
  });

  return NextResponse.json({ success: true });
}
