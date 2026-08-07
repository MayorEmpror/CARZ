"use client";

// ============================================================================
// Chats.tsx
// Three-panel messaging UI: conversation list (left) · message thread (center)
// · group info panel (right). All data below is MOCKED — swap the marked
// sections out for real fetches / a socket connection / server actions.
// ============================================================================

import { useState } from "react";
import {
  Search,
  SquarePen,
  Video,
  Phone,
  MoreVertical,
  Bell,
  Folder,
  Link2,
  ThumbsUp,
  ThumbsDown,
  PartyPopper,
  Heart,
  Smile,
  Frown,
  Plus,
  Reply,
  Pencil,
  Pin,
  Copy,
  Settings,
  Forward,
  Trash2,
  Mic,
  Image as ImageIcon,
  Send,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Paperclip,
  CheckCheck,
} from "lucide-react";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type StatusIcon = "typing" | "voice" | "sent" | "attachment" | "location" | null;

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  time: string;
  lastMessage: string;
  unreadCount?: number;
  status?: StatusIcon;
  active?: boolean;
}

interface Reaction {
  emoji: string;
  count: number;
}

interface BaseMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  time: string;
  isOwn: boolean;
  reactions?: Reaction[];
}

interface TextMessage extends BaseMessage {
  type: "text";
  text: string;
}

interface LinkShareMessage extends BaseMessage {
  type: "link-share";
  url: string;
  siteName: string;
  title: string;
  description: string;
  images: string[];
}

type Message = TextMessage | LinkShareMessage;

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

// ----------------------------------------------------------------------------
// Mock data — replace with real API/DB calls
// ----------------------------------------------------------------------------

// TODO(backend): fetch from GET /api/conversations
const CONVERSATIONS: Conversation[] = [
  { id: "c1", name: "Adam Patric", avatar: "https://i.pravatar.cc/80?img=12", time: "16:25", lastMessage: "Typing", status: "typing", unreadCount: 2 },
  { id: "c2", name: "Andrey Valeri", avatar: "https://i.pravatar.cc/80?img=13", time: "15:30", lastMessage: "Voice message (0:35)", status: "voice" },
  { id: "c3", name: "Ux and Ui team", avatar: "https://i.pravatar.cc/80?img=14", time: "14:50", lastMessage: "Recording a voice mes...", status: "voice", active: true },
  { id: "c4", name: "Ralp Devidson", avatar: "https://i.pravatar.cc/80?img=15", time: "13:10", lastMessage: "Typing", status: "typing", unreadCount: 3 },
  { id: "c5", name: "Brain Volunter", avatar: "https://i.pravatar.cc/80?img=16", time: "11:35", lastMessage: "You:Coooollll 💪 🙌 🔥", status: "sent" },
  { id: "c6", name: "Developer group", avatar: "https://i.pravatar.cc/80?img=17", time: "10:30", lastMessage: "Recording a voice mes...", status: "voice" },
  { id: "c7", name: "Friendly", avatar: "https://i.pravatar.cc/80?img=18", time: "09:25", lastMessage: "The deadline is ....", status: "attachment" },
  { id: "c8", name: "James Brother", avatar: "https://i.pravatar.cc/80?img=19", time: "08:45", lastMessage: "You:Where are you? 🔥", status: "sent" },
  { id: "c9", name: "Relatives", avatar: "https://i.pravatar.cc/80?img=20", time: "07:25", lastMessage: "The deadline is ....", status: "location" },
  { id: "c10", name: "Murad", avatar: "https://i.pravatar.cc/80?img=21", time: "02:10", lastMessage: "You: What is the pro...", status: "sent" },
];

// TODO(backend): fetch from GET /api/stories
const STORIES = [
  { id: "s1", name: "James", avatar: "https://i.pravatar.cc/80?img=32" },
  { id: "s2", name: "Brain", avatar: "https://i.pravatar.cc/80?img=33" },
  { id: "s3", name: "Antony", avatar: "https://i.pravatar.cc/80?img=34" },
  { id: "s4", name: "Ad", avatar: "https://i.pravatar.cc/80?img=35" },
];

