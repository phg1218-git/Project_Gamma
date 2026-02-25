"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Heart, LogOut, PauseCircle, PlayCircle } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [stopMatching, setStopMatching] = useState(false);
  const [minMatchScore, setMinMatchScore] = useState(50);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setStopMatching(Boolean(data.stopMatching));
        setMinMatchScore(typeof data.minMatchScore === "number" ? data.minMatchScore : 50);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function updateProfile(payload: { stopMatching?: boolean; minMatchScore?: number }) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "설정을 저장하지 못했습니다.");
        return;
      }

      if (typeof data.stopMatching === "boolean") {
        setStopMatching(data.stopMatching);
      }
      if (typeof data.minMatchScore === "number") {
        setMinMatchScore(data.minMatchScore);
      }
      setMessage("설정이 저장되었습니다.");
    } catch (error) {
      console.error("Failed to update profile:", error);
      setMessage("설정을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStopMatching() {
    await updateProfile({ stopMatching: !stopMatching });
  }

  async function saveMinScore() {
    const clamped = Math.max(0, Math.min(100, Math.trunc(minMatchScore)));
    setMinMatchScore(clamped);
    await updateProfile({ minMatchScore: clamped });
  }

  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="text-xl font-bold">설정</h1>

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

      <div className="card-romantic p-4">
        <button
          onClick={toggleStopMatching}
          disabled={saving}
          className="w-full flex items-center justify-between"
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

      <div className="card-romantic p-4 space-y-3">
        <div>
          <p className="text-sm font-medium">최소 매칭 점수</p>
          <p className="text-xs text-muted-foreground">0~100 사이의 값 · 최소 50 이상 권장</p>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            max={100}
            value={minMatchScore}
            onChange={(e) => setMinMatchScore(Number(e.target.value))}
            className="flex-1 px-3 py-2 rounded-xl border border-pink-200 text-sm"
          />
          <button
            onClick={saveMinScore}
            disabled={saving}
            className="btn-gradient text-sm px-4 disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>

      {message && (
        <div className="card-romantic p-3 text-sm text-center text-muted-foreground">{message}</div>
      )}

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="card-romantic p-4 w-full flex items-center gap-3 hover:bg-pink-50/50 transition-colors"
      >
        <LogOut size={20} className="text-destructive" />
        <span className="text-sm font-medium text-destructive">로그아웃</span>
      </button>
    </div>
  );
}
