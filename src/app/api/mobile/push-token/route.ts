import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * Mobile Push Token API
 *
 * POST /api/mobile/push-token   – register or refresh a device token
 * DELETE /api/mobile/push-token – revoke token on logout / account deletion
 *
 * Auth: existing session cookie (next-auth.session-token / authjs.session-token).
 * Called from the native app via the JS bridge after push permission is granted.
 */

const registerSchema = z.object({
  platform:   z.enum(["android", "ios"]),
  token:      z.string().min(1).max(4096),
  apnsToken:  z.string().min(1).max(4096).optional(),
  deviceId:   z.string().min(1).max(256),
  appVersion: z.string().min(1).max(32),
});

const revokeSchema = z.object({
  deviceId: z.string().min(1).max(256),
});

// POST /api/mobile/push-token
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { platform, token, apnsToken, deviceId, appVersion } = parsed.data;

    await prisma.mobilePushToken.upsert({
      where: {
        userId_deviceId: { userId: session.user.id, deviceId },
      },
      update: {
        platform,
        token,
        apnsToken:  apnsToken ?? null,
        appVersion,
        updatedAt:  new Date(),
      },
      create: {
        userId:    session.user.id,
        platform,
        token,
        apnsToken: apnsToken ?? null,
        deviceId,
        appVersion,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[push-token] POST error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/mobile/push-token
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = revokeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await prisma.mobilePushToken.deleteMany({
      where: {
        userId:   session.user.id,
        deviceId: parsed.data.deviceId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[push-token] DELETE error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