// TODO(backend): fetch from GET /api/conversations/:id/messages
const MESSAGES: Message[] = [
  {
    id: "m1",
    type: "text",
    senderName: "Ralph Edwards",
    senderAvatar: "https://i.pravatar.cc/80?img=51",
    time: "21 min ago",
    isOwn: false,
    text: "Hey, fellas! I think we can share part of our Design system with Dribble community. What do you think?",
    reactions: [
      { emoji: "👍", count: 3 },
      { emoji: "❤️", count: 5 },
      { emoji: "🔥", count: 1 },
    ],
  },
  {
    id: "m2",
    type: "text",
    senderName: "Jenny Wilson",
    senderAvatar: "https://i.pravatar.cc/80?img=52",
    time: "15 min ago",
    isOwn: true,
    text: "Hi! I think this is brilliant idea 😍 Do you have any specific components you want to share?",
    reactions: [
      { emoji: "👍", count: 4 },
      { emoji: "❤️", count: 5 },
      { emoji: "🔥", count: 2 },
    ],
  },
  {
    id: "m3",
    type: "link-share",
    senderName: "Elvin Arifov",
    senderAvatar: "https://i.pravatar.cc/80?img=53",
    time: "10 min ago",
    isOwn: false,
    url: "https://dribble.com/shots/travel/145842",
    siteName: "Dribble",
    title: "Travel app ui/ux design",
    description:
      "Hello, this is a complete ui/ux design of a mobile travel app. This design was done in figma, and all illustrations are designed from either figma or Adobe Illustrator...",
    images: [
      "https://picsum.photos/seed/travel1/200/300",
      "https://picsum.photos/seed/travel2/200/300",
      "https://picsum.photos/seed/travel3/200/300",
    ],
    reactions: [
      { emoji: "👍", count: 7 },
      { emoji: "❤️", count: 8 },
      { emoji: "🔥", count: 4 },
    ],
  },
];

// TODO(backend): fetch from GET /api/conversations/:id
const GROUP_INFO = {
  name: "Ux and Ui team",
  avatar: "https://i.pravatar.cc/80?img=14",
  memberCount: 26,
  description:
    "A UX team is a group of professionals who aim to make a product's user experience as rewarding and delightful as it can be.",
  filesCount: 350,
  linksCount: 140,
};

// TODO(backend): fetch from GET /api/conversations/:id/members
const MEMBERS: Member[] = [
  { id: "u1", name: "Jenny", avatar: "https://i.pravatar.cc/80?img=52", role: "Admin" },
  { id: "u2", name: "Adillu", avatar: "https://i.pravatar.cc/80?img=54", role: "Ux/Ui" },
  { id: "u3", name: "Barcley", avatar: "https://i.pravatar.cc/80?img=55", role: "3d designer" },
];

// TODO(backend): fetch from GET /api/conversations/:id/media
const MEDIA_IMAGES = [
  "https://picsum.photos/seed/media1/200/200",
  "https://picsum.photos/seed/media2/200/200",
  "https://picsum.photos/seed/media3/200/200",
  "https://picsum.photos/seed/media4/200/200",
  "https://picsum.photos/seed/media5/200/200",
];
const MEDIA_TOTAL_COUNT = 156; // used to render the "+150" overflow tile

const REACTION_EMOJIS = [
  { icon: ThumbsUp, value: "👍" },
  { icon: ThumbsDown, value: "👎" },
  { icon: PartyPopper, value: "🙌" },
  { icon: Heart, value: "❤️" },
  { icon: Smile, value: "😍" },
  { icon: Frown, value: "😢" },
];

const CONTEXT_MENU_ACTIONS = [
  { key: "reply", label: "Reply", icon: Reply },
  { key: "edit", label: "Edit", icon: Pencil },
  { key: "pin", label: "Pin", icon: Pin },
  { key: "copy", label: "Copy", icon: Copy },
  { key: "setting", label: "Setting", icon: Settings },
  { key: "forward", label: "Forward", icon: Forward },
  { key: "delete", label: "Delete", icon: Trash2, danger: true },
];

