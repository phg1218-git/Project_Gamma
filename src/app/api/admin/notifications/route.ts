import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/jwt";

/**
 * Admin Notifications API
 *
 * GET: 모든 알림 조회 (최신순)
 * POST: 새 알림 생성 (전체 공지 또는 특정 회원)
 * DELETE: 알림 삭제
 */

// GET /api/admin/notifications - 모든 알림 조회
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE_NAME);
    if (!adminToken) {
      console.error("[Admin Notifications] No admin token found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                nickname: true,
              },
            },
          },
        },
      },
      take: 200, // 최근 200개
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Admin notifications fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/admin/notifications - 새 알림 생성
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE_NAME);
    if (!adminToken) {
      console.error("[Admin Notifications] Unauthorized: No admin token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, title, content, userId } = body;

    console.log("[Admin Notifications] Creating notification:", { type, title, userId });

    if (!type || !title || !content) {
      console.error("[Admin Notifications] Missing fields:", { type, title, content: !!content });
      return NextResponse.json(
        { error: "Missing required fields: type, title, content" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["INFO", "WARNING", "IMPORTANT", "EVENT"];
    if (!validTypes.includes(type)) {
      console.error("[Admin Notifications] Invalid type:", type);
      return NextResponse.json(
        { error: "Invalid notification type" },
        { status: 400 }
      );
    }

    // 전체 공지인 경우 (userId === null)
    if (userId === null || userId === "") {
      console.log("[Admin Notifications] Broadcasting to all users");

      // 모든 활성 회원에게 알림 생성
      const users = await prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true },
      });

      console.log(`[Admin Notifications] Found ${users.length} users`);

      if (users.length === 0) {
        return NextResponse.json({
          success: true,
          message: "알림을 전송할 회원이 없습니다.",
        });
      }

      await prisma.notification.createMany({
        data: users.map((user) => ({
          userId: user.id,
          type,
          title,
          content,
        })),
      });

      console.log(`[Admin Notifications] Successfully created ${users.length} notifications`);

      return NextResponse.json({
        success: true,
        message: `${users.length}명에게 알림을 전송했습니다.`,
      });
    }

    // 특정 회원에게 알림
    console.log("[Admin Notifications] Sending to specific user:", userId);

    const notification = await prisma.notification.create({
      data: {
        userId: userId,
        type,
        title,
        content,
      },
    });

    console.log("[Admin Notifications] Successfully created notification:", notification.id);

    return NextResponse.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error("[Admin Notifications] Create error:", error);

    // Prisma 에러 상세 정보
    if (error instanceof Error) {
      console.error("[Admin Notifications] Error details:", error.message);
      console.error("[Admin Notifications] Error stack:", error.stack);

      return NextResponse.json({
        error: "Internal error",
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/admin/notifications - 알림 삭제
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE_NAME);
    if (!adminToken) {
      console.error("[Admin Notifications] No admin token found for DELETE");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin notification delete error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
