"use client";

import { useMobileNativeBridge } from "@/hooks/useMobileNativeBridge";

/**
 * Mount this once inside the root layout (client component boundary).
 * It wires up the native bridge event listeners without rendering anything.
 */
export default function MobileNativeBridgeProvider() {
  useMobileNativeBridge();
  return null;
}
