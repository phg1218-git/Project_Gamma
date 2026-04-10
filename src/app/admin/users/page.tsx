"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  profileComplete: boolean;
  createdAt: string;
  profile: {
    nickname: string;
    gender: string;
    stopMatching: boolean;
    profileImage: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function StatusBadge({ user }: { user: UserRow }) {
  if (!user.profileComplete)
    return <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">미완성</span>;
  if (user.profile?.stopMatching)
    return <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">매칭중단</span>;
  return <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">활성</span>;
}

function Avatar({ user }: { user: UserRow }) {
  if (user.profile?.profileImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.profile.profileImage} alt={user.profile.nickname} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-medium text-slate-500">{user.profile?.nickname?.charAt(0) || "?"}</span>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-900 md:mb-6 md:text-2xl">회원 관리</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 이메일, 닉네임 검색..."
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          검색
        </button>
      </form>

      {/* ── Desktop table ── */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">닉네임</th>
              <th className="px-4 py-3 font-medium text-slate-600">이름</th>
              <th className="px-4 py-3 font-medium text-slate-600">이메일</th>
              <th className="px-4 py-3 font-medium text-slate-600">성별</th>
              <th className="px-4 py-3 font-medium text-slate-600">상태</th>
              <th className="px-4 py-3 font-medium text-slate-600">가입일</th>
              <th className="px-4 py-3 font-medium text-slate-600">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">불러오는 중...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">회원이 없습니다.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar user={user} />
                      <span className="font-medium text-slate-900">{user.profile?.nickname || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{user.name || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{user.email || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {user.profile?.gender === "MALE" ? "남" : user.profile?.gender === "FEMALE" ? "여" : "-"}
                  </td>
                  <td className="px-4 py-3"><StatusBadge user={user} /></td>
                  <td className="px-4 py-3 text-slate-500">{new Date(user.createdAt).toLocaleDateString("ko-KR")}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${user.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">상세</Link>
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
        ) : users.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">회원이 없습니다.</div>
        ) : (
          users.map((user) => (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50 active:bg-slate-100"
            >
              <Avatar user={user} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 truncate">{user.profile?.nickname || "-"}</span>
                  <span className="text-xs text-slate-400">{user.profile?.gender === "MALE" ? "남" : user.profile?.gender === "FEMALE" ? "여" : ""}</span>
                  <StatusBadge user={user} />
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user.email || user.name || "-"}</p>
              </div>
              <svg className="h-4 w-4 flex-shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            전체 {pagination.total.toLocaleString()}명 중 {((pagination.page - 1) * pagination.limit + 1)}-{Math.min(pagination.page * pagination.limit, pagination.total)}명
          </p>
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
