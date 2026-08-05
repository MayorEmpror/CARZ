// =====================================================================
// Server component. This is the ONLY place requireUser() gets called —
// it runs on the server, has access to cookies/headers, and can safely
// resolve who's logged in. We pass the result down as plain props to
// the client component, which has no server-only APIs available to it.
// =====================================================================

import { requireUser } from "@/lib/IAM/validators";
import ChatClient from "./Chatclient";

export default async function ChatPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const user = await requireUser();
  const conversationId = Number(params.conversationId);

  return (
    <ChatClient
      conversationId={conversationId}
      currentUser={{ user_id: user.user_id, full_name: user.full_name }}
    />
  );
}