import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi, writeAuditLog } from "@/lib/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi();
    const { id } = await params;
    const { action, reason } = await req.json();
    const status = action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : null;
    if (!status) return NextResponse.json({ error: "invalid action" }, { status: 400 });

    await prisma.profileReview.update({ where: { id }, data: { status, reason, decidedAt: new Date() } });
    await writeAuditLog({ adminUserId: admin.id, action: `review.${action}`, targetType: "PROFILE_REVIEW", targetId: id, metadata: { reason } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
}
