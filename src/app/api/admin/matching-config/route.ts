import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth-guard";

/**
 * GET  /api/admin/matching-config  — 현재 하드필터 설정 조회
 * PATCH /api/admin/matching-config — 하드필터 설정 변경
 */

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const config = await prisma.matchingConfig.upsert({
    where: { id: 1 },
    create: { id: 1, filterSmoker: true, filterDrinker: true, filterReligion: true, filterDistance: true },
    update: {},
  });

  return NextResponse.json(config);
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const allowed = ["filterSmoker", "filterDrinker", "filterReligion", "filterDistance"] as const;

  const data: Partial<Record<typeof allowed[number], boolean>> = {};
  for (const key of allowed) {
    if (typeof body[key] === "boolean") data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "변경할 필드가 없습니다." }, { status: 400 });
  }

  const config = await prisma.matchingConfig.upsert({
    where: { id: 1 },
    create: { id: 1, filterSmoker: true, filterDrinker: true, filterReligion: true, filterDistance: true, ...data },
    update: data,
  });

  return NextResponse.json(config);
}
