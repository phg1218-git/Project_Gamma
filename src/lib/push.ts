import { prisma } from "@/lib/prisma";
import { fcmMessaging } from "@/lib/firebase-admin";

export type PushPayload = {
  title: string;
  body: string;
  /** 알림 탭 시 이동할 경로 (예: "/chat/abc123") */
  path?: string;
  /** Android 채널 분기용 타입 */
  type?: "chat" | "match" | "notice";
  /** 알림 배지 색상용 유형 (INFO | WARNING | IMPORTANT | EVENT) */
  notifType?: "INFO" | "WARNING" | "IMPORTANT" | "EVENT";
};

/**
 * 특정 유저의 모든 등록 기기에 FCM 푸시 발송.
 *
 * - Android: FCM 토큰으로 직접 발송
 * - iOS: Firebase가 FCM 토큰 → APNs 자동 변환 (Firebase 콘솔에 APNs 인증서 등록 필요)
 *
 * 실패해도 메인 로직에 영향 없도록 내부에서 에러를 catch함.
 * 만료된 토큰은 자동으로 DB에서 삭제.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!fcmMessaging) return; // FIREBASE_SERVICE_ACCOUNT_JSON 미설정 시 무시

  try {
    const tokens = await prisma.mobilePushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    console.log(`[Push] userId=${userId} 토큰 수: ${tokens.length}`);
    if (tokens.length === 0) return;

    const tokenList = tokens.map((t) => t.token);

    const result = await fcmMessaging.sendEach(
      tokenList.map((token) => ({
        token,
        notification: {
          title: payload.title,
          body: payload.body.length > 100 ? payload.body.slice(0, 100) + "…" : payload.body,
        },
        // data 필드: 앱에서 path/type을 읽어 화면 이동에 활용
        data: {
          path: payload.path ?? "/notifications",
          type: payload.type ?? "notice",
          notifType: payload.notifType ?? "INFO",
        },
        android: {
          priority: "high" as const,
          notification: {
            channelId: payload.type === "chat" ? "channel_chat" : "channel_match",
            sound: "default",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      })),
    );

    console.log(`[Push] Firebase 응답 - 성공: ${result.successCount}, 실패: ${result.failureCount}`);
    result.responses.forEach((r, i) => {
      if (!r.success) console.error(`[Push] 토큰[${i}] 실패:`, r.error?.message);
    });

    // 만료·무효 토큰 자동 정리
    if (result.failureCount > 0) {
      const expiredTokens = result.responses
        .map((res, idx) => ({ res, token: tokenList[idx] }))
        .filter(
          ({ res }) =>
            !res.success &&
            (res.error?.code === "messaging/registration-token-not-registered" ||
              res.error?.code === "messaging/invalid-registration-token"),
        )
        .map(({ token }) => token);

      if (expiredTokens.length > 0) {
        await prisma.mobilePushToken.deleteMany({
          where: { token: { in: expiredTokens } },
        });
      }
    }
  } catch (err) {
    console.error("[Push] sendPushToUser 오류:", err);
  }
}
