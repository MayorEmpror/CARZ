// app/chat/layout.tsx
//
// Server component. Runs once per session (doesn't remount when you
// navigate between /chat and /chat/[conversationId]) -- this is what
// gives you the WhatsApp-style persistent left column. Only {children}
// swaps as the URL changes.
//
// requireUser() stays here (server-only) -- both the sidebar and the
// thread page share this one resolved user instead of each doing
// their own auth check.

import { requireUser } from "@/lib/IAM/validators";
import ConversationsSidebar from "./components/conv";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const currentUser = { user_id: user.user_id, full_name: user.full_name };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-900">
      {/* Left column -- conversation list. Fixed width via the
          sidebar's own w-80, so it doesn't need a flex value here. */}
      <ConversationsSidebar currentUser={currentUser} />

      {/* Main chat area -- takes all remaining space. min-w-0 is
          required, not decorative: without it a wide message or long
          unbreakable string inside {children} can force this column
          wider than the viewport instead of scrolling/wrapping. */}
     <div className="flex min-w-0 flex-1 flex-col overflow-y-auto no-scrollbar">{children}</div>
    </div>
  );
}