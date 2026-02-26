import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi, writeAuditLog } from "@/lib/admin";

export async function GET() {
  try {
    await requireAdminApi();
    const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } });
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdminApi();
    const { key, value } = await req.json();
    const setting = await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
    await writeAuditLog({ adminUserId: admin.id, action: "setting.update", targetType: "SETTING", targetId: key, metadata: { value } });
    return NextResponse.json({ setting });
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
}
