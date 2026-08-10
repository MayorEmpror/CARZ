// app/chat/[conversationId]/page.tsx
//
// Rendered as {children} inside layout.tsx whenever the URL is
// "/chat/:conversationId". Functionally identical to your original
// app/chat/page.tsx — requireUser() still resolved server-side here
// (cheap; layout.tsx already resolved it once for the sidebar, this
// is a second call for this segment — see note at bottom on caching
// that if you want to avoid the duplicate DB/session hit).
//
// Note the relative import: this file moved one level deeper
// (chat/[conversationId]/page.tsx instead of chat/page.tsx), so
// ChatClient is now "../components/Chatclient" not "./components/...".

import { requireUser } from "@/lib/IAM/validators";
import ChatClient from "../components/Chatclient";

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId: rawId } = await params;
  const user = await requireUser();
  const conversationId = Number(rawId);

  return (
    <ChatClient
      conversationId={conversationId}
      currentUser={{ user_id: user.user_id, full_name: user.full_name }}
    />
  );
}