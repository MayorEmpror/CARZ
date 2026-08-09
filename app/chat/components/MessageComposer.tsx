"use client";

import { useState } from "react";
import { Mic, Image as ImageIcon, Send } from "lucide-react";

export function MessageComposer() {
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