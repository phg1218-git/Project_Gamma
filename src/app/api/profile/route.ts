import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { profileSchema, profileUpdateSchema } from "@/lib/validations/profile";
import { ZodError } from "zod";

/**
 * Profile API Routes
 *
 * GET  /api/profile — Get current user's profile
 * POST /api/profile — Create profile (first-time setup)
 * PUT  /api/profile — Update existing profile
 */

// ── GET: Fetch current user's profile ──
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "프로필이 없습니다.", needsSetup: true }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[Profile GET]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// ── POST: Create profile (first-time setup) ──
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // Check if profile already exists
    const existing = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });
    if (existing) {
      return NextResponse.json({ error: "프로필이 이미 존재합니다." }, { status: 409 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = profileSchema.parse(body);

    // Create profile and mark user as complete in a transaction
    const profile = await prisma.$transaction(async (tx) => {
      const newProfile = await tx.profile.create({
        data: {
          userId: session.user.id,
          ...validated,
        },
      });

      await tx.user.update({
        where: { id: session.user.id },
        data: { profileComplete: true },
      });

      return newProfile;
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", details: error.errors },
        { status: 400 },
      );
    }
    console.error("[Profile POST]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// ── PUT: Update existing profile ──
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // Verify profile exists
    const existing = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "프로필을 먼저 생성해주세요." }, { status: 404 });
    }

    // Parse and validate (partial update)
    const body = await request.json();
    const validated = profileUpdateSchema.parse(body);

    const profile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: validated,
    });

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", details: error.errors },
        { status: 400 },
      );
    }
    console.error("[Profile PUT]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
