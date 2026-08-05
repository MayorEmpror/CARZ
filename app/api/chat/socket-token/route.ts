// =====================================================================
// GET /api/chat/socket-token
//
// The browser can't read an httpOnly cookie via document.cookie — only
// the server can. This route runs server-side, reads the real session
// cookie, confirms it belongs to a logged-in user, and hands the token
// value back to the client JUST so it can pass it into the Socket.IO
// handshake. The socket server then independently re-validates this
// same token against the `sessions` table before trusting anything.
// =====================================================================

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/IAM/validators";

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    // If requireUser() throws instead of redirecting when unauthenticated,
    // this surfaces the real reason instead of a generic 401.
    console.error("[socket-token] requireUser() failed:", err);
    return NextResponse.json(
      { error: "Not authenticated", detail: err instanceof Error ? err.message : String(err) },
      { status: 401 }
    );
  }

  // IMPORTANT: "session_token" is a guess at your cookie's name — check
  // DevTools → Application → Cookies while logged in and confirm the
  // actual name your login flow sets, then update this if it differs.
  const cookieStore = await cookies();
  const allCookieNames = cookieStore.getAll().map((c) => c.name);
  const token = cookieStore.get("session_id")?.value;

  if (!token) {
    console.error("[socket-token] No session_token cookie found. Cookies present:", allCookieNames);
    return NextResponse.json(
      {
        error: "No session token",
        // Temporary debug aid — remove once this is working.
        cookiesSeen: allCookieNames,
      },
      { status: 401 }
    );
  }

  return NextResponse.json({ token, userId: user.user_id });
}