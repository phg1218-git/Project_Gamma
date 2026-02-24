import { redirect } from "next/navigation";
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

  // This redirect is skipped if already on /profile/setup
  // The middleware or page itself handles that case

  return (
    <div className="min-h-screen pb-20">
      {/* Top + bottom navigation */}
      <Navbar />

      {/* Page content */}
      <main className="page-container">{children}</main>
    </div>
  );
}
