"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Heart, LogOut, PauseCircle, PlayCircle } from "lucide-react";

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

      {/* Sign Out */}
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
