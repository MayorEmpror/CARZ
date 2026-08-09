"use client";

// ============================================================================
// Chats.tsx
// Three-panel messaging UI: conversation list (left) · message thread (center)
// · group info panel (right). All data lives in ./data.ts — swap it out for
// real fetches / a socket connection / server actions.
// ============================================================================

import { useState } from "react";
import type { ConversationFilter } from "./types";
import { ConversationsSidebar } from "./ConversationsSidebar";
import { ChatThread } from "./ChatThread";
import { GroupInfoPanel } from "./GroupInfoPanel";

export default function Chats() {
  const [activeConversationId, setActiveConversationId] = useState("c3");
  const [filter, setFilter] = useState<ConversationFilter>("all");
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