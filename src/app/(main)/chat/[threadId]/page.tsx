"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Heart } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
}

export default function ChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatStatus, setChatStatus] = useState<"OPEN" | "CLOSED">("OPEN");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchThreadMeta = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/${threadId}`);
      if (!res.ok) return;
      const data = await res.json();
      setChatStatus(data.status);
    } catch (e) {
      console.error("Failed to fetch thread status", e);
    }
  }, [threadId]);

  const fetchMessages = useCallback(async (isInitial: boolean = false) => {
    try {
      const params = new URLSearchParams();
      if (!isInitial && lastTimestampRef.current) {
        params.set("after", lastTimestampRef.current);
      }

      const res = await fetch(`/api/chat/${threadId}/messages?${params}`);
      if (res.ok) {
        const data = await res.json();
        const newMessages = data.messages as Message[];

        if (newMessages.length > 0) {
          if (isInitial) {
            setMessages(newMessages);
          } else {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const unique = newMessages.filter((m) => !existingIds.has(m.id));
              return [...prev, ...unique];
            });
          }
          lastTimestampRef.current = newMessages[newMessages.length - 1].createdAt;
          scrollToBottom();
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [threadId, scrollToBottom]);

  useEffect(() => {
    fetchThreadMeta();
    fetchMessages(true);
    const interval = setInterval(() => {
      fetchThreadMeta();
      fetchMessages(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages, fetchThreadMeta]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending || chatStatus === "CLOSED") return;

    setSending(true);
    setError(null);
    const content = input.trim();
    setInput("");

    try {
      const res = await fetch(`/api/chat/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "CHAT_CLOSED") {
          setChatStatus("CLOSED");
        }
        setError(data.error || "메시지 전송에 실패했습니다.");
        setInput(content);
        return;
      }

      setMessages((prev) => [...prev, data]);
      lastTimestampRef.current = data.createdAt;
      scrollToBottom();
    } catch (error) {
      console.error("Failed to send message:", error);
      setInput(content);
      setError("메시지 전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  }

  async function handleEndChat() {
    try {
      const res = await fetch(`/api/chat/${threadId}`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "채팅 종료에 실패했습니다.");
        return;
      }
      setChatStatus("CLOSED");
      setShowEndConfirm(false);
    } catch (error) {
      console.error("Failed to end chat", error);
      setError("채팅 종료에 실패했습니다.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Heart className="heart-pulse" size={32} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-12.5rem)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-pink-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/chat")}
            className="p-1 rounded-full hover:bg-pink-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h2 className="font-semibold">채팅</h2>
        </div>
        <button
          onClick={() => setShowEndConfirm(true)}
          disabled={chatStatus === "CLOSED"}
          className="text-xs px-3 py-1.5 rounded-full border border-pink-200 disabled:opacity-50"
        >
          채팅 종료
        </button>
      </div>

      {chatStatus === "CLOSED" && (
        <div className="mt-2 px-3 py-2 rounded-lg bg-gray-100 text-xs text-muted-foreground">
          이 채팅은 종료되었습니다. 더 이상 메시지를 보낼 수 없습니다.
        </div>
      )}
      {error && <div className="mt-2 text-xs text-destructive">{error}</div>}

      <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Heart className="mx-auto mb-2 text-pink-200" size={32} />
            <p className="text-sm text-muted-foreground">첫 메시지를 보내보세요!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] ${msg.isMine ? "chat-bubble-mine" : "chat-bubble-theirs"}`}>
              <p className="text-sm break-words">{msg.content}</p>
              <p className={`text-[10px] mt-1 ${msg.isMine ? "text-white/70" : "text-muted-foreground"}`}>
                {formatMessageTime(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="pt-3 border-t border-pink-100 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sticky bottom-0 bg-background"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={chatStatus === "CLOSED" ? "종료된 채팅입니다" : "메시지를 입력하세요..."}
            maxLength={1000}
            disabled={chatStatus === "CLOSED"}
            className="flex-1 px-4 py-2.5 rounded-full border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending || chatStatus === "CLOSED"}
            className="w-10 h-10 rounded-full bg-gradient-pink flex items-center justify-center disabled:opacity-50 transition-opacity"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </form>

      {showEndConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="card-romantic w-full max-w-sm p-4 space-y-3">
            <h3 className="font-semibold">채팅을 종료할까요?</h3>
            <p className="text-sm text-muted-foreground">종료 후에는 메시지를 보낼 수 없습니다.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-pink-200 text-sm"
              >
                취소
              </button>
              <button onClick={handleEndChat} className="flex-1 py-2 rounded-xl bg-primary text-white text-sm">
                종료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}
