import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE_NAME = "admin-token";
const ADMIN_TOKEN_EXPIRY = "8h";

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("ADMIN_JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(adminId: string): Promise<string> {
  return new SignJWT({ role: "admin", adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ADMIN_TOKEN_EXPIRY)
    .sign(getSecret());
}

export async function verifyAdminToken(
  token: string,
): Promise<{ valid: true; adminId: string } | { valid: false }> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { valid: true, adminId: payload.adminId as string };
  } catch {
    return { valid: false };
  }
}
