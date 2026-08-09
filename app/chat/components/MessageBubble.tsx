"use client";

import Image from "next/image";
import type { Message } from "./types";
import { ReactionPills } from "./ReactionPills";
import { MessageContextMenu } from "./MessageContextMenu";

interface MessageBubbleProps {
  message: Message;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onAction: (key: string) => void;
  onReact: (emoji: string) => void;
}

export function MessageBubble({
  message,
  menuOpen,
  onToggleMenu,
  onAction,
  onReact,
}: MessageBubbleProps) {
  const alignRight = message.isOwn;

  return (
    <div className={`flex flex-col ${alignRight ? "items-end" : "items-start"} group`}>
      {/* Sender row (skip re-showing avatar/name on own messages, mirror screenshot) */}
      <div className={`flex items-center gap-2 mb-2 ${alignRight ? "flex-row-reverse" : ""}`}>
        {!alignRight && (
          <Image
            src={message.senderAvatar}
            alt={message.senderName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
        <span className="text-white text-sm font-medium">{message.senderName}</span>
        <span className="text-zinc-500 text-xs">{message.time}</span>
        {alignRight && (
          <Image
            src={message.senderAvatar}
            alt={message.senderName}
            width={32}
            height={32}
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
              {message.images.map((src) => (
                <Image
                  key={src}
                  src={src}
                  alt=""
                  width={96}
                  height={128}
                  className="w-24 h-32 rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {/* Hover trigger for the reaction / context menu */}
        <button
          type="button"
          onClick={onToggleMenu}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
          title="More actions"
          aria-label="More actions"
        >
          •••
        </button>

        {menuOpen && <MessageContextMenu onAction={onAction} onReact={onReact} />}
      </div>

      <ReactionPills reactions={message.reactions} />
    </div>
  );
}