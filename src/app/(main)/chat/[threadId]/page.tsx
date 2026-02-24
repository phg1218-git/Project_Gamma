"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Heart } from "lucide-react";

/**
 * Individual Chat Thread Page
 *
 * Polling-based real-time messaging.
 * Polls every 3 seconds for new messages.
 * Messages auto-scroll to bottom.
 */

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<string | null>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch messages (initial load or poll for new ones)
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
              // Deduplicate by ID
              const existingIds = new Set(prev.map((m) => m.id));
              const unique = newMessages.filter((m) => !existingIds.has(m.id));
              return [...prev, ...unique];
            });
          }
          // Update cursor to the latest message timestamp
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

  // Initial fetch + polling
  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    const content = input.trim();
    setInput("");

    try {
      const res = await fetch(`/api/chat/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        lastTimestampRef.current = msg.createdAt;
        scrollToBottom();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setInput(content); // Restore input on failure
    } finally {
      setSending(false);
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
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Chat Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-pink-100">
        <button
          onClick={() => router.push("/chat")}
          className="p-1 rounded-full hover:bg-pink-50 transition-colors"
        >
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <h2 className="font-semibold">채팅</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Heart className="mx-auto mb-2 text-pink-200" size={32} />
            <p className="text-sm text-muted-foreground">
              첫 메시지를 보내보세요!
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}
          >
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

      {/* Message Input */}
      <form onSubmit={handleSend} className="pt-3 border-t border-pink-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            maxLength={1000}
            className="flex-1 px-4 py-2.5 rounded-full border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-gradient-pink flex items-center justify-center disabled:opacity-50 transition-opacity"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}
