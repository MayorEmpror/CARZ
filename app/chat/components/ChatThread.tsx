"use client";

import { useState } from "react";
import { MESSAGES } from "./data";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";

export function ChatThread() {
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