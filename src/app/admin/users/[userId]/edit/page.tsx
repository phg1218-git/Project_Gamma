"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminUserEditPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // User fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileComplete, setProfileComplete] = useState(false);

  // Profile fields
  const [nickname, setNickname] = useState("");
  const [stopMatching, setStopMatching] = useState(false);
  const [minMatchScore, setMinMatchScore] = useState(0);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((user) => {
        setName(user.name || "");
        setEmail(user.email || "");
        setProfileComplete(user.profileComplete);
        if (user.profile) {
          setHasProfile(true);
          setNickname(user.profile.nickname || "");
          setStopMatching(user.profile.stopMatching);
          setMinMatchScore(user.profile.minMatchScore);
        }
      })
      .catch(() => setError("사용자를 찾을 수 없습니다."))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      name,
      email,
      profileComplete,
      ...(hasProfile && {
        profile: {
          nickname,
          stopMatching,
          minMatchScore,
        },
      }),
    };

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push(`/admin/users/${userId}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "수정에 실패했습니다.");
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-400">불러오는 중...</p>;

  return (
    <div className="max-w-2xl">
      <Link href={`/admin/users/${userId}`} className="text-sm text-slate-500 hover:text-slate-700">
        &larr; 회원 상세
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-bold text-slate-900">회원 정보 수정</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User info */}
        <fieldset className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <legend className="text-sm font-semibold text-slate-700">기본 정보</legend>

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">이름</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">이메일</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="profileComplete"
              type="checkbox"
              checked={profileComplete}
              onChange={(e) => setProfileComplete(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="profileComplete" className="text-sm text-slate-700">프로필 완성됨</label>
          </div>
        </fieldset>

        {/* Profile info */}
        {hasProfile && (
          <fieldset className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
            <legend className="text-sm font-semibold text-slate-700">프로필 정보</legend>

            <div>
              <label htmlFor="nickname" className="mb-1 block text-sm font-medium text-slate-700">닉네임</label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="stopMatching"
                type="checkbox"
                checked={stopMatching}
                onChange={(e) => setStopMatching(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="stopMatching" className="text-sm text-slate-700">매칭 중단</label>
            </div>

            <div>
              <label htmlFor="minMatchScore" className="mb-1 block text-sm font-medium text-slate-700">
                최소 매칭 점수 ({minMatchScore})
              </label>
              <input
                id="minMatchScore"
                type="range"
                min={0}
                max={100}
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </fieldset>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          <Link
            href={`/admin/users/${userId}`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
