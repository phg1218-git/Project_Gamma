"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface MatchRow {
  id: string;
  score: number;
  status: string;
  createdAt: string;
  sender: { id: string; name: string | null; email: string | null };
  receiver: { id: string; name: string | null; email: string | null };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "PENDING", label: "대기" },
  { value: "ACCEPTED", label: "수락" },
  { value: "REJECTED", label: "거절" },
  { value: "EXPIRED", label: "만료" },
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "대기", ACCEPTED: "수락", REJECTED: "거절", EXPIRED: "만료",
};

const STATUS_COLOR: Record<string, string> = {
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  EXPIRED: "bg-slate-100 text-slate-600",
  PENDING: "bg-yellow-50 text-yellow-700",
};

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/matches?${params}`);
    if (res.ok) {
      const data = await res.json();
      setMatches(data.matches);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, [page, status]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  async function handleStatusChange(matchId: string, newStatus: string) {
    const res = await fetch(`/api/admin/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchMatches();
  }

  function displayUser(u: { id: string; name: string | null; email: string | null }) {
    return u.name || u.email || u.id.slice(0, 8);
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-900 md:mb-6 md:text-2xl">매칭 관리</h1>

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatus(opt.value); setPage(1); }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              status === opt.value
                ? "bg-slate-900 text-white"
                : "border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">보낸 사람</th>
              <th className="px-4 py-3 font-medium text-slate-600">받은 사람</th>
              <th className="px-4 py-3 font-medium text-slate-600">점수</th>
              <th className="px-4 py-3 font-medium text-slate-600">상태</th>
              <th className="px-4 py-3 font-medium text-slate-600">날짜</th>
              <th className="px-4 py-3 font-medium text-slate-600">상태 변경</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">불러오는 중...</td></tr>
            ) : matches.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">매칭이 없습니다.</td></tr>
            ) : (
              matches.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${m.sender.id}`} className="text-blue-600 hover:text-blue-800">{displayUser(m.sender)}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${m.receiver.id}`} className="text-blue-600 hover:text-blue-800">{displayUser(m.receiver)}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{Math.round(m.score)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[m.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {STATUS_LABEL[m.status] || m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(m.createdAt).toLocaleDateString("ko-KR")}</td>
                  <td className="px-4 py-3">
                    <select
                      value={m.status}
                      onChange={(e) => handleStatusChange(m.id, e.target.value)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
                    >
                      <option value="PENDING">대기</option>
                      <option value="ACCEPTED">수락</option>
                      <option value="REJECTED">거절</option>
                      <option value="EXPIRED">만료</option>
                    </select>
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
        ) : matches.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">매칭이 없습니다.</div>
        ) : (
          matches.map((m) => (
            <div key={m.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              {/* 헤더 행: 두 사람 + 상태 */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Link href={`/admin/users/${m.sender.id}`} className="truncate text-sm font-medium text-blue-600">
                    {displayUser(m.sender)}
                  </Link>
                  <svg className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <Link href={`/admin/users/${m.receiver.id}`} className="truncate text-sm font-medium text-blue-600">
                    {displayUser(m.receiver)}
                  </Link>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[m.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {STATUS_LABEL[m.status] || m.status}
                </span>
              </div>
              {/* 하단 행: 점수 + 날짜 + 상태변경 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>점수 {Math.round(m.score)}</span>
                  <span>{new Date(m.createdAt).toLocaleDateString("ko-KR")}</span>
                </div>
                <select
                  value={m.status}
                  onChange={(e) => handleStatusChange(m.id, e.target.value)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
                >
                  <option value="PENDING">대기</option>
                  <option value="ACCEPTED">수락</option>
                  <option value="REJECTED">거절</option>
                  <option value="EXPIRED">만료</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">전체 {pagination.total.toLocaleString()}개</p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >이전</button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >다음</button>
          </div>
        </div>
      )}
    </div>
  );
}
