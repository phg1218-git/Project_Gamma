"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalUsers: number;
  profileCompleteUsers: number;
  totalMatches: number;
  acceptedMatches: number;
  activeChats: number;
  totalMessages: number;
}

const statCards = [
  { key: "totalUsers" as const, label: "전체 회원", color: "bg-blue-50 text-blue-700" },
  { key: "profileCompleteUsers" as const, label: "프로필 완성", color: "bg-green-50 text-green-700" },
  { key: "totalMatches" as const, label: "전체 매칭", color: "bg-purple-50 text-purple-700" },
  { key: "acceptedMatches" as const, label: "수락된 매칭", color: "bg-pink-50 text-pink-700" },
  { key: "activeChats" as const, label: "활성 채팅", color: "bg-amber-50 text-amber-700" },
  { key: "totalMessages" as const, label: "전체 메시지", color: "bg-cyan-50 text-cyan-700" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      })
      .then(setStats)
      .catch(() => setError("통계를 불러올 수 없습니다."));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">대시보드</h1>

      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="rounded-lg border border-slate-200 bg-white p-5"
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {stats ? stats[card.key].toLocaleString() : "-"}
            </p>
            <span
              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${card.color}`}
            >
              {card.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
