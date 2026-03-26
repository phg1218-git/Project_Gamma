import { NextRequest, NextResponse } from "next/server";
import { signAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin/jwt";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const { id, password } = await req.json();

    // DB에서 관리자 계정 조회
    const admin = await prisma.admin.findUnique({
      where: { username: id },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    // 계정 활성화 여부 확인
    if (!admin.isActive) {
      return NextResponse.json(
        { error: "비활성화된 계정입니다." },
        { status: 403 },
      );
    }

    // bcrypt로 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    // JWT 토큰 발급 (adminId 포함)
    const token = await signAdminToken(admin.id);

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }
}
