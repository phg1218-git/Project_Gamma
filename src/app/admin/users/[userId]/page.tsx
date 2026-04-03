"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Tab = "profile" | "survey" | "matches" | "chats";

interface UserDetail {
  id: string;
  name: string | null;
  email: string | null;
  profileComplete: boolean;
  createdAt: string;
  profile: Record<string, unknown> | null;
  surveyResponse: Record<string, unknown> | null;
  sentMatches: Record<string, unknown>[];
  receivedMatches: Record<string, unknown>[];
  chatThreadsA: Record<string, unknown>[];
  chatThreadsB: Record<string, unknown>[];
}

const GENDER_LABEL: Record<string, string> = { MALE: "남성", FEMALE: "여성" };
const MATCH_STATUS_LABEL: Record<string, string> = {
  PENDING: "대기", ACCEPTED: "수락", REJECTED: "거절", EXPIRED: "만료",
};

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleDelete() {
    if (!confirm("정말로 이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/users");
    } else {
      alert("삭제에 실패했습니다.");
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-slate-400">불러오는 중...</p>;
  }
  if (!user) {
    return <p className="text-red-600">사용자를 찾을 수 없습니다.</p>;
  }

  const allMatches = [
    ...user.sentMatches.map((m) => ({ ...m, direction: "sent", other: (m as Record<string, unknown>).receiver })),
    ...user.receivedMatches.map((m) => ({ ...m, direction: "received", other: (m as Record<string, unknown>).sender })),
  ].sort((a, b) => new Date((b as Record<string, unknown>).createdAt as string).getTime() - new Date((a as Record<string, unknown>).createdAt as string).getTime());

  const allChats = [
    ...user.chatThreadsA.map((t) => ({ ...t, other: (t as Record<string, unknown>).userB })),
    ...user.chatThreadsB.map((t) => ({ ...t, other: (t as Record<string, unknown>).userA })),
  ].sort((a, b) => new Date((b as Record<string, unknown>).createdAt as string).getTime() - new Date((a as Record<string, unknown>).createdAt as string).getTime());

  const tabs: { key: Tab; label: string }[] = [
    { key: "profile", label: "프로필" },
    { key: "survey", label: "설문" },
    { key: "matches", label: `매칭 (${allMatches.length})` },
    { key: "chats", label: `채팅 (${allChats.length})` },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 프로필 사진 */}
          {(user.profile as { profileImage?: string | null })?.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(user.profile as { profileImage: string }).profileImage}
              alt="프로필"
              className="h-16 w-16 rounded-full object-cover flex-shrink-0 border border-slate-200"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-slate-400">
                {((user.profile as { nickname?: string })?.nickname || user.name || "?").charAt(0)}
              </span>
            </div>
          )}
          <div>
            <Link href="/admin/users" className="text-sm text-slate-500 hover:text-slate-700">
              &larr; 회원 목록
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {(user.profile as { nickname?: string })?.nickname || user.name || "이름 없음"}
            </h1>
            <p className="text-sm text-slate-500">{user.email} / 가입: {new Date(user.createdAt).toLocaleDateString("ko-KR")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/users/${userId}/edit`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            수정
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-slate-900 text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        {tab === "profile" && <ProfileTab user={user} />}
        {tab === "survey" && <SurveyTab survey={user.surveyResponse} />}
        {tab === "matches" && <MatchesTab matches={allMatches} />}
        {tab === "chats" && <ChatsTab chats={allChats} />}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex border-b border-slate-100 py-2">
      <span className="w-32 flex-shrink-0 text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-900">{value || "-"}</span>
    </div>
  );
}

function ProfileTab({ user }: { user: UserDetail }) {
  const p = user.profile as Record<string, unknown>;
  const [lightbox, setLightbox] = useState(false);
  if (!p) return <p className="text-slate-400">프로필이 없습니다.</p>;

  return (
    <div>
      {/* 프로필 사진 라이트박스 */}
      {lightbox && !!p.profileImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightbox(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.profileImage as string}
            alt="프로필 사진 원본"
            className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl font-bold hover:opacity-70"
            onClick={() => setLightbox(false)}
          >
            ✕
          </button>
        </div>
      )}

      {/* 프로필 사진 */}
      <div className="mb-4 flex items-center gap-3 pb-4 border-b border-slate-100">
        {p.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.profileImage as string}
            alt="프로필 사진"
            className="h-20 w-20 rounded-full object-cover border border-slate-200 cursor-pointer hover:opacity-90"
            onClick={() => setLightbox(true)}
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-300">
              {(p.nickname as string)?.charAt(0) || "?"}
            </span>
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-slate-900">{p.nickname as string}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {p.profileImage ? "사진 클릭 시 원본 보기" : "등록된 프로필 사진 없음"}
          </p>
        </div>
      </div>
      <InfoRow label="닉네임" value={p.nickname as string} />
      <InfoRow label="성별" value={GENDER_LABEL[p.gender as string]} />
      <InfoRow label="생년월일" value={p.dateOfBirth ? new Date(p.dateOfBirth as string).toLocaleDateString("ko-KR") : null} />
      <InfoRow label="키" value={p.height ? `${p.height}cm` : null} />
      <InfoRow label="직업" value={`${p.jobCategory} / ${p.jobDetail}`} />
      <InfoRow label="직장 소재지" value={(p.companyLocation as string | undefined)?.replace("|", " ")} />
      <InfoRow label="거주지" value={(p.residenceLocation as string | undefined)?.replace("|", " ")} />
      <InfoRow label="출신지" value={(p.hometownLocation as string | undefined)?.replace("|", " ")} />
      <InfoRow label="MBTI" value={p.mbti as string} />
      <InfoRow label="혈액형" value={p.bloodType as string} />
      <InfoRow label="종교" value={p.religion as string} />
      <InfoRow label="음주" value={p.drinking as string} />
      <InfoRow label="흡연" value={p.smoking as string} />
      <InfoRow label="성격" value={p.personality as string} />
      <InfoRow label="취미" value={(p.hobbies as string[] | undefined)?.join(", ")} />
      <InfoRow label="매칭 중단" value={p.stopMatching ? "예" : "아니오"} />
      <InfoRow label="최소 매칭 점수" value={String(p.minMatchScore)} />
    </div>
  );
}

function SurveyTab({ survey }: { survey: Record<string, unknown> | null }) {
  if (!survey) return <p className="text-slate-400">설문 응답이 없습니다.</p>;

  const answers = survey.answers as Record<string, unknown>;
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-500">
        완료일: {new Date(survey.completedAt as string).toLocaleDateString("ko-KR")}
      </p>
      <div className="mt-2 max-h-96 overflow-auto rounded-md bg-slate-50 p-3">
        <pre className="text-xs text-slate-700">{JSON.stringify(answers, null, 2)}</pre>
      </div>
    </div>
  );
}

function MatchesTab({ matches }: { matches: Record<string, unknown>[] }) {
  if (matches.length === 0) return <p className="text-slate-400">매칭 내역이 없습니다.</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="px-3 py-2 font-medium text-slate-600">방향</th>
          <th className="px-3 py-2 font-medium text-slate-600">상대</th>
          <th className="px-3 py-2 font-medium text-slate-600">점수</th>
          <th className="px-3 py-2 font-medium text-slate-600">상태</th>
          <th className="px-3 py-2 font-medium text-slate-600">날짜</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {matches.map((m) => {
          const match = m as Record<string, unknown> & {
            id: string; direction: string; other: Record<string, unknown> & { id: string; name?: string; email?: string };
            score: number; status: string; createdAt: string;
          };
          return (
          <tr key={match.id}>
            <td className="px-3 py-2 text-slate-700">
              {match.direction === "sent" ? "보냄" : "받음"}
            </td>
            <td className="px-3 py-2">
              <Link href={`/admin/users/${match.other.id}`} className="text-blue-600 hover:text-blue-800">
                {match.other.name || match.other.email || match.other.id}
              </Link>
            </td>
            <td className="px-3 py-2 text-slate-700">{Math.round(match.score)}</td>
            <td className="px-3 py-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                match.status === "ACCEPTED" ? "bg-green-50 text-green-700" :
                match.status === "REJECTED" ? "bg-red-50 text-red-700" :
                match.status === "EXPIRED" ? "bg-slate-100 text-slate-600" :
                "bg-yellow-50 text-yellow-700"
              }`}>
                {MATCH_STATUS_LABEL[match.status] || match.status}
              </span>
            </td>
            <td className="px-3 py-2 text-slate-500">{new Date(match.createdAt).toLocaleDateString("ko-KR")}</td>
          </tr>
        )})}
      </tbody>
    </table>
  );
}

