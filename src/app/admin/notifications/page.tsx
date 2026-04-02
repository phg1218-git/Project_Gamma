"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  userId: string | null;
  type: "INFO" | "WARNING" | "IMPORTANT" | "EVENT";
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  user: {
    email: string | null;
    profile: {
      nickname: string;
    } | null;
  } | null;
}

const TYPE_LABELS = {
  INFO: "일반",
  WARNING: "주의",
  IMPORTANT: "중요",
  EVENT: "이벤트",
};

const TYPE_COLORS = {
  INFO: "bg-blue-50 text-blue-700 border-blue-200",
  WARNING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  IMPORTANT: "bg-red-50 text-red-700 border-red-200",
  EVENT: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/admin/notifications");
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

  async function handleDelete(id: string) {
    if (!confirm("이 알림을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">알림 관리</h1>
          <p className="text-sm text-slate-500 mt-1">
            사용자에게 전송된 알림 {notifications.length}개
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 transition-colors"
        >
          새 알림 보내기
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">전송된 알림이 없습니다.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        TYPE_COLORS[notif.type]
                      }`}
                    >
                      {TYPE_LABELS[notif.type]}
                    </span>
                    {notif.userId === null && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        전체 공지
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {notif.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">{notif.content}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      발송: {new Date(notif.createdAt).toLocaleString("ko-KR")}
                    </span>
                    {notif.user && (
                      <span>
                        수신: {notif.user.profile?.nickname || notif.user.email}
                      </span>
                    )}
                    {notif.isRead && notif.readAt && (
                      <span className="text-green-600">
                        ✓ 읽음 ({new Date(notif.readAt).toLocaleDateString("ko-KR")})
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(notif.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateNotificationModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchNotifications();
          }}
        />
      )}
    </div>
  );
}

// ── Create Notification Modal ──
function CreateNotificationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState<"INFO" | "WARNING" | "IMPORTANT" | "EVENT">("INFO");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetType, setTargetType] = useState<"all" | "user">("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [users, setUsers] = useState<{ id: string; email: string | null; nickname: string }[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (targetType === "user") {
      fetch("/api/admin/users?limit=1000")
        .then((res) => res.json())
        .then((data) => {
          const userList = (data.users || []).map((u: any) => ({
            id: u.id,
            email: u.email,
            nickname: u.profile?.nickname || "닉네임 없음",
          }));
          setUsers(userList);
        })
        .catch(console.error);
    }
  }, [targetType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    if (targetType === "user" && !targetUserId) {
      alert("수신 회원을 선택해주세요.");
      return;
    }

    setSending(true);
    try {
      const payload = {
        type,
        title: title.trim(),
        content: content.trim(),
        userId: targetType === "all" ? null : targetUserId,
      };

      console.log("Sending notification:", payload);

      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Response:", data);

      if (res.ok) {
        alert(data.message || "알림이 전송되었습니다.");
        onCreated();
      } else {
        const errorMsg = data.error || "알림 전송에 실패했습니다.";
        const details = data.details ? `\n상세: ${data.details}` : "";
        alert(errorMsg + details);
        console.error("Server error:", data);
      }
    } catch (error) {
      console.error("Failed to create notification:", error);
      alert("알림 전송 중 오류가 발생했습니다.\n브라우저 콘솔을 확인해주세요.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">새 알림 보내기</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              알림 유형
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="INFO">일반</option>
              <option value="WARNING">주의</option>
              <option value="IMPORTANT">중요</option>
              <option value="EVENT">이벤트</option>
            </select>
          </div>

          {/* Target */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              수신 대상
            </label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="all"
                  checked={targetType === "all"}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="text-pink-500"
                />
                <span className="text-sm">전체 회원</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="user"
                  checked={targetType === "user"}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="text-pink-500"
                />
                <span className="text-sm">특정 회원</span>
              </label>
            </div>
            {targetType === "user" && (
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">회원 선택</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nickname} ({u.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="알림 제목"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <p className="text-xs text-slate-500 mt-1">{title.length}/100</p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="알림 내용을 입력하세요"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">{content.length}/500</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={sending || !title.trim() || !content.trim()}
              className="flex-1 rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 transition-colors disabled:opacity-50"
            >
              {sending ? "전송 중..." : "전송"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
