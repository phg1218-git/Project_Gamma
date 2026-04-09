import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/jwt";
import { sendPushToUser } from "@/lib/push";

/**
 * Admin Notifications API
 *
 * GET: 모든 알림 조회 (최신순)
 * POST: 새 알림 생성 (전체 / 특정 1명 / 특정 여러 명)
 * DELETE: 알림 삭제 (단건 id 또는 복수 ids)
 */

async function checkAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME);
}

// GET /api/admin/notifications
export async function GET() {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { nickname: true } },
          },
        },
      },
      take: 500,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Admin notifications fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/admin/notifications
export async function POST(req: NextRequest) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, title, content, userIds } = body;
    // userIds: null → 전체, string[] → 선택 회원들

    if (!type || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, content" },
        { status: 400 }
      );
    }

    const validTypes = ["INFO", "WARNING", "IMPORTANT", "EVENT"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }

    // 전체 공지
    if (userIds === null || userIds === undefined) {
      const users = await prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true },
      });
      if (users.length === 0) {
        return NextResponse.json({ success: true, message: "알림을 전송할 회원이 없습니다." });
      }
      await prisma.notification.createMany({
        data: users.map((u) => ({ userId: u.id, type, title, content })),
      });
      // 전체 푸시 발송 (fire-and-forget)
      users.forEach((u) =>
        sendPushToUser(u.id, { title, body: content, path: "/notifications", type: "notice", notifType: type })
      );
      return NextResponse.json({ success: true, message: `${users.length}명에게 알림을 전송했습니다.` });
    }

    // 선택 회원 (1명 이상)
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "수신 회원을 선택해주세요." }, { status: 400 });
    }

    await prisma.notification.createMany({
      data: userIds.map((uid: string) => ({ userId: uid, type, title, content })),
    });
    // 선택 회원 푸시 발송 (fire-and-forget)
    console.log("[Admin Notifications] 푸시 발송 대상 userIds:", userIds);
    userIds.forEach((uid: string) =>
      sendPushToUser(uid, { title, body: content, path: "/notifications", type: "notice", notifType: type })
    );

    return NextResponse.json({
      success: true,
      message: `${userIds.length}명에게 알림을 전송했습니다.`,
    });
  } catch (error) {
    console.error("[Admin Notifications] Create error:", error);
    return NextResponse.json(
      { error: "Internal error", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/notifications — 단건(id) 또는 복수(ids)
export async function DELETE(req: NextRequest) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ids } = body;

    if (ids && Array.isArray(ids) && ids.length > 0) {
      await prisma.notification.deleteMany({ where: { id: { in: ids } } });
    } else if (id) {
      await prisma.notification.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: "Missing id or ids" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin notification delete error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
