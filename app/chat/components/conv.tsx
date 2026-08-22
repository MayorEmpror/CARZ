"use client";

// app/chat/components/ConversationsSidebar.tsx
//
// ASSUMPTIONS (adjust to match your real data layer):
//   - Same base as before: minimal local ConversationSummary shape +
//     GET /api/chat/conversations. Swap fetchConversations() for your
//     real data.ts fetch — the layout/filtering/mobile logic below is
//     the part that matters and doesn't depend on where the data
//     comes from.
//   - The screenshot's UI needs a few fields your API may not send
//     yet. They're all OPTIONAL on ConversationSummary so nothing
//     breaks if they're missing — rows just fall back to the plain
//     "last message" line and no story ring:
//       avatar_url            -> real photo instead of initials
//       is_group               -> powers the "Group" tab
//       is_pinned               -> powers the "Pinned" tab
//       is_archived             -> powers the "Archived" tab (and is
//                                   excluded from "All messages")
//       is_typing               -> shows the blue "Typing" line
//       last_message_type       -> "voice" | "attachment" | "text"
//       voice_duration          -> e.g. "0:35", shown for voice notes
//       last_message_from_me    -> "You: " prefix + read-receipt ticks
//       last_message_read       -> single vs. double check
//   - Icons come from lucide-react (already a common dep alongside
//     Tailwind in most Next.js chat UIs — `npm i lucide-react` if you
//     don't have it yet).
//
// Behavior:
//   - Highlights the row matching the current /chat/[conversationId]
//     route via useParams().
//   - On mobile (< md breakpoint), collapses to single-pane: shows
//     ONLY the sidebar at "/chat", and hides itself (thread takes
//     full screen) once a conversationId is present in the URL. A
//     "back" affordance lives in the thread's own header — see note
//     at the bottom for wiring that into ChatClient/ChatHeader.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Check, CheckCheck, Mic, Paperclip, PenSquare, Plus } from "lucide-react";

interface CurrentUser {
  user_id: number;
  full_name: string;
}

interface ConversationSummary {
  conversation_id: number;
  title: string; // group name, or the other person's name for 1:1s
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  other_user_id?: number; // used for deterministic avatar color on 1:1s

  // Optional — see ASSUMPTIONS above.
  avatar_url?: string;
  is_group?: boolean;
  is_pinned?: boolean;
  is_archived?: boolean;
  is_typing?: boolean;
  last_message_type?: "text" | "voice" | "attachment";
  voice_duration?: string;
  last_message_from_me?: boolean;
  last_message_read?: boolean;
}

type TabKey = "all" | "group" | "pinned" | "archived";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All messages" },
  { key: "group", label: "Group" },
  { key: "pinned", label: "Pinned" },
  { key: "archived", label: "Archived" },
];

function colorForUser(id: number) {
  const palette = [
    "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500",
    "bg-teal-500", "bg-cyan-500", "bg-blue-500", "bg-violet-500",
    "bg-fuchsia-500", "bg-pink-500",
  ];
  return palette[id % palette.length];
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
}

