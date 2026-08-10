// app/chat/page.tsx
//
// Rendered as {children} inside layout.tsx when the URL is exactly
// "/chat" — i.e. nothing selected yet. This is the empty-state pane
// on the right, sidebar still visible on the left via the layout.

import { MessageSquare } from "lucide-react";

export default function ChatIndexPage() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 text-slate-400">
      <MessageSquare className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
      <p className="text-sm">Select a conversation to start chatting</p>
    </div>
  );
}