function ChatsTab({ chats }: { chats: Record<string, unknown>[] }) {
  if (chats.length === 0) return <p className="text-slate-400">채팅 내역이 없습니다.</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="px-3 py-2 font-medium text-slate-600">상대</th>
          <th className="px-3 py-2 font-medium text-slate-600">메시지 수</th>
          <th className="px-3 py-2 font-medium text-slate-600">상태</th>
          <th className="px-3 py-2 font-medium text-slate-600">시작일</th>
          <th className="px-3 py-2 font-medium text-slate-600">조회</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {chats.map((t) => {
          const chat = t as Record<string, unknown> & {
            id: string; other: Record<string, unknown> & { id: string; name?: string; email?: string };
            _count?: { messages: number }; isActive: boolean; createdAt: string;
          };
          return (
          <tr key={chat.id}>
            <td className="px-3 py-2">
              <Link href={`/admin/users/${chat.other.id}`} className="text-blue-600 hover:text-blue-800">
                {chat.other.name || chat.other.email || chat.other.id}
              </Link>
            </td>
            <td className="px-3 py-2 text-slate-700">{chat._count?.messages || 0}</td>
            <td className="px-3 py-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                chat.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
              }`}>
                {chat.isActive ? "활성" : "종료"}
              </span>
            </td>
            <td className="px-3 py-2 text-slate-500">{new Date(chat.createdAt).toLocaleDateString("ko-KR")}</td>
            <td className="px-3 py-2">
              <Link href={`/admin/chats/${chat.id}`} className="text-blue-600 hover:text-blue-800">
                보기
              </Link>
            </td>
          </tr>
        )})}
      </tbody>
    </table>
  );
}
