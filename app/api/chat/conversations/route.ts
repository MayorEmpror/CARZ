// =====================================================================
// GET /api/chat/conversations
//
// Powers the sidebar list. Membership is determined by
// conversation_members (same table messages/route.ts already uses for
// auth) -- NOT conversations.owner_id/customer_id, which turned out to
// be unrelated to actual participants (likely denormalized from the
// car listing itself, not the chat).
//
// "title" is the OTHER member's name -- conversation_members has no
// concept of "me" vs "them" beyond membership rows, so we just pick
// whichever member isn't the current user.
//
// unread_count: messages sent by someone else in this conversation
// with no matching message_reads row for me.
// =====================================================================

import { NextResponse } from "next/server";
import { Pool } from "pg";
import { requireUser } from "@/lib/IAM/validators";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  const user = await requireUser();

  const result = await pool.query(
    `
    SELECT
      c.conversation_id,
      c.car_id,
      other_user.user_id      AS other_user_id,
      other_user.full_name    AS title,
      last_msg.content         AS last_message,
      last_msg.created_at      AS last_message_at,
      COALESCE(unread.count, 0) AS unread_count
    FROM conversation_members my_membership
    JOIN conversations c
      ON c.conversation_id = my_membership.conversation_id

    -- the other participant in this conversation (not me)
    JOIN conversation_members other_membership
      ON other_membership.conversation_id = c.conversation_id
     AND other_membership.user_id != $1
    JOIN users other_user
      ON other_user.user_id = other_membership.user_id

    LEFT JOIN LATERAL (
      SELECT m.content, m.created_at
      FROM messages m
      WHERE m.conversation_id = c.conversation_id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) last_msg ON true

    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS count
      FROM messages m
      WHERE m.conversation_id = c.conversation_id
        AND m.sender_id != $1
        AND NOT EXISTS (
          SELECT 1 FROM message_reads mr
          WHERE mr.message_id = m.message_id AND mr.user_id = $1
        )
    ) unread ON true

    WHERE my_membership.user_id = $1
    ORDER BY last_msg.created_at DESC NULLS LAST
    `,
    [user.user_id]
  );

  return NextResponse.json({ conversations: result.rows });
}