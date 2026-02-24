/**
 * Auth Layout
 *
 * Minimal centered layout for login/signup pages.
 * No navigation bar — clean, focused experience.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-romantic flex items-center justify-center px-4">
      {children}
    </div>
  );
}
