import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";

/**
 * Main App Layout
 *
 * Authentication-gated layout for all main pages.
 * Includes navigation bar and bottom nav.
 * Redirects unauthenticated users to /login.
 * Redirects users without completed profiles to /profile/setup.
 */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Must be logged in
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check profile completion (except for setup page)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { profileComplete: true },
  });

  // Redirect to profile setup if not complete (skip if already there)
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (!user?.profileComplete && pathname !== "/profile/setup") {
    redirect("/profile/setup");
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Top + bottom navigation */}
      <Navbar />

      {/* Page content */}
      <main className="page-container">{children}</main>
    </div>
  );
}
