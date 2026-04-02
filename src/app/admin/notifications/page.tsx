"use client";

import { useEffect, useState, useMemo } from "react";

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
    profile: { nickname: string } | null;
  } | null;
}

interface GroupedNotification {
  ids: string[];
  type: Notification["type"];
  title: string;
  content: string;
  createdAt: string;
  isGlobal: boolean;
  recipients: { nickname: string; email: string | null; isRead: boolean }[];
  readCount: number;
}

const TYPE_LABELS = { INFO: "일반", WARNING: "주의", IMPORTANT: "중요", EVENT: "이벤트" };
const TYPE_COLORS = {
  INFO: "bg-blue-50 text-blue-700 border-blue-200",
  WARNING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  IMPORTANT: "bg-red-50 text-red-700 border-red-200",
  EVENT: "bg-purple-50 text-purple-700 border-purple-200",
};

/** 동일 내용·유형·1분 내 발송 → 1개 그룹으로 묶음 */
function groupNotifications(notifications: Notification[]): GroupedNotification[] {
  const map = new Map<string, GroupedNotification>();

  for (const n of notifications) {
    const minute = Math.floor(new Date(n.createdAt).getTime() / 60000);
    const key = `${n.type}|${n.title}|${n.content}|${minute}`;

    if (!map.has(key)) {
      map.set(key, {
        ids: [],
        type: n.type,
        title: n.title,
        content: n.content,
        createdAt: n.createdAt,
        isGlobal: false,
        recipients: [],
        readCount: 0,
      });
    }

    const g = map.get(key)!;
    g.ids.push(n.id);
    if (n.userId === null) {
      g.isGlobal = true;
    } else {
      g.recipients.push({
        nickname: n.user?.profile?.nickname || n.user?.email || "알 수 없음",
        email: n.user?.email || null,
        isRead: n.isRead,
      });
      if (n.isRead) g.readCount++;
    }
  }

  return Array.from(map.values());
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);

  useEffect(() => { fetchNotifications(); }, []);

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

  async function handleDelete(ids: string[]) {
    if (!confirm(`알림 ${ids.length}건을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids.length === 1 ? { id: ids[0] } : { ids }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
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
            사용자에게 전송된 알림 {notifications.length}개 ({grouped.length}건 발송)
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 transition-colors"
        >
          새 알림 보내기
        </button>
      </div>

      <div className="space-y-3">
        {grouped.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">전송된 알림이 없습니다.</p>
          </div>
        ) : (
          grouped.map((g) => (
            <div
              key={g.ids[0]}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${TYPE_COLORS[g.type]}`}>
                      {TYPE_LABELS[g.type]}
                    </span>
                    {g.isGlobal && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        전체 공지
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {g.ids.length}명 수신
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-1">{g.title}</h3>
                  <p className="text-sm text-slate-600 mb-2">{g.content}</p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>발송: {new Date(g.createdAt).toLocaleString("ko-KR")}</span>

                    {/* 수신자 목록 */}
                    {!g.isGlobal && g.recipients.length > 0 && (
                      <span className="flex items-center gap-1 flex-wrap">
                        수신:
                        {g.recipients.map((r, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium ${
                              r.isRead
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {r.nickname}
                            {r.isRead && <span>✓</span>}
                          </span>
                        ))}
                      </span>
                    )}

                    {/* 읽음 통계 */}
                    {g.recipients.length > 1 && (
                      <span className="text-green-600">
                        읽음 {g.readCount}/{g.recipients.length}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(g.ids)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium flex-shrink-0"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateNotificationModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchNotifications(); }}
        />
      )}
    </div>
  );
}

// ── Create Notification Modal ──
function CreateNotificationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState<"INFO" | "WARNING" | "IMPORTANT" | "EVENT">("INFO");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetType, setTargetType] = useState<"all" | "specific">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [users, setUsers] = useState<{ id: string; email: string | null; nickname: string }[]>([]);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (targetType === "specific") {
      fetch("/api/admin/users?limit=1000")
        .then((r) => r.json())
        .then((data) => {
          setUsers(
            (data.users || []).map((u: any) => ({
              id: u.id,
              email: u.email,
              nickname: u.profile?.nickname || "닉네임 없음",
            }))
          );
        })
        .catch(console.error);
    }
  }, [targetType]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) => u.nickname.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  function toggleUser(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map((u) => u.id));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    if (targetType === "specific" && selectedIds.length === 0) {
      alert("수신 회원을 1명 이상 선택해주세요.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          content: content.trim(),
          userIds: targetType === "all" ? null : selectedIds,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "알림이 전송되었습니다.");
        onCreated();
      } else {
        alert(data.error || "알림 전송에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to create notification:", error);
      alert("알림 전송 중 오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900">새 알림 보내기</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">알림 유형</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-2">수신 대상</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="all" checked={targetType === "all"} onChange={() => setTargetType("all")} className="text-pink-500" />
                <span className="text-sm">전체 회원</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="specific" checked={targetType === "specific"} onChange={() => setTargetType("specific")} className="text-pink-500" />
                <span className="text-sm">특정 회원 선택</span>
              </label>
            </div>

            {targetType === "specific" && (
              <div className="border border-slate-200 rounded-md overflow-hidden">
                {/* 검색 + 전체선택 */}
                <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="닉네임 / 이메일 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 text-sm px-2 py-1 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-400"
                  />
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs text-pink-500 font-medium whitespace-nowrap hover:text-pink-700"
                  >
                    {selectedIds.length === filteredUsers.length && filteredUsers.length > 0 ? "전체 해제" : "전체 선택"}
                  </button>
                </div>

                {/* 선택된 수 표시 */}
                <div className="px-3 py-1.5 bg-pink-50 text-xs text-pink-600 font-medium border-b border-pink-100">
                  {selectedIds.length}명 선택됨
                </div>

                {/* 목록 */}
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">검색 결과 없음</p>
                  ) : (
                    filteredUsers.map((u) => (
                      <label key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(u.id)}
                          onChange={() => toggleUser(u.id)}
                          className="text-pink-500 rounded"
                        />
                        <span className="text-sm font-medium text-slate-700">{u.nickname}</span>
                        <span className="text-xs text-slate-400 truncate">{u.email}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">제목</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">내용</label>
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
          <div className="flex gap-2 pt-2">
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
              {sending ? "전송 중..." : `전송${targetType === "specific" && selectedIds.length > 0 ? ` (${selectedIds.length}명)` : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
