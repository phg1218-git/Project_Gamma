"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Heart, LogOut, UserCog } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="text-xl font-bold">설정</h1>

      <div className="card-romantic p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-pink flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">{session?.user?.name || "사용자"}</p>
            <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      <Link href="/profile/setup" className="card-romantic flex w-full items-center gap-3 p-4 hover:bg-pink-50/50 transition-colors">
        <UserCog size={20} className="text-primary" />
        <div>
          <p className="text-sm font-medium">프로필 설정으로 이동</p>
          <p className="text-xs text-muted-foreground">매칭 가능 여부/최소 점수를 포함한 프로필 항목을 편집합니다.</p>
        </div>
      </Link>

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
