"use client";

// app/chat/components/ConversationsSidebar.tsx
//
// ASSUMPTIONS (adjust to match your real data layer):
//   - You already have Chats.tsx / data.ts / types.ts with a
//     Conversation shape and a fetch function. I don't have that
//     file's content, so this component defines a minimal local
//     shape + a GET /api/chat/conversations fetch. Swap the
//     fetchConversations() body for whatever you already have in
//     data.ts — the layout/highlighting/mobile logic below is the
//     part that matters and doesn't depend on where the data comes
//     from.
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
import { useEffect, useState } from "react";

interface CurrentUser {
  user_id: number;
  full_name: string;
}

interface ConversationSummary {
  conversation_id: number;
  title: string;              // group name, or the other person's name for 1:1s
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  other_user_id?: number;     // used for deterministic avatar color on 1:1s
}

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

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
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

  return (
    <aside
      className={[
        "w-full shrink-0 flex-col border-r border-slate-200 bg-white md:flex md:w-80",
        // Mobile: hide the sidebar entirely once a thread is open,
        // so the thread can take the full screen (WhatsApp behavior).
        activeId ? "hidden" : "flex",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
        <h2 className="text-base font-semibold text-slate-900">Chats</h2>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white ${colorForUser(
            currentUser.user_id
          )}`}
        >
          {initials(currentUser.full_name)}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-4 py-6 text-center text-sm text-slate-400">
            Loading conversations…
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-slate-400">
            No conversations yet.
          </div>
        )}

        {conversations.map((c) => {
          const isActive = String(c.conversation_id) === activeId;
          return (
            <Link
              key={c.conversation_id}
              href={`/chat/${c.conversation_id}`}
              className={[
                "flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition",
                isActive ? "bg-blue-50" : "hover:bg-slate-50",
              ].join(" ")}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${colorForUser(
                  c.other_user_id ?? c.conversation_id
                )}`}
              >
                {initials(c.title)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-slate-100">
                    {c.title}
                  </span>
                  {c.last_message_at && (
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {timeAgo(c.last_message_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-slate-500">
                    {c.last_message ?? "No messages yet"}
                  </span>
                  {!!c.unread_count && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                      {c.unread_count}
                    </span>
                  )}
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
// back arrow in ChatHeader.tsx (or directly in Chatclient.tsx's header
// block) that's only visible below md:
//
//   <Link href="/chat" className="md:hidden mr-2">
//     <ArrowLeft className="h-5 w-5 text-slate-500" />
//   </Link>
//
// That's the only change ChatClient needs — everything else (sockets,
// message state, etc.) is untouched by this refactor.
// ---------------------------------------------------------------------