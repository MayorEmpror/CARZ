// ============================================================================
// types.ts — shared types for the Chats feature
// ============================================================================

export type StatusIcon = "typing" | "voice" | "sent" | "attachment" | "location" | null;

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  time: string;
  lastMessage: string;
  unreadCount?: number;
  status?: StatusIcon;
  active?: boolean;
}

export interface Reaction {
  emoji: string;
  count: number;
}

export interface BaseMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  time: string;
  isOwn: boolean;
  reactions?: Reaction[];
}

export interface TextMessage extends BaseMessage {
  type: "text";
  text: string;
}

export interface LinkShareMessage extends BaseMessage {
  type: "link-share";
  url: string;
  siteName: string;
  title: string;
  description: string;
  images: string[];
}

export type Message = TextMessage | LinkShareMessage;

export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export type ConversationFilter = "all" | "group" | "pinned" | "archived";
export type MediaTab = "media" | "document" | "links";