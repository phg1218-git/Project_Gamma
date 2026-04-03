"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Heart, ImageOff, Eye, PhoneOff } from "lucide-react";

/**
 * Individual Chat Thread Page
 *
 * Polling-based real-time messaging.
 * Polls every 3 seconds for new messages.
 * Messages auto-scroll to bottom.
 * Photo reveal: both users must consent to see each other's profile photo.
 */

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
}

interface PhotoRevealState {
  myReveal: boolean;
  partnerReveal: boolean;
  partnerPhoto: string | null;
}

export default function ChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;

  // 하단 네비게이션 숨기기 위한 스타일 오버라이드
  useEffect(() => {
    // 부모 요소의 padding-bottom 제거
    const mainElement = document.querySelector("main");
    const rootDiv = mainElement?.parentElement;
    if (rootDiv) {
      rootDiv.style.paddingBottom = "0";
    }

    return () => {
      // 컴포넌트 언마운트 시 원래대로 복구
      if (rootDiv) {
        rootDiv.style.paddingBottom = "";
      }
    };
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerNickname, setPartnerNickname] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [photoReveal, setPhotoReveal] = useState<PhotoRevealState>({
    myReveal: false,
    partnerReveal: false,
    partnerPhoto: null,
  });
  const [revealLoading, setRevealLoading] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // 입력창 포커스 시 스크롤 조정 (모바일 키보드 대응)
  const handleInputFocus = useCallback(() => {
    // 약간의 딜레이를 두고 스크롤 (키보드 애니메이션 대기)
    setTimeout(() => {
      scrollToBottom();
    }, 300);
  }, [scrollToBottom]);

  // messages가 변경될 때마다 자동으로 맨 아래로 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch messages (initial load or poll for new ones)
  const fetchMessages = useCallback(async (isInitial: boolean = false) => {
    try {
      const urlParams = new URLSearchParams();
      if (!isInitial && lastTimestampRef.current) {
        urlParams.set("after", lastTimestampRef.current);
      }

      const res = await fetch(`/api/chat/${threadId}/messages?${urlParams}`);
      if (res.ok) {
        const data = await res.json();
        const newMessages = data.messages as Message[];

        if (typeof data.isActive === "boolean") {
          setIsActive(data.isActive);
        }
        if (data.partnerNickname) {
          setPartnerNickname(data.partnerNickname);
        }
        // photoReveal 상태 갱신 (별도 폴링 대체)
        if (data.photoReveal) {
          setPhotoReveal(data.photoReveal);
        }
        // 읽음 처리된 내 메시지 readAt 갱신
        if (data.readReceipts?.length > 0) {
          const receiptMap = new Map<string, string>(
            (data.readReceipts as { id: string; readAt: string }[]).map((r) => [r.id, r.readAt]),
          );
          setMessages((prev) =>
            prev.map((m) =>
              m.isMine && !m.readAt && receiptMap.has(m.id)
                ? { ...m, readAt: receiptMap.get(m.id)! }
                : m,
            ),
          );
        }
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
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [threadId]);

  // Initial fetch + polling (탭 활성: 5초, 탭 숨김: 30초)
  useEffect(() => {
    fetchMessages(true);

    let interval: ReturnType<typeof setInterval>;

    function startPolling() {
      clearInterval(interval);
      const ms = document.visibilityState === "visible" ? 5000 : 30000;
      interval = setInterval(() => fetchMessages(false), ms);
    }

    startPolling();
    document.addEventListener("visibilitychange", startPolling);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", startPolling);
    };
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
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setInput(content);
    } finally {
      setSending(false);
    }
  }

  async function handleCloseChat() {
    setClosing(true);
    try {
      const res = await fetch(`/api/chat/${threadId}`, { method: "PATCH" });
      if (res.ok) {
        setIsActive(false);
        setShowCloseConfirm(false);
        router.push("/chat");
      }
    } catch (error) {
      console.error("Failed to close chat:", error);
    } finally {
      setClosing(false);
    }
  }

  async function handlePhotoReveal() {
    setRevealLoading(true);
    try {
      const res = await fetch(`/api/chat/${threadId}/reveal`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPhotoReveal(data);
      }
    } catch (error) {
      console.error("Failed to toggle photo reveal:", error);
    } finally {
      setRevealLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Heart className="heart-pulse" size={32} />
      </div>
    );
  }

  const bothRevealed = photoReveal.myReveal && photoReveal.partnerReveal;

  return (
    <div className="flex flex-col fixed top-14 bottom-0 inset-x-0 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg sm:bottom-16">
      {/* Chat Header */}
      <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 pb-3 px-4 border-b border-pink-100 bg-white">
        <button
          onClick={() => router.push("/chat")}
          className="p-2 rounded-full hover:bg-pink-50 active:bg-pink-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>

        {/* Partner photo or avatar */}
        {bothRevealed && photoReveal.partnerPhoto ? (
          <button
            type="button"
            onClick={() => setZoomImage(photoReveal.partnerPhoto!)}
            className="flex-shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoReveal.partnerPhoto}
              alt="상대방"
              className="w-9 h-9 rounded-full object-cover hover:opacity-90 transition-opacity"
            />
          </button>
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-pink flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">
              {partnerNickname.charAt(0) || "?"}
            </span>
          </div>
        )}

        <h2 className="font-semibold flex-1">{partnerNickname || "채팅"}</h2>

        {/* Photo reveal button (활성 채팅만) */}
        {isActive && (
          <button
            onClick={handlePhotoReveal}
            disabled={revealLoading}
            title={photoReveal.myReveal ? "사진 공개 취소" : "사진 공개하기"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
              photoReveal.myReveal
                ? "bg-primary text-white"
                : "bg-pink-50 text-primary hover:bg-pink-100"
            }`}
          >
            {bothRevealed ? (
              <Eye size={13} />
            ) : (
              <ImageOff size={13} />
            )}
            {photoReveal.myReveal
              ? bothRevealed
                ? "사진 공개 중"
                : "공개 대기 중"
              : "사진 공개"}
          </button>
        )}

        {/* 채팅 종료 버튼 (활성 채팅만) */}
        {isActive && (
          <button
            onClick={() => setShowCloseConfirm(true)}
            title="채팅 종료"
            className="p-1.5 rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-400 transition-colors"
          >
            <PhoneOff size={16} />
          </button>
        )}
      </div>

      {/* 채팅 종료됨 배너 */}
      {!isActive && (
        <div className="py-2 px-3 bg-gray-50 border-b border-gray-200 text-center">
          <p className="text-xs text-muted-foreground">
            이 채팅은 종료되었습니다. 메시지를 보낼 수 없으며 30일 후 자동 삭제됩니다.
          </p>
        </div>
      )}

      {/* Photo reveal status banner */}
      {isActive && photoReveal.myReveal && !bothRevealed && (
        <div className="py-2 px-3 bg-pink-50 border-b border-pink-100 text-center">
          <p className="text-xs text-primary">
            사진 공개를 요청했습니다. 상대방도 동의하면 서로의 사진을 볼 수 있어요.
          </p>
        </div>
      )}
      {isActive && bothRevealed && (
        <div className="py-2 px-3 bg-green-50 border-b border-green-100 text-center">
          <p className="text-xs text-green-600">
            서로 사진을 공개했습니다! 상대방 사진을 확인해보세요.
          </p>
        </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full py-4 px-4">
          {/* 메시지가 적을 때 아래에서부터 쌓이도록 빈 공간 확보 */}
          <div className="flex-1" />
          <div className="space-y-3">
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
            className={`flex ${msg.isMine ? "justify-end" : "justify-start"} items-end gap-2`}
          >
            {/* 상대방 메시지 왼쪽에 사진 */}
            {!msg.isMine && (
              <div className="flex-shrink-0 w-7 h-7">
                {bothRevealed && photoReveal.partnerPhoto ? (
                  <button
                    type="button"
                    onClick={() => setZoomImage(photoReveal.partnerPhoto!)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoReveal.partnerPhoto}
                      alt="상대방"
                      className="w-7 h-7 rounded-full object-cover hover:opacity-90 transition-opacity"
                    />
                  </button>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center">
                    <Heart size={10} className="text-primary" />
                  </div>
                )}
              </div>
            )}

            {/* 안읽음 표시 — 내 메시지 버블 왼쪽에 작게 표시 */}
            {msg.isMine && !msg.readAt && (
              <span className="text-[10px] text-pink-400 self-end mb-1 shrink-0">1</span>
            )}

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
        </div>
      </div>

      {/* Message Input */}
      {isActive ? (
        <form onSubmit={handleSend} className="flex-shrink-0 pt-3 px-4 pb-safe border-t border-pink-100 bg-white">
          <div className="flex gap-2 pb-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="메시지를 입력하세요..."
              maxLength={1000}
              className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-full border border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-base"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-8 h-8 sm:w-11 sm:h-11 flex-shrink-0 rounded-full bg-gradient-pink flex items-center justify-center disabled:opacity-50 active:brightness-95 transition-all"
            >
              <Send size={15} className="text-white sm:hidden" />
              <Send size={18} className="text-white hidden sm:block" />
            </button>
          </div>
        </form>
      ) : (
        <div className="flex-shrink-0 pt-3 px-4 pb-safe border-t border-gray-100 text-center bg-white">
          <p className="text-xs sm:text-sm text-muted-foreground py-2">채팅이 종료되어 메시지를 보낼 수 없습니다.</p>
        </div>
      )}

      {/* 채팅 종료 확인 다이얼로그 */}
      {showCloseConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          onClick={() => setShowCloseConfirm(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg sm:text-base mb-2">채팅을 종료하시겠어요?</h3>
            <p className="text-sm text-muted-foreground mb-6 sm:mb-5 leading-relaxed">
              채팅을 종료하면 더 이상 메시지를 보낼 수 없습니다.
              대화 내역은 30일 동안 보관된 후 자동으로 삭제됩니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 py-3 sm:py-2.5 rounded-xl border border-pink-200 text-sm font-medium text-muted-foreground hover:bg-pink-50 active:bg-pink-100 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCloseChat}
                disabled={closing}
                className="flex-1 py-3 sm:py-2.5 rounded-xl bg-red-400 text-sm font-medium text-white hover:bg-red-500 active:bg-red-600 transition-colors disabled:opacity-50"
              >
                {closing ? "종료 중..." : "채팅 종료"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomImage}
            alt="프로필 사진"
            className="max-w-full max-h-full rounded-2xl object-contain touch-manipulation"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}
