// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * IMPORTANT:
 * - Next.js middleware runs on the Edge runtime by default.
 * - Prisma Client (and therefore PrismaAdapter for Auth.js) cannot run on Edge without
 *   Prisma Accelerate / Driver Adapters.
 * - So we MUST NOT call `auth()` (or Prisma) inside middleware.
 *
 * What we do instead:
 * - Keep homepage public.
 * - Protect only specific routes with a lightweight cookie presence check.
 * - Actual authorization is enforced again in server routes/pages as needed.
 */

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Only protect these routes (adjust if your actual routes differ)
  const isProtected =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/survey") ||
    pathname.startsWith("/match") || // NOTE: your app uses /match (not /matches) per earlier plan
    pathname.startsWith("/matches") || // keep both just in case
    pathname.startsWith("/chat") ||
    pathname.startsWith("/settings");

  if (!isProtected) return NextResponse.next();

  /**
   * We only check if a session cookie exists.
   * Cookie names can differ by Auth.js/NextAuth version and environment.
   * Common ones:
   * - next-auth.session-token (dev)
   * - __Secure-next-auth.session-token (prod)
   *
   * If your project uses Auth.js v5, cookie names might be different,
   * but the key idea is: DO NOT query DB here.
   */
  const sessionToken =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/survey/:path*", "/match/:path*", "/matches/:path*", "/chat/:path*", "/settings/:path*"],
};