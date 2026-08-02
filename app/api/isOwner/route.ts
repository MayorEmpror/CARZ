import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { findAccountByEmailAndRole } from "@/lib/services";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    console.log("didnt find not evben a sessig id ")
    return NextResponse.json({ hasOwnerAccount: false }, { status: 200 });
  }

  const sessionResult = await pool.query(
    `
    SELECT u.email, u.role
    FROM sessions s
    JOIN users u ON u.user_id = s.user_id
    WHERE s.session_id = $1 AND s.expires_at > NOW()
    `,
    [sessionId]
  );

  if (sessionResult.rowCount === 0) {
    console.log("didnt find aything")
    return NextResponse.json({ hasOwnerAccount: false }, { status: 200 });
  }

  const { email, role } = sessionResult.rows[0];

  // Already an owner — no need to offer a switch.
  if (role === "owner") {
    console.log("got the owner")
    return NextResponse.json({ hasOwnerAccount: false }, { status: 200 });
  }

  const ownerAccount = await findAccountByEmailAndRole(email, "owner");
  console.log("owner.ts owner account retirved from db : " + ownerAccount)
  return NextResponse.json({ hasOwnerAccount: Boolean(ownerAccount) }, { status: 200 });
}