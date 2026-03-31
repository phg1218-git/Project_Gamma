// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

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

const ADMIN_COOKIE_NAME = "admin-token";

function getAdminSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function isAdminAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;

  const secret = getAdminSecret();
  if (!secret) return false;

  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin routes ──────────────────────────────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // Admin login page & auth callbacks are public
    if (
      pathname === "/admin/login" ||
      pathname === "/api/admin/login" ||
      pathname === "/api/admin/google-callback" ||
      pathname === "/api/admin/is-admin"
    ) {
      return NextResponse.next();
    }

    const authenticated = await isAdminAuthenticated(req);
    if (!authenticated) {
      // API routes return 401 JSON
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Page routes redirect to admin login
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // ── Public routes ─────────────────────────────────────────
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/signup") ||
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

  // Forward pathname as header so server component layouts can read it
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/survey/:path*",
    "/match/:path*",
    "/matches/:path*",
    "/chat/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
