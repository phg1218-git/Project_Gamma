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

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  async function handleStatusChange(matchId: string, newStatus: string) {
    const res = await fetch(`/api/admin/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      fetchMatches();
    }
  }

  function displayUser(u: { id: string; name: string | null; email: string | null }) {
    return u.name || u.email || u.id.slice(0, 8);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">매칭 관리</h1>

      {/* Status filter */}
      <div className="mb-4 flex gap-2">
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

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
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
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  불러오는 중...
                </td>
              </tr>
            ) : matches.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  매칭이 없습니다.
                </td>
              </tr>
            ) : (
              matches.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${m.sender.id}`} className="text-blue-600 hover:text-blue-800">
                      {displayUser(m.sender)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${m.receiver.id}`} className="text-blue-600 hover:text-blue-800">
                      {displayUser(m.receiver)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{Math.round(m.score)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.status === "ACCEPTED" ? "bg-green-50 text-green-700" :
                      m.status === "REJECTED" ? "bg-red-50 text-red-700" :
                      m.status === "EXPIRED" ? "bg-slate-100 text-slate-600" :
                      "bg-yellow-50 text-yellow-700"
                    }`}>
                      {STATUS_LABEL[m.status] || m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(m.createdAt).toLocaleDateString("ko-KR")}
                  </td>
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            전체 {pagination.total.toLocaleString()}개
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              이전
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
