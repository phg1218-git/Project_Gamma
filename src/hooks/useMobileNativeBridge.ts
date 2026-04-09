"use client";

import { useEffect } from "react";

/**
 * Detects the ProjectGamma native WebView bridge and wires up
 * events that require web-side handling:
 *
 * - `nativePushToken`  → POST /api/mobile/push-token
 * - `nativeAppReady`   → logs native client info
 * - `nativeNetworkStatus` → can be extended to show offline UI
 *
 * Mount this hook once in a root layout component.
 */
export function useMobileNativeBridge() {
  const isNative =
    typeof window !== "undefined" &&
    (
      // iOS: WKUserScript로 document start에 주입
      (window as unknown as Record<string, unknown>)["ProjectGammaNativeAvailable"] === true ||
      // Android: addJavascriptInterface로 동기 주입 (ProjectGammaNative 객체 존재 여부로 판별)
      typeof (window as unknown as Record<string, unknown>)["ProjectGammaNative"] !== "undefined"
    );

  useEffect(() => {
    if (!isNative) return;

    // ── nativePushToken ───────────────────────────────────────────────────
    const registerPushToken = async (detail: {
      platform: "android" | "ios";
      fcmToken?: string;
      apnsToken?: string;
      appVersion: string;
    }) => {
      const { platform, fcmToken, apnsToken, appVersion } = detail;
      if (!fcmToken) return;

      const deviceId = getOrCreateDeviceId();

      try {
        await fetch("/api/mobile/push-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform,
            token: fcmToken,
            apnsToken,
            deviceId,
            appVersion,
          }),
        });
      } catch {
        // Non-critical – silently ignore, will retry on next token refresh
      }
    };

    const handlePushToken = (event: Event) => {
      const e = event as CustomEvent<{
        platform: "android" | "ios";
        fcmToken?: string;
        apnsToken?: string;
        appVersion: string;
      }>;
      registerPushToken(e.detail);
    };

    // ── nativeAppReady ────────────────────────────────────────────────────
    const handleAppReady = (event: Event) => {
      const e = event as CustomEvent<{
        platform: string;
        appVersion: string;
        buildNumber: string | number;
      }>;
      console.debug("[NativeBridge] App ready", e.detail);
    };

    // 알림 권한 요청 (Android 13+에서 필수)
    requestPushPermission();

    window.addEventListener("nativePushToken", handlePushToken);
    window.addEventListener("nativeAppReady", handleAppReady);

    // 훅이 마운트되기 전에 이미 dispatch된 토큰이 있으면 즉시 처리
    const w = window as unknown as { __pgNative?: Record<string, unknown> };
    if (w.__pgNative?.nativePushToken) {
      registerPushToken(
        w.__pgNative.nativePushToken as {
          platform: "android" | "ios";
          fcmToken?: string;
          apnsToken?: string;
          appVersion: string;
        }
      );
    }

    return () => {
      window.removeEventListener("nativePushToken", handlePushToken);
      window.removeEventListener("nativeAppReady", handleAppReady);
    };
  }, [isNative]);

  return { isNative };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function requestPushPermission() {
  try {
    const bridge = (window as unknown as Record<string, unknown>)["ProjectGammaNative"] as
      | { postMessage: (msg: string) => void }
      | undefined;
    bridge?.postMessage(JSON.stringify({ action: "requestPushPermission", payload: {} }));
  } catch {
    // ignore
  }
}

/**
 * Returns a stable per-browser-session device ID stored in localStorage.
 * On native WebView this persists across app restarts via WebView localStorage.
 */
function getOrCreateDeviceId(): string {
  const key    = "pg_device_id";
  const stored = localStorage.getItem(key);
  if (stored) return stored;

  // crypto.randomUUID() is unavailable in older Android WebView – use fallback
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        });
  localStorage.setItem(key, id);
  return id;
}
