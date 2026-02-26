import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi();
    const action = req.nextUrl.searchParams.get("action") ?? undefined;
    const adminUserId = req.nextUrl.searchParams.get("adminUserId") ?? undefined;
    const logs = await prisma.auditLog.findMany({ where: { ...(action ? { action } : {}), ...(adminUserId ? { adminUserId } : {}) }, take: 100, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
}
