/**
 * 이어줌 — Chat Types
 */

export interface ChatThreadData {
  id: string;
  matchId: string;
  partnerNickname: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isActive: boolean;
  status: "OPEN" | "CLOSED";
  closedAt: string | null;
}

export interface MessageData {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  isMine: boolean; // Computed on client: senderId === currentUserId
}