function Avatar({ c, size = 14 }: { c: ConversationSummary; size?: 14 | 10 }) {
  const dim = size === 14 ? "h-14 w-14" : "h-10 w-10";
  if (c.avatar_url) {
    return (
      <img
        src={c.avatar_url}
        alt={c.title}
        className={`${dim} shrink-0 rounded-full object-cover ring-1 ring-white/10`}
      />
    );
  }
  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ring-1 ring-white/10 ${colorForUser(
        c.other_user_id ?? c.conversation_id
      )}`}
    >
      {initials(c.title)}
    </div>
  );
}

function Preview({ c }: { c: ConversationSummary }) {
  if (c.is_typing) {
    return <span className="truncate text-sm font-medium text-blue-400">Typing</span>;
  }
  if (c.last_message_type === "voice") {
    return (
      <span className="flex min-w-0 items-center gap-1 truncate text-sm text-neutral-400">
        <Mic className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Voice message{c.voice_duration ? ` (${c.voice_duration})` : ""}</span>
      </span>
    );
  }
  if (c.last_message_type === "attachment") {
    return (
      <span className="flex min-w-0 items-center gap-1 truncate text-sm text-neutral-400">
        <Paperclip className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{c.last_message ?? "Attachment"}</span>
      </span>
    );
  }
  return (
    <span className="truncate text-sm text-neutral-400">
      {c.last_message_from_me ? "You: " : ""}
      {c.last_message ?? "No messages yet"}
    </span>
  );
}

export default function ConversationsSidebar({
  currentUser,
}: {
  currentUser: CurrentUser;
}) {
  const params = useParams<{ conversationId?: string }>();
  const activeId = params?.conversationId;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/chat/conversations", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setConversations(data.conversations ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[chat] failed to load conversations:", err);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (activeTab === "group") return !!c.is_group;
      if (activeTab === "pinned") return !!c.is_pinned;
      if (activeTab === "archived") return !!c.is_archived;
      // "All messages" excludes archived, like most chat apps.
      return !c.is_archived;
    });
  }, [conversations, activeTab]);

  const sectionLabel =
    activeTab === "group" ? "GROUPS" : activeTab === "pinned" ? "PINNED" : activeTab === "archived" ? "ARCHIVED" : "PERSONAL";

  // Story rail: people with a photo, most recently active first. Purely
  // a visual affordance from existing conversation data — wire up a
  // real stories/status feed here if/when you have one.
  const storyContacts = useMemo(() => conversations.filter((c) => c.avatar_url).slice(0, 8), [conversations]);

  return (
    <aside
      className={[
        "w-full shrink-0 flex-col bg-black md:flex md:w-80 md:border-r md:border-white/10",
        // Mobile: hide the sidebar entirely once a thread is open,
        // so the thread can take the full screen (WhatsApp behavior).
        activeId ? "hidden" : "flex",
      ].join(" ")}
    >
      {/* Story rail */}
      <div className="scrollbar-none flex gap-4 overflow-x-auto px-4 pb-2 pt-4">
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-white/25 text-white/60 transition hover:border-white/40 hover:text-white/80"
            aria-label="Add to your story"
          >
            <Plus className="h-5 w-5" />
          </button>
          <span className="text-[11px] text-neutral-400">My Story</span>
        </div>

        {storyContacts.map((c) => (
          <div key={c.conversation_id} className="flex shrink-0 flex-col items-center gap-1.5">
            <div className="rounded-full ring-2 ring-blue-500 ring-offset-2 ring-offset-black">
              <img
                src={c.avatar_url}
                alt={c.title}
                className="h-14 w-14 rounded-full object-cover"
              />
            </div>
            <span className="max-w-[56px] truncate text-[11px] text-neutral-300">{firstName(c.title)}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 pt-2">
        <h1 className="text-[28px] font-bold leading-none text-white">Messages</h1>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15"
          aria-label="New message"
        >
          <PenSquare className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-3">
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
                active
                  ? "bg-blue-500 text-white"
                  : "bg-transparent text-neutral-400 hover:text-neutral-200",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Section label */}
      {!loading && filtered.length > 0 && (
        <div className="px-4 pb-1 pt-1 text-xs font-semibold tracking-wide text-neutral-500">
          {sectionLabel}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-4 py-6 text-center text-sm text-neutral-400">
            Loading conversations…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-neutral-400">
            {activeTab === "all" ? "No conversations yet." : `No ${sectionLabel.toLowerCase()} chats.`}
          </div>
        )}

        {filtered.map((c) => {
          const isActive = String(c.conversation_id) === activeId;
          return (
            <Link
              key={c.conversation_id}
              href={`/chat/${c.conversation_id}`}
              className={[
                "flex items-center gap-3 border-b border-white/5 px-4 py-3.5 transition",
                isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
              ].join(" ")}
            >
              <Avatar c={c} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[15px] font-semibold text-white">
                    {c.title}
                  </span>
                  {c.last_message_at && (
                    <span className="shrink-0 text-xs text-neutral-500">
                      {formatTime(c.last_message_at)}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <Preview c={c} />

                  {c.unread_count ? (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-semibold text-white">
                      {c.unread_count}
                    </span>
                  ) : c.last_message_from_me ? (
                    c.last_message_read ? (
                      <CheckCheck className="h-4 w-4 shrink-0 text-blue-400" />
                    ) : (
                      <Check className="h-4 w-4 shrink-0 text-neutral-500" />
                    )
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------
// Mobile "back to conversations" note:
// Since the sidebar is hidden on mobile once activeId is set, add a
// back arrow in ChatHeader.tsx (or directly in ChatClient.tsx's header
// block) that's only visible below md:
//
//   <Link href="/chat" className="md:hidden mr-2">
//     <ArrowLeft className="h-5 w-5 text-slate-500" />
//   </Link>
//
// That's the only change ChatClient needs — everything else (sockets,
// message state, etc.) is untouched by this refactor.
//
// Tailwind note: if you don't already have a `scrollbar-none` utility,
// either add the `tailwind-scrollbar-hide` plugin or drop those
// classes — the story rail and tab row just get native scrollbars.
// ---------------------------------------------------------------------