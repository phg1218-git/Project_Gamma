"use client";

import { useEffect, useState } from "react";
import { Heart, Bell, Check } from "lucide-react";

interface Notification {
  id: string;
  type: "INFO" | "WARNING" | "IMPORTANT" | "EVENT";
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

const TYPE_LABELS = {
  INFO: "일반",
  WARNING: "주의",
  IMPORTANT: "중요",
  EVENT: "이벤트",
};

const TYPE_COLORS = {
  INFO: "bg-blue-50 text-blue-700",
  WARNING: "bg-yellow-50 text-yellow-700",
  IMPORTANT: "bg-red-50 text-red-700",
  EVENT: "bg-purple-50 text-purple-700",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id: string) {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );
        // Navbar 배지 업데이트 트리거
        window.dispatchEvent(new CustomEvent("notificationRead"));
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        // Navbar 배지 업데이트 트리거
        window.dispatchEvent(new CustomEvent("notificationRead"));
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Heart className="heart-pulse" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">알림</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림` : "모든 알림 확인함"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
          >
            <Check size={16} />
            모두 읽음
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="card-romantic p-8 text-center">
            <Bell className="mx-auto mb-3 text-pink-200" size={48} />
            <p className="text-sm text-muted-foreground">받은 알림이 없습니다.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`card-romantic p-4 transition-all ${
                notif.isRead ? "opacity-60" : ""
              }`}
              onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
            >
              <div className="flex items-start gap-3">
                {/* Unread indicator */}
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}

                <div className="flex-1 min-w-0">
                  {/* Type badge */}
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${
                      TYPE_COLORS[notif.type]
                    }`}
                  >
                    {TYPE_LABELS[notif.type]}
                  </span>

                  {/* Title */}
                  <h3 className="font-semibold text-foreground mb-1">
                    {notif.title}
                  </h3>

                  {/* Content */}
                  <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                    {notif.content}
                  </p>

                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground">
                    {new Date(notif.createdAt).toLocaleString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Read status */}
                {notif.isRead && (
                  <Check size={16} className="text-green-500 flex-shrink-0 mt-1" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
