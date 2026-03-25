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
    // Reuse the matches API to get all threads, or fetch all via a simple query
    // For simplicity, we fetch matches with chat threads
    fetch("/api/admin/stats")
      .then(() => {
        // Fetch all threads by getting all users' chats
        // Actually, let's create a dedicated fetch
        return fetch("/api/admin/chats");
      })
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
      <h1 className="mb-6 text-2xl font-bold text-slate-900">채팅 관리</h1>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
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
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  불러오는 중...
                </td>
              </tr>
            ) : threads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  채팅이 없습니다.
                </td>
              </tr>
            ) : (
              threads.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${t.userA.id}`} className="text-blue-600 hover:text-blue-800">
                      {displayUser(t.userA)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${t.userB.id}`} className="text-blue-600 hover:text-blue-800">
                      {displayUser(t.userB)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{t._count.messages}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      {t.isActive ? "활성" : "종료"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/chats/${t.id}`} className="text-blue-600 hover:text-blue-800">
                      보기
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
