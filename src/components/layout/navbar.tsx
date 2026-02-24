"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, User, ClipboardList, Users, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mobile Bottom Navigation Bar
 *
 * Fixed bottom nav for mobile-first design.
 * Highlights current active route with pink accent.
 */

const NAV_ITEMS = [
  { href: "/profile", label: "프로필", icon: User },
  { href: "/survey", label: "설문", icon: ClipboardList },
  { href: "/matches", label: "매칭", icon: Heart },
  { href: "/chat", label: "채팅", icon: MessageCircle },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Top header (desktop) */}
      <header className="sticky top-0 z-50 glass border-b border-pink-100">
        <div className="container mx-auto max-w-lg flex items-center justify-between h-14 px-4">
          <Link href="/" className="flex items-center gap-2">
            <Heart size={24} fill="hsl(340, 82%, 62%)" strokeWidth={0} />
            <span className="text-lg font-bold text-gradient-pink">이어줌</span>
          </Link>
          <Link
            href="/settings"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Users size={20} />
          </Link>
        </div>
      </header>

      {/* Bottom nav (mobile-first) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-pink-100 safe-area-bottom">
        <div className="container mx-auto max-w-lg flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary/70",
                )}
              >
                <Icon size={20} fill={isActive ? "hsl(340, 82%, 62%)" : "none"} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
