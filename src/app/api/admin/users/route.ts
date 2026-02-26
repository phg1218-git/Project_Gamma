import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi();
    const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const status = req.nextUrl.searchParams.get("status") ?? undefined;

    const where = {
      ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { profile: { nickname: { contains: q, mode: "insensitive" as const } } }] } : {}),
      ...(status ? { status: status as never } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.user.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, limit });
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
}
