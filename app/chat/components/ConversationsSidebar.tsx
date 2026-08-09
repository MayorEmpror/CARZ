"use client";

import Image from "next/image";
import { Search, SquarePen, Plus } from "lucide-react";
import { CONVERSATIONS, STORIES } from "./data";
import type { ConversationFilter, Conversation } from "./types";
import { StatusIndicator } from "./StatusIndicator";

const FILTER_TABS: { key: ConversationFilter; label: string }[] = [
  { key: "all", label: "All messages" },
  { key: "group", label: "Group" },
  { key: "pinned", label: "Pinned" },
  { key: "archived", label: "Archived" },
];

const INLINE_STATUSES: NonNullable<Conversation["status"]>[] = ["typing", "voice"];

interface ConversationsSidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
  filter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function ConversationsSidebar({
  activeId,
  onSelect,
  filter,
  onFilterChange,
  searchValue,
  onSearchChange,
}: ConversationsSidebarProps) {
  const filteredConversations = CONVERSATIONS.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchValue.toLowerCase())
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
            type="button"
            onClick={() => console.log("[Chats] open create-story flow")}
            className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"
            aria-label="Add a story"
          >
            <Plus className="w-5 h-5" />
          </button>
          <span className="text-[11px] text-zinc-500">My Story</span>
        </div>
        {STORIES.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => console.log("[Chats] view story", story.name)}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <Image
              src={story.avatar}
              alt={story.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500 ring-offset-2 ring-offset-black"
            />
            <span className="text-[11px] text-zinc-400">{story.name}</span>
          </button>
        ))}
      </div>

      {/* Header + compose */}
      <div className="flex items-center justify-between px-4 pb-3">
        <h1 className="text-white text-2xl font-semibold">Messages</h1>
        <button
          type="button"
          onClick={() => console.log("[Chats] open new-message composer")}
          className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="New message"
        >
          <SquarePen className="w-4 h-4" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 px-4 pb-4 text-sm">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onFilterChange(tab.key)}
            aria-pressed={filter === tab.key}
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
        {filteredConversations.map((conversation) => {
          const isActive = conversation.id === activeId;
          const showInlineStatus = Boolean(
            conversation.status && INLINE_STATUSES.includes(conversation.status)
          );

          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => {
                // TODO(backend): load thread — GET /api/conversations/:id/messages
                console.log("[Chats] select conversation", conversation.id, conversation.name);
                onSelect(conversation.id);
              }}
              aria-current={isActive ? "true" : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive ? "bg-zinc-900" : "hover:bg-zinc-950"
              }`}
            >
              <Image
                src={conversation.avatar}
                alt={conversation.name}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white text-sm font-medium truncate">
                    {conversation.name}
                  </p>
                  <span className="text-xs text-zinc-500 shrink-0">{conversation.time}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <StatusIndicator status={conversation.status} />
                  {!showInlineStatus && (
                    <span className="text-xs text-zinc-500 truncate">
                      {conversation.lastMessage}
                    </span>
                  )}
                  {conversation.unreadCount ? (
                    <span className="ml-auto shrink-0 bg-blue-500 text-white text-[11px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unreadCount}
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