// app/chat/layout.tsx
//
// Server component. Runs once per session (doesn't remount when you
// navigate between /chat and /chat/[conversationId]) — this is what
// gives you the WhatsApp-style persistent left column. Only {children}
// swaps as the URL changes.
//
// requireUser() stays here (server-only), same as your old page.tsx —
// we just moved it up one level so both the sidebar and the thread
// page can share the same resolved user without each doing their own
// auth check.

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
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Left column — conversation list. Fixed width, always mounted. */}
      <ConversationsSidebar currentUser={currentUser} />

      {/* Right column — swaps between "select a conversation" (index)
          and the active ChatClient thread ([conversationId]/page.tsx),
          driven purely by the URL. */}
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}