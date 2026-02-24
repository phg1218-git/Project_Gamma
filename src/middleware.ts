import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Next.js Middleware — Route Protection
 *
 * Protects /profile, /survey, /matches, /chat, /settings routes.
 * Redirects unauthenticated users to /login.
 * Public routes: /, /login, /api/auth
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes — always accessible
  const publicRoutes = ["/", "/login"];
  if (publicRoutes.includes(pathname) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Protected routes — require authentication
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
