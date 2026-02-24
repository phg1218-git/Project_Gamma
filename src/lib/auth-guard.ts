import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Server-side authentication guard.
 * Use in Server Components and API routes.
 *
 * Returns the authenticated user or redirects to login.
 * Optionally checks if profile is complete.
 */
export async function requireAuth(options?: { requireProfile?: boolean }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (options?.requireProfile) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profileComplete: true },
    });

    if (!user?.profileComplete) {
      redirect("/profile/setup");
    }
  }

  return session;
}

/**
 * API-level auth guard.
 * Returns the session or throws (for API route use).
 */
export async function requireAuthAPI() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session;
}
