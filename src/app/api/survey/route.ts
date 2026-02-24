import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { surveySchema } from "@/lib/validations/survey";
import { ZodError } from "zod";

/**
 * Survey API Routes
 *
 * GET  /api/survey — Get current user's survey responses
 * POST /api/survey — Submit (or overwrite) survey responses
 */

// ── GET: Fetch current user's survey response ──
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const response = await prisma.surveyResponse.findUnique({
      where: { userId: session.user.id },
    });

    if (!response) {
      return NextResponse.json(
        { error: "설문을 아직 완료하지 않았습니다.", needsSurvey: true },
        { status: 404 },
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Survey GET]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// ── POST: Submit survey responses ──
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // User must have completed profile first
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profileComplete: true },
    });
    if (!user?.profileComplete) {
      return NextResponse.json(
        { error: "프로필을 먼저 완성해주세요." },
        { status: 400 },
      );
    }

    // Parse and validate survey answers
    const body = await request.json();
    const validated = surveySchema.parse(body);

    // Upsert: create if first time, update if re-submitting
    const response = await prisma.surveyResponse.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        answers: validated,
      },
      update: {
        answers: validated,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "설문 응답이 올바르지 않습니다.", details: error.errors },
        { status: 400 },
      );
    }
    console.error("[Survey POST]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