// ----------------------------------------------------------------------------
// Small presentational helpers
// ----------------------------------------------------------------------------

function ReactionPills({ reactions }: { reactions?: Reaction[] }) {
  if (!reactions || reactions.length === 0) return null;
  return (
    <div className="flex gap-2 mt-2">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => {
            // TODO(backend): POST /api/messages/:id/reactions/toggle
            console.log("[Chats] toggle reaction", r.emoji);
          }}
          className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-full px-2.5 py-1 text-xs text-zinc-200"
        >
          <span>{r.emoji}</span>
          <span className="text-zinc-400">{r.count}</span>
        </button>
      ))}
    </div>
  );
}

function StatusIndicator({ status }: { status?: StatusIcon }) {
  switch (status) {
    case "typing":
      return <span className="text-blue-400 text-xs truncate">Typing</span>;
    case "voice":
      return (
        <span className="flex items-center gap-1 text-zinc-500 text-xs truncate">
          <Mic className="w-3 h-3" /> Voice message (0:35)
        </span>
      );
    case "sent":
      return <CheckCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    case "attachment":
      return <Paperclip className="w-3.5 h-3.5 text-zinc-500 shrink-0" />;
    case "location":
      return <span className="w-3.5 h-3.5 rounded-full bg-pink-500 shrink-0" />;
    default:
      return null;
  }
}

// ----------------------------------------------------------------------------
// Left panel: stories + search + conversation list
// ----------------------------------------------------------------------------

