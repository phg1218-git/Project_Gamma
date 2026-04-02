"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, User, ClipboardList, Users, MessageCircle, ShieldCheck, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mobile Bottom Navigation Bar
 *
 * Fixed bottom nav for mobile-first design.
 * Highlights current active route with pink accent.
 * Shows unread chat badge with 30s polling + tab visibility refresh.
 */

const NAV_ITEMS = [
  { href: "/profile", label: "프로필", icon: User },
  { href: "/survey", label: "설문", icon: ClipboardList },
  { href: "/matches", label: "매칭", icon: Heart },
  { href: "/chat", label: "채팅", icon: MessageCircle },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // 채팅 상세 페이지에서는 하단 네비게이션 숨기기
  const isInChatThread = pathname.startsWith("/chat/") && pathname !== "/chat";

  useEffect(() => {
    fetch("/api/admin/is-admin")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.isAdmin ?? false))
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/chat");
        if (!res.ok) return;
        const data = await res.json();
        const total = (data.threads ?? []).reduce(
          (sum: number, t: { unreadCount: number }) => sum + (t.unreadCount || 0),
          0,
        );
        setUnreadCount(total);
      } catch {
        // 무시
      }
    }

    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        setNotificationCount(data.unreadCount || 0);
      } catch {
        // 무시
      }
    }

    fetchUnread();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchUnread();
      fetchNotifications();
    }, 60_000);

    // 탭 포커스 시 즉시 갱신
    function onVisible() {
      if (document.visibilityState === "visible") {
        fetchUnread();
        fetchNotifications();
      }
    }

    // 알림 읽음 처리 시 즉시 카운트 반영
    // CustomEvent detail에 unreadCount가 있으면 API 호출 없이 직접 반영
    function onNotificationRead(e: Event) {
      const detail = (e as CustomEvent<{ unreadCount?: number }>).detail;
      if (typeof detail?.unreadCount === "number") {
        setNotificationCount(detail.unreadCount);
      } else {
        fetchNotifications();
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("notificationRead", onNotificationRead);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("notificationRead", onNotificationRead);
    };
  }, []);

  return (
    <>
      {/* Top header (desktop) */}
      <header className="sticky top-0 z-50 glass border-b border-pink-100">
        <div className="container mx-auto max-w-lg flex items-center justify-between h-14 px-4">
          <Link href="/matches" className="flex items-center gap-2">
            <Heart size={24} fill="hsl(340, 82%, 62%)" strokeWidth={0} />
            <span className="text-lg font-bold text-gradient-pink">이어줌</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => router.push("/api/admin/google-callback")}
                className="flex items-center gap-1 rounded-md bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-600 hover:bg-pink-100 transition-colors"
              >
                <ShieldCheck size={14} />
                관리자
              </button>
            )}
            <Link
              href="/notifications"
              className="text-muted-foreground hover:text-primary transition-colors relative"
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Link>
            <Link
              href="/settings"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Users size={20} />
            </Link>
          </div>
        </div>
      </header>

      {/* Bottom nav — 채팅 상세 페이지의 모바일에서만 숨김, PC(sm+)에서는 항상 표시 */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 glass border-t border-pink-100 safe-area-bottom ${isInChatThread ? "hidden sm:block" : ""}`}>
          <div className="container mx-auto max-w-lg flex items-center justify-around h-16 px-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              const isChat = item.href === "/chat";

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
                  <div className="relative">
                    <Icon size={20} fill={isActive ? "hsl(340, 82%, 62%)" : "none"} />
                    {isChat && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
    </>
  );
}
