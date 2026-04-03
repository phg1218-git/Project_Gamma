"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Bell, Check, MessageCircle, Sparkles } from "lucide-react";

interface Notification {
  id: string;
  type: "INFO" | "WARNING" | "IMPORTANT" | "EVENT" | "SYSTEM";
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  actionType: string | null;
  actionPayload: { recommendationId?: string } | null;
}

const TYPE_LABELS: Record<Notification["type"], string> = {
  INFO: "일반",
  WARNING: "주의",
  IMPORTANT: "중요",
  EVENT: "이벤트",
  SYSTEM: "시스템",
};

const TYPE_COLORS: Record<Notification["type"], string> = {
  INFO: "bg-blue-50 text-blue-700",
  WARNING: "bg-yellow-50 text-yellow-700",
  IMPORTANT: "bg-red-50 text-red-700",
  EVENT: "bg-purple-50 text-purple-700",
  SYSTEM: "bg-pink-50 text-pink-700",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const notifs: Notification[] = data.notifications || [];
      setNotifications(notifs);

      // navbar 배지를 현재 미읽음 수로 동기화 (읽음 처리는 하지 않음)
      const unreadCount = notifs.filter((n) => !n.isRead).length;
      window.dispatchEvent(
        new CustomEvent("notificationRead", {
          detail: { unreadCount },
        })
      );
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id: string) {
    // 낙관적 업데이트
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
    );
    setNotifications(updated);
    const newCount = updated.filter((n) => !n.isRead).length;
    window.dispatchEvent(
      new CustomEvent("notificationRead", { detail: { unreadCount: newCount } })
    );

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }

  async function handleMarkAllAsRead() {
    // 액션 대기 중인 알림(수락/거절 버튼 있는 것)은 제외하고 읽음 처리
    const ACTION_TYPES = ["MATCH_REQUEST"]; // 버튼 있는 타입만 제외
    setNotifications((prev) =>
      prev.map((n) =>
        ACTION_TYPES.includes(n.actionType ?? "")
          ? n
          : { ...n, isRead: true, readAt: new Date().toISOString() }
      )
    );
    const newCount = notifications.filter(
      (n) => !n.isRead && ACTION_TYPES.includes(n.actionType ?? "")
    ).length;
    window.dispatchEvent(
      new CustomEvent("notificationRead", { detail: { unreadCount: newCount } })
    );

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markAllAsRead: true,
          excludeActionType: ["MATCH_REQUEST"],
        }),
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }

  async function handleMatchRequest(
    notif: Notification,
    accept: boolean
  ) {
    const recommendationId = notif.actionPayload?.recommendationId;
    if (!recommendationId) return;

    setRespondingId(notif.id);
    try {
      const res = await fetch("/api/matches/recommendation/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId, accept }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Respond error:", err);
        return;
      }

      const data = await res.json();

      // 알림 읽음 처리 및 액션 제거 (이미 처리됨)
      const updated = notifications.map((n) =>
        n.id === notif.id
          ? { ...n, isRead: true, readAt: new Date().toISOString(), actionType: null }
          : n
      );
      setNotifications(updated);
      const newCount = updated.filter((n) => !n.isRead).length;
      window.dispatchEvent(
        new CustomEvent("notificationRead", { detail: { unreadCount: newCount } })
      );

      if (accept && data.chatThreadId) {
        router.push(`/chat/${data.chatThreadId}`);
      }
    } catch (error) {
      console.error("Failed to respond to match request:", error);
    } finally {
      setRespondingId(null);
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
          notifications.map((notif) => {
            const isMatchRequest = notif.actionType === "MATCH_REQUEST";
            const isSubthresholdRequest = notif.actionType === "SUBTHRESHOLD_REQUEST";
            const hasAction = isMatchRequest; // SUBTHRESHOLD_REQUEST는 버튼 없음 → 클릭으로 읽음 처리
            const isResponding = respondingId === notif.id;

            return (
              <div
                key={notif.id}
                className={`transition-all ${
                  isSubthresholdRequest
                    ? "rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4 shadow-sm"
                    : `card-romantic p-4 ${notif.isRead && !hasAction ? "opacity-60" : ""}`
                }`}
                onClick={() => {
                  if (!notif.isRead && !hasAction) {
                    handleMarkAsRead(notif.id);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Unread indicator */}
                  {!notif.isRead && !isSubthresholdRequest && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}

                  <div className="flex-1 min-w-0">
                    {/* 인연 제안 배지 */}
                    {isSubthresholdRequest ? (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                          <Sparkles size={11} />
                          인연 제안
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                      </div>
                    ) : (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${
                          TYPE_COLORS[notif.type]
                        }`}
                      >
                        {TYPE_LABELS[notif.type]}
                      </span>
                    )}

                    {/* Title */}
                    <h3 className={`font-semibold mb-1 ${isSubthresholdRequest ? "text-violet-900" : "text-foreground"}`}>
                      {notif.title}
                    </h3>

                    {/* Content */}
                    <p className={`text-sm mb-2 whitespace-pre-wrap ${isSubthresholdRequest ? "text-violet-700" : "text-muted-foreground"}`}>
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

                    {/* MATCH_REQUEST 액션 버튼 (일반) */}
                    {isMatchRequest && (
                      <div className="flex gap-2 mt-3">
                        <button
                          disabled={isResponding}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMatchRequest(notif, false);
                          }}
                          className="flex-1 py-2 rounded-xl border border-pink-200 text-sm font-medium text-muted-foreground hover:bg-pink-50 active:bg-pink-100 transition-colors disabled:opacity-50"
                        >
                          거절
                        </button>
                        <button
                          disabled={isResponding}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMatchRequest(notif, true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-pink text-sm font-medium text-white hover:brightness-105 active:brightness-95 transition-all disabled:opacity-50"
                        >
                          <MessageCircle size={14} />
                          {isResponding ? "처리 중..." : "수락"}
                        </button>
                      </div>
                    )}

                    {/* SUBTHRESHOLD_REQUEST — 버튼 없음, 매칭 화면에서 결정 */}
                    {isSubthresholdRequest && (
                      <p className="mt-2 text-xs text-violet-400">
                        매칭 화면에서 프로필을 확인하고 결정할 수 있어요.
                      </p>
                    )}
                  </div>

                  {/* Read status */}
                  {notif.isRead && !hasAction && (
                    <Check size={16} className="text-green-500 flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
