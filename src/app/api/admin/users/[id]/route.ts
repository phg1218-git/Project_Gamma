import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, writeAuditLog } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi();
    const { id } = await params;
    const { action, reason } = await req.json();

    if (action === "suspend") {
      await prisma.user.update({ where: { id }, data: { status: "SUSPENDED", suspendedAt: new Date() } });
    } else if (action === "unsuspend") {
      await prisma.user.update({ where: { id }, data: { status: "ACTIVE", suspendedAt: null } });
    } else if (action === "soft_delete") {
      await prisma.user.update({ where: { id }, data: { status: "DELETED", deletedAt: new Date(), archivedAt: new Date() } });
    } else {
      return NextResponse.json({ error: "invalid action" }, { status: 400 });
    }

    await writeAuditLog({ adminUserId: admin.id, action: `user.${action}`, targetType: "USER", targetId: id, metadata: { reason } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
}
