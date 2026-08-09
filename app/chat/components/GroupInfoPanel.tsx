"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Bell,
  Folder,
  Link2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { GROUP_INFO, MEMBERS, MEDIA_IMAGES, MEDIA_TOTAL_COUNT } from "./data";
import type { MediaTab } from "./types";

const MEDIA_TABS: MediaTab[] = ["media", "document", "links"];
const TOTAL_MEMBER_PAGES = 9;
const TOGGLE_THUMB_ON_PX = 18;
const TOGGLE_THUMB_OFF_PX = 2;

export function GroupInfoPanel() {
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [mediaTab, setMediaTab] = useState<MediaTab>("media");
  const [memberPage, setMemberPage] = useState(1);

  const hiddenMediaCount = MEDIA_TOTAL_COUNT - MEDIA_IMAGES.length;

  return (
    <div className="w-80 shrink-0 h-full overflow-y-auto border-l border-zinc-800 px-5 py-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Image
          src={GROUP_INFO.avatar}
          alt={GROUP_INFO.name}
          width={44}
          height={44}
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
          type="button"
          role="switch"
          aria-checked={notificationsOn}
          aria-label="Toggle notifications"
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
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
            style={{
              transform: `translateX(${
                notificationsOn ? TOGGLE_THUMB_ON_PX : TOGGLE_THUMB_OFF_PX
              }px)`,
            }}
          />
        </button>
      </div>

      {/* Files / Links stat cards */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          type="button"
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
          type="button"
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
        {MEDIA_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMediaTab(tab)}
            aria-pressed={mediaTab === tab}
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
          {MEDIA_IMAGES.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => console.log("[Chats] open media preview", index)}
              className="relative aspect-square rounded-lg overflow-hidden"
            >
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
          {hiddenMediaCount > 0 && (
            <button
              type="button"
              onClick={() => console.log("[Chats] open full media gallery")}
              className="aspect-square rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              +{hiddenMediaCount}
            </button>
          )}
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
        type="button"
        onClick={() => console.log("[Chats] open add-member flow")}
        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 transition-colors text-white text-sm font-medium rounded-2xl py-3 mt-6"
      >
        <UserPlus className="w-4 h-4" />
        Add member
      </button>

      {/* Member list */}
      <div className="mt-4 flex flex-col divide-y divide-zinc-900">
        {MEMBERS.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => console.log("[Chats] open member profile", member.name)}
            className="flex items-center gap-3 py-3 hover:bg-zinc-950 transition-colors -mx-1 px-1 rounded-lg"
          >
            <Image
              src={member.avatar}
              alt={member.name}
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover"
            />
            <span className="text-white text-sm flex-1 text-left">{member.name}</span>
            <span className="text-zinc-500 text-xs">{member.role}</span>
          </button>
        ))}
      </div>

      {/* Member pagination */}
      <div className="flex items-center justify-center gap-3 mt-4 text-zinc-400 text-xs">
        <button
          type="button"
          onClick={() => setMemberPage((page) => Math.max(1, page - 1))}
          disabled={memberPage === 1}
          aria-label="Previous page"
          className="hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-zinc-400"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span>
          {String(memberPage).padStart(2, "0")}/{String(TOTAL_MEMBER_PAGES).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => setMemberPage((page) => Math.min(TOTAL_MEMBER_PAGES, page + 1))}
          disabled={memberPage === TOTAL_MEMBER_PAGES}
          aria-label="Next page"
          className="hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-zinc-400"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Block contact */}
      <button
        type="button"
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