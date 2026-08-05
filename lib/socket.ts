"use client";

// =====================================================================
// Client-side Socket.IO connection.
//
// IMPORTANT: we no longer read the session cookie directly via
// document.cookie — if that cookie is httpOnly (which it should be,
// for security), JS in the browser can't see it at all, and every
// connection attempt would silently fail auth and retry forever.
//
// Instead, we fetch a one-time token from a server route
// (/api/chat/socket-token) that CAN read the httpOnly cookie because
// it runs on the server, and hand that token to the socket handshake.
// =====================================================================

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let connecting: Promise<Socket> | null = null;

async function fetchSocketToken(): Promise<string> {
  const res = await fetch("/api/chat/socket-token", { credentials: "include" });
  if (!res.ok) {
    throw new Error("Could not get a socket token — are you logged in?");
  }
  const data = await res.json();
  return data.token as string;
}

// Call this from a useEffect. Returns the same socket instance on
// every subsequent call once connected (singleton per tab).
export async function connectSocket(): Promise<Socket> {
  if (socket) return socket;
  if (connecting) return connecting; // avoid double-connecting on fast re-renders/StrictMode

  connecting = (async () => {
    const token = await fetchSocketToken();

    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    s.on("connect_error", (err) => {
      // This will now print the REAL reason (e.g. "Unauthorized",
      // "websocket error", etc.) instead of failing silently.
      console.error("[socket] connection error:", err.message);
    });

    socket = s;
    return s;
  })();

  return connecting;
}

// Use this in components that just need the current socket without
// re-triggering the connect flow (after connectSocket() already ran).
export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  connecting = null;
}