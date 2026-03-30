import { auth } from "@/lib/auth";
import { signAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin/jwt";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const baseUrl = new URL(req.url).origin;
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.redirect(`${baseUrl}/admin/login?error=not_logged_in`);
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!adminEmails.includes(session.user.email)) {
    return NextResponse.redirect(`${baseUrl}/admin/login?error=unauthorized`);
  }

  const token = await signAdminToken(session.user.id ?? session.user.email);

  const response = NextResponse.redirect(`${baseUrl}/admin/dashboard`);
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return response;
}
