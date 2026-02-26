import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi();
    const status = req.nextUrl.searchParams.get("status") ?? "PENDING";
    const items = await prisma.profileReview.findMany({ where: { status: status as never }, take: 100, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
}
