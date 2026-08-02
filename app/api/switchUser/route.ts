import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { switchRoleSession } from "@/lib/services";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const { targetRole } = await request.json();

  const VALID_ROLES = ["customer", "driver", "owner"];

  if (!VALID_ROLES.includes(targetRole)) {
    return NextResponse.json({ message: "Unsupported target role." }, { status: 400 });
  }

  const sessionResult = await pool.query(
    `
    SELECT user_id
    FROM sessions
    WHERE session_id = $1 AND expires_at > NOW()
    `,
    [sessionId]
  );

  if (sessionResult.rowCount === 0) {
    return NextResponse.json({ message: "Session expired." }, { status: 401 });
  }

  const currentUserId = sessionResult.rows[0].user_id;

  try {
    const { sessionId: newSessionId, user } = await switchRoleSession(
      currentUserId,
      targetRole
    );

    cookieStore.set("session_id", newSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true, role: user.role }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not switch role.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}