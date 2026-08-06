// =====================================================================
// GET /api/chat/messages/[conversationId]
//
// Loads past messages. This is a plain REST call — separate from the
// socket entirely — so it can run in PARALLEL with the socket
// connecting/joining the room, instead of one blocking the other.
// The socket only ever pushes NEW messages after this point.
// =====================================================================

import { NextResponse } from "next/server";
import { Pool } from "pg";
import { requireUser } from "@/lib/IAM/validators";

// Server-only — this file never gets bundled into the browser (API
// routes always run on the server), so importing `pg` here is safe,
// unlike in lib/socket.ts which is imported by a client component.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await requireUser();
  const { conversationId: rawId } = await params;
  const conversationId = Number(rawId);

  if (!Number.isInteger(conversationId)) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  // Authorization: only members of this conversation can read it.
  const membership = await pool.query(
    `SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, user.user_id]
  );
  if ((membership.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: "Not part of this conversation" }, { status: 403 });
  }

  // Pagination: ?before=<message_id>&limit=<n> for "load older messages"
  // (infinite scroll up). Defaults to the most recent 50.
  const { searchParams } = new URL(req.url);
  const before = searchParams.get("before");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  const result = await pool.query(
    `
    SELECT m.message_id, m.conversation_id, m.sender_id, m.content,
           m.created_at, m.edited, u.full_name AS username
    FROM messages m
    JOIN users u ON u.user_id = m.sender_id
    WHERE m.conversation_id = $1
      ${before ? "AND m.message_id < $3" : ""}
    ORDER BY m.created_at DESC
    LIMIT $2
    `,
    before ? [conversationId, limit, Number(before)] : [conversationId, limit]
  );

  // Queried newest-first (so LIMIT grabs the most recent page), but the
  // UI reads top-to-bottom oldest-first — flip it before sending back.
  const messages = result.rows.reverse();

  return NextResponse.json({ messages });
}