import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

/**
 * Firebase Admin SDK 싱글톤 초기화.
 *
 * 환경변수 FIREBASE_SERVICE_ACCOUNT_JSON 에 Firebase 서비스 계정 JSON을 넣어두면 초기화됨.
 * 미설정 시 푸시 발송 없이 조용히 무시됨 (개발 환경 등).
 *
 * Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성
 * → 다운로드한 JSON 파일 전체를 한 줄 문자열로 환경변수에 설정
 */

let messaging: ReturnType<typeof getMessaging> | null = null;

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (serviceAccountJson && !getApps().length) {
  try {
    initializeApp({
      credential: cert(JSON.parse(serviceAccountJson)),
    });
    messaging = getMessaging();
  } catch (err) {
    console.error("[FirebaseAdmin] 초기화 실패:", err);
  }
} else if (getApps().length) {
  messaging = getMessaging();
}

export { messaging as fcmMessaging };
