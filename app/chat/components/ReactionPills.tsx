"use client";

import type { Reaction } from "./types";

export function ReactionPills({ reactions }: { reactions?: Reaction[] }) {
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