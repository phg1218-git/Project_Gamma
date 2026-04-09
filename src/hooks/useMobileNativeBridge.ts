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
    (window as unknown as Record<string, unknown>)["ProjectGammaNativeAvailable"] === true;

  useEffect(() => {
    if (!isNative) return;

    // ── nativePushToken ───────────────────────────────────────────────────
    const handlePushToken = async (event: Event) => {
      const e = event as CustomEvent<{
        platform: "android" | "ios";
        fcmToken?: string;
        apnsToken?: string;
        appVersion: string;
      }>;
      const { platform, fcmToken, apnsToken, appVersion } = e.detail;
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

    // ── nativeAppReady ────────────────────────────────────────────────────
    const handleAppReady = (event: Event) => {
      const e = event as CustomEvent<{
        platform: string;
        appVersion: string;
        buildNumber: string | number;
      }>;
      console.debug("[NativeBridge] App ready", e.detail);
    };

    window.addEventListener("nativePushToken", handlePushToken);
    window.addEventListener("nativeAppReady", handleAppReady);

    return () => {
      window.removeEventListener("nativePushToken", handlePushToken);
      window.removeEventListener("nativeAppReady", handleAppReady);
    };
  }, [isNative]);

  return { isNative };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a stable per-browser-session device ID stored in localStorage.
 * On native WebView this persists across app restarts via WebView localStorage.
 */
function getOrCreateDeviceId(): string {
  const key   = "pg_device_id";
  const stored = localStorage.getItem(key);
  if (stored) return stored;

  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}
