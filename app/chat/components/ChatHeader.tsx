"use client";

import Image from "next/image";
import { Video, Phone, MoreVertical } from "lucide-react";
import { GROUP_INFO, MEMBERS } from "./data";

const OVERLAP_OFFSET_PX = -10;
const ICON_BUTTON_CLASS =
  "w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors";

export function ChatHeader() {
  const hiddenMemberCount = GROUP_INFO.memberCount - MEMBERS.length;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
      <div className="flex items-center gap-3">
        <Image
          src={GROUP_INFO.avatar}
          alt={GROUP_INFO.name}
          width={40}
          height={40}
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
          {MEMBERS.map((member, index) => (
            <Image
              key={member.id}
              src={member.avatar}
              alt={member.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-black"
              style={{ marginLeft: index === 0 ? 0 : OVERLAP_OFFSET_PX }}
            />
          ))}
          {hiddenMemberCount > 0 && (
            <div
              className="w-8 h-8 rounded-full bg-zinc-800 ring-2 ring-black flex items-center justify-center text-[11px] text-zinc-300 font-medium"
              style={{ marginLeft: OVERLAP_OFFSET_PX }}
            >
              +{hiddenMemberCount}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => console.log("[Chats] start video call")}
          className={ICON_BUTTON_CLASS}
          aria-label="Start video call"
        >
          <Video className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => console.log("[Chats] start voice call")}
          className={ICON_BUTTON_CLASS}
          aria-label="Start voice call"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => console.log("[Chats] open thread options menu")}
          className={ICON_BUTTON_CLASS}
          aria-label="Open thread options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}