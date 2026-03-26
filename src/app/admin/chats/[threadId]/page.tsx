"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface ChatThread {
  id: string;
  isActive: boolean;
  createdAt: string;
  closedAt: string | null;
  photoRevealA: boolean;
  photoRevealB: boolean;
  userA: {
    id: string;
    name: string | null;
    email: string | null;
    profile: {
      nickname: string;
      gender: string;
    } | null;
  };
  userB: {
    id: string;
    name: string | null;
    email: string | null;
    profile: {
      nickname: string;
      gender: string;
    } | null;
  };
  match: {
    score: number;
    status: string;
    createdAt: string;
  };
  _count: {
    messages: number;
  };
}

interface MessageResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!threadId) return;

    // 채팅 스레드 정보 로드
    fetch(`/api/admin/chats/${threadId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setThread)
      .catch(() => {
        alert("채팅 정보를 불러올 수 없습니다.");
        router.push("/admin/chats");
      });
  }, [threadId, router]);

  useEffect(() => {
    if (!threadId) return;

    // 메시지 로드
    setLoading(true);
    fetch(`/api/admin/chats/${threadId}/messages?page=${currentPage}&limit=50`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: MessageResponse) => {
        setMessages(data.messages);
        setTotalPages(data.pagination.totalPages);
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [threadId, currentPage]);

  function displayUser(u: {
    id: string;
    name: string | null;
    email: string | null;
    profile: { nickname: string; gender: string } | null;
  }) {
    if (u.profile?.nickname) return u.profile.nickname;
    return u.name || u.email || u.id.slice(0, 8);
  }

  function getGenderEmoji(gender: string) {
    return gender === "MALE" ? "👨" : "👩";
  }

  if (!thread) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-slate-400">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/chats"
            className="mb-2 inline-block text-sm text-slate-500 hover:text-slate-700"
          >
            ← 채팅 목록으로
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">채팅 상세</h1>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            thread.isActive
              ? "bg-green-50 text-green-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {thread.isActive ? "활성" : "종료"}
        </span>
      </div>

      {/* 채팅 스레드 정보 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 참여자 A */}
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-medium text-slate-600">참여자 A</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {thread.userA.profile && (
                <span className="text-2xl">
                  {getGenderEmoji(thread.userA.profile.gender)}
                </span>
              )}
              <Link
                href={`/admin/users/${thread.userA.id}`}
                className="text-lg font-medium text-blue-600 hover:text-blue-800"
              >
                {displayUser(thread.userA)}
              </Link>
            </div>
            <div className="text-sm text-slate-500">{thread.userA.email}</div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-slate-600">사진 공개:</span>
              <span
                className={
                  thread.photoRevealA
                    ? "text-green-600"
                    : "text-slate-400"
                }
              >
                {thread.photoRevealA ? "✓ 공개함" : "✗ 미공개"}
              </span>
            </div>
          </div>
        </div>

        {/* 참여자 B */}
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-medium text-slate-600">참여자 B</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {thread.userB.profile && (
                <span className="text-2xl">
                  {getGenderEmoji(thread.userB.profile.gender)}
                </span>
              )}
              <Link
                href={`/admin/users/${thread.userB.id}`}
                className="text-lg font-medium text-blue-600 hover:text-blue-800"
              >
                {displayUser(thread.userB)}
              </Link>
            </div>
            <div className="text-sm text-slate-500">{thread.userB.email}</div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-slate-600">사진 공개:</span>
              <span
                className={
                  thread.photoRevealB
                    ? "text-green-600"
                    : "text-slate-400"
                }
              >
                {thread.photoRevealB ? "✓ 공개함" : "✗ 미공개"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 매칭 정보 */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-medium text-slate-600">매칭 정보</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <div className="text-xs text-slate-500">매칭 점수</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {thread.match.score.toFixed(1)}점
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">매칭 상태</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {thread.match.status === "ACCEPTED" ? "수락됨" : thread.match.status}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">총 메시지 수</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {thread._count.messages}개
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">채팅 시작일</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {new Date(thread.createdAt).toLocaleDateString("ko-KR")}
            </div>
          </div>
        </div>
        {thread.closedAt && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="text-xs text-slate-500">종료일</div>
            <div className="mt-1 text-sm text-slate-700">
              {new Date(thread.closedAt).toLocaleString("ko-KR")}
            </div>
          </div>
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="font-medium text-slate-900">
            채팅 내용 ({messages.length}개)
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400">
              불러오는 중...
            </div>
          ) : messages.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              메시지가 없습니다.
            </div>
          ) : (
            messages.map((msg) => {
              const isSenderA = msg.sender.id === thread.userA.id;
              const senderName = isSenderA
                ? displayUser(thread.userA)
                : displayUser(thread.userB);

              return (
                <div key={msg.id} className="px-6 py-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        isSenderA ? "text-blue-600" : "text-purple-600"
                      }`}
                    >
                      {senderName}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(msg.createdAt).toLocaleString("ko-KR")}
                    </span>
                    {msg.readAt && (
                      <span className="text-xs text-green-600">읽음</span>
                    )}
                  </div>
                  <div className="text-slate-700">{msg.content}</div>
                </div>
              );
            })
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-slate-200 px-6 py-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded border border-slate-200 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              이전
            </button>
            <span className="text-sm text-slate-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded border border-slate-200 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
