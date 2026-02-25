"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";

/**
 * Chat Thread List Page
 *
 * Shows all active chat threads.
 * Displays last message preview and unread count.
 */

interface ThreadData {
  id: string;
  matchId: string;
  partnerNickname: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isActive: boolean;
  status: "OPEN" | "CLOSED";
  closedAt: string | null;
}

export default function ChatListPage() {
  const [threads, setThreads] = useState<ThreadData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
      }
    } catch (error) {
      console.error("Failed to fetch threads:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
    // Poll for new threads every 10 seconds
    const interval = setInterval(fetchThreads, 10000);
    return () => clearInterval(interval);
  }, [fetchThreads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Heart className="heart-pulse" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-6">채팅</h1>

      {threads.length === 0 ? (
        <div className="card-romantic p-8 text-center">
          <MessageCircle className="mx-auto mb-3 text-pink-200" size={48} />
          <p className="text-sm text-muted-foreground">
            아직 채팅이 없습니다.
            <br />
            매칭에서 서로 수락하면 채팅이 시작됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/chat/${thread.id}`}
              className="card-romantic p-4 flex items-center gap-3 hover:bg-pink-50/50 transition-colors block"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-pink flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-white">
                  {thread.partnerNickname.charAt(0)}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm truncate">{thread.partnerNickname}</h3>
                  {thread.lastMessageAt && (
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatTime(thread.lastMessageAt)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {thread.status === "CLOSED" ? "종료된 채팅" : (thread.lastMessage || "대화를 시작해보세요!")}
                </p>
              </div>

              {/* Unread Badge */}
              {thread.status === "CLOSED" && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-muted-foreground shrink-0">
                  Closed
                </span>
              )}

              {thread.unreadCount > 0 && thread.status === "OPEN" && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-white">
                    {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
  return `${Math.floor(diffMin / 1440)}일 전`;
}