function ConversationsSidebar({
  activeId,
  onSelect,
  filter,
  onFilterChange,
  searchValue,
  onSearchChange,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  filter: "all" | "group" | "pinned" | "archived";
  onFilterChange: (f: "all" | "group" | "pinned" | "archived") => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
}) {
  const filteredConversations = CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="w-80 shrink-0 h-full flex flex-col bg-black border-r border-zinc-800">
      {/* Search */}
      <div className="p-4">
        <div className="flex items-center gap-2 bg-zinc-900 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="bg-transparent outline-none text-sm text-white placeholder:text-zinc-500 w-full"
          />
        </div>
      </div>

      {/* Stories row */}
      <div className="flex items-center gap-4 px-4 pb-4 overflow-x-auto">
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <button
            onClick={() => console.log("[Chats] open create-story flow")}
            className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
          <span className="text-[11px] text-zinc-500">My Story</span>
        </div>
        {STORIES.map((s) => (
          <button
            key={s.id}
            onClick={() => console.log("[Chats] view story", s.name)}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <img
              src={s.avatar}
              alt={s.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500 ring-offset-2 ring-offset-black"
            />
            <span className="text-[11px] text-zinc-400">{s.name}</span>
          </button>
        ))}
      </div>

      {/* Header + compose */}
      <div className="flex items-center justify-between px-4 pb-3">
        <h1 className="text-white text-2xl font-semibold">Messages</h1>
        <button
          onClick={() => console.log("[Chats] open new-message composer")}
          className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <SquarePen className="w-4 h-4" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 px-4 pb-4 text-sm">
        {(
          [
            { key: "all", label: "All messages" },
            { key: "group", label: "Group" },
            { key: "pinned", label: "Pinned" },
            { key: "archived", label: "Archived" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              filter === tab.key
                ? "bg-blue-500 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="px-4 pb-2 text-xs font-semibold tracking-wide text-zinc-600 uppercase">
        Personal
      </p>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((c) => {
          const isActive = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => {
                // TODO(backend): load thread — GET /api/conversations/:id/messages
                console.log("[Chats] select conversation", c.id, c.name);
                onSelect(c.id);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive ? "bg-zinc-900" : "hover:bg-zinc-950"
              }`}
            >
              <img
                src={c.avatar}
                alt={c.name}
                className="w-11 h-11 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white text-sm font-medium truncate">{c.name}</p>
                  <span className="text-xs text-zinc-500 shrink-0">{c.time}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <StatusIndicator status={c.status} />
                  {!["typing", "voice"].includes(c.status ?? "") && (
                    <span className="text-xs text-zinc-500 truncate">{c.lastMessage}</span>
                  )}
                  {c.unreadCount ? (
                    <span className="ml-auto shrink-0 bg-blue-500 text-white text-[11px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                      {c.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Center panel: thread header + messages + composer
// ----------------------------------------------------------------------------

function ChatHeader() {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
      <div className="flex items-center gap-3">
        <img
          src={GROUP_INFO.avatar}
          alt={GROUP_INFO.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="text-white text-sm font-semibold">{GROUP_INFO.name}</p>
          <p className="text-blue-400 text-xs">Adam recording a voice mes...</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Overlapping member avatars */}
        <div className="flex items-center">
          {MEMBERS.map((m, i) => (
            <img
              key={m.id}
              src={m.avatar}
              alt={m.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-black"
              style={{ marginLeft: i === 0 ? 0 : -10 }}
            />
          ))}
          <div
            className="w-8 h-8 rounded-full bg-zinc-800 ring-2 ring-black flex items-center justify-center text-[11px] text-zinc-300 font-medium"
            style={{ marginLeft: -10 }}
          >
            +{GROUP_INFO.memberCount - MEMBERS.length}
          </div>
        </div>

        <button
          onClick={() => console.log("[Chats] start video call")}
          className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <Video className="w-4 h-4" />
        </button>
        <button
          onClick={() => console.log("[Chats] start voice call")}
          className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          onClick={() => console.log("[Chats] open thread options menu")}
          className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function MessageContextMenu({
  onAction,
  onReact,
}: {
  onAction: (key: string) => void;
  onReact: (emoji: string) => void;
}) {
  return (
    <div className="absolute right-0 top-0 z-20 flex items-start gap-2">
      {/* Vertical reaction picker */}
      <div className="flex flex-col items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full py-2 px-1.5 shadow-xl">
        {REACTION_EMOJIS.map(({ icon: Icon, value }) => (
          <button
            key={value}
            onClick={() => onReact(value)}
            title={value}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
          >
            <Icon className="w-4 h-4 text-zinc-300" />
          </button>
        ))}
        <button
          onClick={() => console.log("[Chats] open full emoji picker")}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors text-zinc-400"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Actions list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-2 shadow-xl w-40">
        {CONTEXT_MENU_ACTIONS.map(({ key, label, icon: Icon, danger }) => (
          <button
            key={key}
            onClick={() => onAction(key)}
            className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors ${
              danger
                ? "text-red-400 hover:bg-zinc-800"
                : "text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  menuOpen,
  onToggleMenu,
  onAction,
  onReact,
}: {
  message: Message;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onAction: (key: string) => void;
  onReact: (emoji: string) => void;
}) {
  const alignRight = message.isOwn;

  return (
    <div className={`flex flex-col ${alignRight ? "items-end" : "items-start"} group`}>
      {/* Sender row (skip re-showing avatar/name on own messages, mirror screenshot) */}
      <div className={`flex items-center gap-2 mb-2 ${alignRight ? "flex-row-reverse" : ""}`}>
        {!alignRight && (
          <img
            src={message.senderAvatar}
            alt={message.senderName}
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
        <span className="text-white text-sm font-medium">{message.senderName}</span>
        <span className="text-zinc-500 text-xs">{message.time}</span>
        {alignRight && (
          <img
            src={message.senderAvatar}
            alt={message.senderName}
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
      </div>

      <div className="relative max-w-xl">
        {message.type === "text" && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              alignRight
                ? "bg-blue-500 text-white rounded-tr-sm"
                : "bg-zinc-900 text-zinc-100 rounded-tl-sm"
            }`}
          >
            {message.text}
          </div>
        )}

        {message.type === "link-share" && (
          <div className="bg-zinc-900 rounded-2xl p-4 rounded-tl-sm">
            <a
              href={message.url}
              onClick={(e) => {
                e.preventDefault();
                console.log("[Chats] open external link", message.url);
              }}
              className="text-blue-400 text-sm underline underline-offset-2 break-all"
            >
              {message.url}
            </a>

            <div className="flex gap-3 mt-3">
              <div className="w-1 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <p className="text-red-400 text-sm font-semibold">{message.siteName}</p>
                <p className="text-white text-sm font-medium mt-0.5">{message.title}</p>
                <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                  {message.description}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-3 ml-4">
              {message.images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-24 h-32 rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {/* Hover trigger for the reaction / context menu */}
        <button
          onClick={onToggleMenu}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
          title="More actions"
        >
          •••
        </button>

        {menuOpen && (
          <MessageContextMenu onAction={onAction} onReact={onReact} />
        )}
      </div>

      <ReactionPills reactions={message.reactions} />
    </div>
  );
}

function MessageComposer() {
  const [value, setValue] = useState("");

  function handleSend() {
    if (!value.trim()) return;
    // TODO(backend): POST /api/conversations/:id/messages
    console.log("[Chats] send message", value);
    setValue("");
  }

  return (
    <div className="px-6 py-4 border-t border-zinc-800 shrink-0">
      <div className="flex items-center gap-3 bg-zinc-900 rounded-2xl px-4 py-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type something..."
          className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-zinc-500"
        />
        <button
          onClick={() => console.log("[Chats] open voice recorder")}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <Mic className="w-4 h-4" />
        </button>
        <button
          onClick={() => console.log("[Chats] open image/attachment picker")}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleSend}
          className="w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-400 transition-colors flex items-center justify-center text-white"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ChatThread() {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="flex-1 min-w-0 h-full flex flex-col">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
        {MESSAGES.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            menuOpen={openMenuId === m.id}
            onToggleMenu={() =>
              setOpenMenuId((current) => (current === m.id ? null : m.id))
            }
            onAction={(action) => {
              // TODO(backend): route each action to its own endpoint
              // reply -> set replyTo state; edit -> PATCH message; pin -> POST /pin
              // copy -> navigator.clipboard.writeText; forward -> open picker; delete -> DELETE
              console.log("[Chats] message action:", action, "on message", m.id);
              setOpenMenuId(null);
            }}
            onReact={(emoji) => {
              // TODO(backend): POST /api/messages/:id/reactions
              console.log("[Chats] react", emoji, "to message", m.id);
              setOpenMenuId(null);
            }}
          />
        ))}
      </div>

      <MessageComposer />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Right panel: group info, files/links stats, media grid, members
// ----------------------------------------------------------------------------

function GroupInfoPanel() {
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [mediaTab, setMediaTab] = useState<"media" | "document" | "links">("media");
  const [memberPage, setMemberPage] = useState(1);
  const totalMemberPages = 9;

  return (
    <div className="w-80 shrink-0 h-full overflow-y-auto border-l border-zinc-800 px-5 py-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <img
          src={GROUP_INFO.avatar}
          alt={GROUP_INFO.name}
          className="w-11 h-11 rounded-full object-cover"
        />
        <div>
          <p className="text-white text-sm font-semibold">{GROUP_INFO.name}</p>
          <p className="text-zinc-500 text-xs">{GROUP_INFO.memberCount} members</p>
        </div>
      </div>

      {/* Description */}
      <div className="mt-6">
        <p className="text-white text-sm font-semibold mb-2">Description</p>
        <p className="text-zinc-400 text-xs leading-relaxed">{GROUP_INFO.description}</p>
      </div>

      {/* Notifications toggle */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-2 text-zinc-300 text-sm">
          <Bell className="w-4 h-4 text-zinc-500" />
          Notifications
        </div>
        <button
          onClick={() => {
            const next = !notificationsOn;
            // TODO(backend): PATCH /api/conversations/:id/notifications { enabled: next }
            console.log("[Chats] toggle notifications ->", next);
            setNotificationsOn(next);
          }}
          className={`w-10 h-6 rounded-full relative transition-colors ${
            notificationsOn ? "bg-blue-500" : "bg-zinc-700"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              notificationsOn ? "translate-x-4.5" : "translate-x-0.5"
            }`}
            style={{ transform: notificationsOn ? "translateX(18px)" : "translateX(2px)" }}
          />
        </button>
      </div>

      {/* Files / Links stat cards */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          onClick={() => console.log("[Chats] open Files list")}
          className="bg-zinc-900 rounded-2xl p-4 text-left hover:bg-zinc-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-3">
            <Folder className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-white text-sm font-semibold">Files</p>
          <p className="text-zinc-500 text-xs">{GROUP_INFO.filesCount}</p>
        </button>
        <button
          onClick={() => console.log("[Chats] open Links list")}
          className="bg-zinc-900 rounded-2xl p-4 text-left hover:bg-zinc-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
            <Link2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-white text-sm font-semibold">Links</p>
          <p className="text-zinc-500 text-xs">{GROUP_INFO.linksCount}</p>
        </button>
      </div>

      {/* Media / Document / Links tabs */}
      <div className="flex items-center gap-2 mt-6 text-sm">
        {(["media", "document", "links"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMediaTab(tab)}
            className={`px-3 py-1.5 rounded-full capitalize transition-colors ${
              mediaTab === tab
                ? "bg-blue-500 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {mediaTab === "media" && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {MEDIA_IMAGES.map((src, i) => (
            <button
              key={i}
              onClick={() => console.log("[Chats] open media preview", i)}
              className="aspect-square rounded-lg overflow-hidden"
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
          <button
            onClick={() => console.log("[Chats] open full media gallery")}
            className="aspect-square rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            +{MEDIA_TOTAL_COUNT - MEDIA_IMAGES.length}
          </button>
        </div>
      )}
      {mediaTab === "document" && (
        <p className="text-zinc-500 text-xs mt-4">No documents shared yet.</p>
      )}
      {mediaTab === "links" && (
        <p className="text-zinc-500 text-xs mt-4">No links shared yet.</p>
      )}

      {/* Add member */}
      <button
        onClick={() => console.log("[Chats] open add-member flow")}
        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 transition-colors text-white text-sm font-medium rounded-2xl py-3 mt-6"
      >
        <UserPlus className="w-4 h-4" />
        Add member
      </button>

      {/* Member list */}
      <div className="mt-4 flex flex-col divide-y divide-zinc-900">
        {MEMBERS.map((m) => (
          <button
            key={m.id}
            onClick={() => console.log("[Chats] open member profile", m.name)}
            className="flex items-center gap-3 py-3 hover:bg-zinc-950 transition-colors -mx-1 px-1 rounded-lg"
          >
            <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover" />
            <span className="text-white text-sm flex-1 text-left">{m.name}</span>
            <span className="text-zinc-500 text-xs">{m.role}</span>
          </button>
        ))}
      </div>

      {/* Member pagination */}
      <div className="flex items-center justify-center gap-3 mt-4 text-zinc-400 text-xs">
        <button
          onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
          className="hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span>
          {String(memberPage).padStart(2, "0")}/{String(totalMemberPages).padStart(2, "0")}
        </span>
        <button
          onClick={() => setMemberPage((p) => Math.min(totalMemberPages, p + 1))}
          className="hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Block contact */}
      <button
        onClick={() => {
          // TODO(backend): POST /api/conversations/:id/block
          console.log("[Chats] block this contact");
        }}
        className="w-full text-red-400 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-2xl py-3 mt-6"
      >
        Block this contact!!!
      </button>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Top-level export
// ----------------------------------------------------------------------------

export default function Chats() {
  const [activeConversationId, setActiveConversationId] = useState("c3");
  const [filter, setFilter] = useState<"all" | "group" | "pinned" | "archived">("all");
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="flex-1 h-full min-h-0 flex bg-black">
      <ConversationsSidebar
        activeId={activeConversationId}
        onSelect={setActiveConversationId}
        filter={filter}
        onFilterChange={setFilter}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
      <ChatThread />
      <GroupInfoPanel />
    </div>
  );
}