import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi, writeAuditLog } from "@/lib/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi();
    const { id } = await params;
    const { action, reason } = await req.json();
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: "not found" }, { status: 404 });

    if (action === "mark_in_progress") await prisma.report.update({ where: { id }, data: { status: "IN_PROGRESS" } });
    if (action === "resolve") await prisma.report.update({ where: { id }, data: { status: "RESOLVED", resolvedAt: new Date() } });
    if (action === "suspend_reported") await prisma.user.update({ where: { id: report.reportedId }, data: { status: "SUSPENDED", suspendedAt: new Date() } });
    if (action === "force_block") await prisma.block.upsert({ where: { blockerId_blockedId: { blockerId: report.reporterId, blockedId: report.reportedId } }, create: { blockerId: report.reporterId, blockedId: report.reportedId }, update: {} });

    await writeAuditLog({ adminUserId: admin.id, action: `report.${action}`, targetType: "REPORT", targetId: id, metadata: { reason } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
}
