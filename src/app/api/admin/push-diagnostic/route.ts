import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { fcmMessaging } from "@/lib/firebase-admin";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/jwt";

/**
 * 푸시 알림 진단 API (관리자 전용)
 * GET /api/admin/push-diagnostic?email=xxx@gmail.com
 */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get(ADMIN_COOKIE_NAME)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email");

  // 1. Firebase 초기화 여부
  const firebaseInitialized = fcmMessaging !== null;

  // 2. 해당 유저의 FCM 토큰 목록
  let tokenInfo = null;
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        mobilePushTokens: {
          select: {
            platform: true,
            deviceId: true,
            appVersion: true,
            updatedAt: true,
            // token은 보안상 앞 10자만 표시
            token: true,
          },
        },
      },
    });

    if (user) {
      tokenInfo = {
        userId: user.id,
        email: user.email,
        tokenCount: user.mobilePushTokens.length,
        tokens: user.mobilePushTokens.map((t) => ({
          platform: t.platform,
          deviceId: t.deviceId,
          appVersion: t.appVersion,
          updatedAt: t.updatedAt,
          tokenPreview: t.token.slice(0, 15) + "...",
        })),
      };
    } else {
      tokenInfo = { error: "해당 이메일의 유저를 찾을 수 없습니다." };
    }
  }

  // 3. 테스트 푸시 발송 (토큰이 있으면)
  let pushTestResult = null;
  if (
    firebaseInitialized &&
    tokenInfo &&
    "tokenCount" in tokenInfo &&
    tokenInfo.tokenCount > 0 &&
    email
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { mobilePushTokens: { select: { token: true } } },
      });
      const tokens = user?.mobilePushTokens.map((t) => t.token) ?? [];
      const result = await fcmMessaging!.sendEach(
        tokens.map((token) => ({
          token,
          notification: {
            title: "🔔 푸시 진단 테스트",
            body: "Firebase 푸시 알림이 정상 동작합니다!",
          },
          data: { path: "/notifications", type: "notice" },
          android: {
            priority: "high" as const,
            notification: { channelId: "channel_match", sound: "default" },
          },
          apns: { payload: { aps: { sound: "default", badge: 1 } } },
        }))
      );
      pushTestResult = {
        successCount: result.successCount,
        failureCount: result.failureCount,
        responses: result.responses.map((r, i) => ({
          token: tokens[i].slice(0, 15) + "...",
          success: r.success,
          error: r.error?.message ?? null,
        })),
      };
    } catch (err) {
      pushTestResult = { error: String(err) };
    }
  }

  return NextResponse.json({
    diagnosis: {
      firebaseInitialized,
      envVarSet: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      envVarLength: process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.length ?? 0,
    },
    tokenInfo,
    pushTestResult,
  });
}
