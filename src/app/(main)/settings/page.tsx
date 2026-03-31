"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Heart, LogOut, PauseCircle, PlayCircle, UserX } from "lucide-react";

/**
 * Settings Page
 *
 * Account management:
 * - Toggle stopMatching
 * - Sign out
 */
export default function SettingsPage() {
  const { data: session } = useSession();
  const [stopMatching, setStopMatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawEmail, setWithdrawEmail] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  // Hydrate stopMatching from server on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setStopMatching(data.stopMatching ?? false);
        }
      } catch {
        // silently ignore — default false is safe
      }
    }
    loadProfile();
  }, []);

  async function handleWithdraw() {
    if (withdrawEmail !== session?.user?.email) {
      setWithdrawError("이메일 주소가 일치하지 않습니다.");
      return;
    }
    setWithdrawing(true);
    setWithdrawError("");
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) {
        setWithdrawError("탈퇴 처리 중 오류가 발생했습니다.");
        return;
      }
      await signOut({ callbackUrl: "/?withdrawn=1" });
    } catch {
      setWithdrawError("서버와 통신할 수 없습니다.");
    } finally {
      setWithdrawing(false);
    }
  }

  async function toggleStopMatching() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopMatching: !stopMatching }),
      });
      if (res.ok) {
        setStopMatching(!stopMatching);
      }
    } catch (error) {
      console.error("Failed to toggle matching:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="text-xl font-bold">설정</h1>

      {/* User Info */}
      <div className="card-romantic p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-pink flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">{session?.user?.name || "사용자"}</p>
            <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Matching Toggle */}
      <div className="card-romantic p-4">
        <button
          onClick={toggleStopMatching}
          disabled={saving}
          className="w-full flex items-center justify-between cursor-pointer disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            {stopMatching ? (
              <PauseCircle size={20} className="text-muted-foreground" />
            ) : (
              <PlayCircle size={20} className="text-primary" />
            )}
            <div className="text-left">
              <p className="text-sm font-medium">매칭 상태</p>
              <p className="text-xs text-muted-foreground">
                {stopMatching ? "매칭이 중단되었습니다" : "매칭이 활성화되어 있습니다"}
              </p>
            </div>
          </div>
          <div
            className={`w-12 h-6 rounded-full transition-colors ${
              stopMatching ? "bg-gray-300" : "bg-primary"
            } relative`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                stopMatching ? "left-0.5" : "left-6"
              }`}
            />
          </div>
        </button>
      </div>

      {/* Sign Out */}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="card-romantic p-4 w-full flex items-center gap-3 hover:bg-pink-50/50 transition-colors"
      >
        <LogOut size={20} className="text-destructive" />
        <span className="text-sm font-medium text-destructive">로그아웃</span>
      </button>

      {/* Withdraw */}
      {!showWithdraw ? (
        <button
          onClick={() => setShowWithdraw(true)}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-600 transition-colors text-sm"
        >
          <UserX size={16} />
          회원 탈퇴
        </button>
      ) : (
        <div className="card-romantic p-4 space-y-3 border border-red-100">
          <div className="flex items-center gap-2">
            <UserX size={18} className="text-destructive" />
            <p className="text-sm font-semibold text-destructive">회원 탈퇴</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            탈퇴 시 프로필 및 개인정보는 즉시 삭제됩니다.
            매칭 및 채팅 기록은 상대방 보호를 위해 익명으로 유지됩니다.
          </p>
          <p className="text-xs text-slate-600">
            가입한 이메일 주소를 입력하면 탈퇴가 진행됩니다.
          </p>
          <input
            type="email"
            value={withdrawEmail}
            onChange={(e) => {
              setWithdrawEmail(e.target.value);
              setWithdrawError("");
            }}
            placeholder={session?.user?.email ?? "이메일 주소"}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-red-300 focus:outline-none focus:ring-1 focus:ring-red-200"
          />
          {withdrawError && (
            <p className="text-xs text-destructive">{withdrawError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowWithdraw(false);
                setWithdrawEmail("");
                setWithdrawError("");
              }}
              className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || withdrawEmail !== session?.user?.email}
              className="flex-1 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {withdrawing ? "처리 중..." : "탈퇴 확인"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
