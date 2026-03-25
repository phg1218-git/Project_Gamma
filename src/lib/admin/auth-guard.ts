import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "./jwt";

/**
 * API route guard for admin endpoints.
 * Returns NextResponse(401) if the token is missing or invalid.
 * Returns null if authenticated — caller proceeds with normal logic.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await verifyAdminToken(token);
  if (!result.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // Authenticated
}
