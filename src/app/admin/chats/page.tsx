"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ChatThread {
  id: string;
  isActive: boolean;
  createdAt: string;
  closedAt: string | null;
  userA: { id: string; name: string | null; email: string | null };
  userB: { id: string; name: string | null; email: string | null };
  _count: { messages: number };
}

export default function AdminChatsPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(() => fetch("/api/admin/chats"))
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setThreads)
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  }, []);

  function displayUser(u: { id: string; name: string | null; email: string | null }) {
    return u.name || u.email || u.id.slice(0, 8);
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-900 md:mb-6 md:text-2xl">채팅 관리</h1>

      {/* ── Desktop table ── */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">참여자 A</th>
              <th className="px-4 py-3 font-medium text-slate-600">참여자 B</th>
              <th className="px-4 py-3 font-medium text-slate-600">메시지 수</th>
              <th className="px-4 py-3 font-medium text-slate-600">상태</th>
              <th className="px-4 py-3 font-medium text-slate-600">시작일</th>
              <th className="px-4 py-3 font-medium text-slate-600">조회</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">불러오는 중...</td></tr>
            ) : threads.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">채팅이 없습니다.</td></tr>
            ) : (
              threads.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${t.userA.id}`} className="text-blue-600 hover:text-blue-800">{displayUser(t.userA)}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${t.userB.id}`} className="text-blue-600 hover:text-blue-800">{displayUser(t.userB)}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{t._count.messages}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                      {t.isActive ? "활성" : "종료"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString("ko-KR")}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/chats/${t.id}`} className="text-blue-600 hover:text-blue-800">보기</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ── */}
      <div className="sm:hidden space-y-2">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">불러오는 중...</div>
        ) : threads.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">채팅이 없습니다.</div>
        ) : (
          threads.map((t) => (
            <Link
              key={t.id}
              href={`/admin/chats/${t.id}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50 active:bg-slate-100"
            >
              {/* 채팅 아이콘 */}
              <div className="h-9 w-9 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {displayUser(t.userA)} · {displayUser(t.userB)}
                  </span>
                  <span className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${t.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                    {t.isActive ? "활성" : "종료"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  메시지 {t._count.messages}개 · {new Date(t.createdAt).toLocaleDateString("ko-KR")}
                </p>
              </div>
              <svg className="h-4 w-4 flex-shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
