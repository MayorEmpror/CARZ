// =====================================================================
// GET  /api/chat/conversations        -- list my conversations (sidebar)
// POST /api/chat/conversations        -- start (or resume) a conversation
//                                         about a specific car
//
// ASSUMPTION: cars table has an owner_id column (FK -> users.user_id),
// matching the naming convention conversations.owner_id already uses.
// If your cars table names it differently, change OWNER_COLUMN below.
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

// ---------------------------------------------------------------------
// POST /api/chat/conversations
// Body: { car_id: number }
//
// Flow:
//   1. Look up the car's owner_id.
//   2. Refuse if the caller IS the owner (can't message yourself
//      about your own listing).
//   3. If a conversation about this car already exists between this
//      owner/customer pair, reuse it instead of creating a duplicate
//      thread every time "Contact" is clicked.
//   4. Otherwise create the conversation + both membership rows
//      atomically (single transaction — a conversation with only one
//      member, or none, should never be possible).
//
// Returns { conversation_id } so the client can router.push(`/chat/${id}`).
// ---------------------------------------------------------------------
export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json();
  const carId = Number(body?.car_id);

  if (!Number.isInteger(carId)) {
    return NextResponse.json({ error: "Invalid car id" }, { status: 400 });
  }

  const carResult = await pool.query(
    `SELECT owner_id FROM cars WHERE car_id = $1`,
    [carId]
  );
  if (carResult.rowCount === 0) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }
  const ownerId: number = carResult.rows[0].owner_id;

  if (ownerId === user.user_id) {
    return NextResponse.json(
      { error: "You can't start a conversation about your own car" },
      { status: 400 }
    );
  }

  // Reuse an existing thread for this (car, owner, customer) combo
  // instead of spawning a new one every time Contact is clicked.
  const existing = await pool.query(
    `
    SELECT c.conversation_id
    FROM conversations c
    WHERE c.car_id = $1
      AND EXISTS (
        SELECT 1 FROM conversation_members cm
        WHERE cm.conversation_id = c.conversation_id AND cm.user_id = $2
      )
      AND EXISTS (
        SELECT 1 FROM conversation_members cm
        WHERE cm.conversation_id = c.conversation_id AND cm.user_id = $3
      )
    LIMIT 1
    `,
    [carId, ownerId, user.user_id]
  );
  if ((existing.rowCount ?? 0) > 0) {
    return NextResponse.json({ conversation_id: existing.rows[0].conversation_id });
  }

  // Create conversation + both membership rows together. If the
  // membership inserts failed after the conversation insert succeeded,
  // you'd get an orphaned conversation with no members — the
  // transaction prevents that.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const convResult = await client.query(
      `
      INSERT INTO conversations (car_id, owner_id, customer_id)
      VALUES ($1, $2, $3)
      RETURNING conversation_id
      `,
      [carId, ownerId, user.user_id]
    );
    const conversationId = convResult.rows[0].conversation_id;

    await client.query(
      `
      INSERT INTO conversation_members (conversation_id, user_id)
      VALUES ($1, $2), ($1, $3)
      `,
      [conversationId, ownerId, user.user_id]
    );

    await client.query("COMMIT");
    return NextResponse.json({ conversation_id: conversationId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[chat] failed to create conversation:", err);
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
  } finally {
    client.release();
  }
}