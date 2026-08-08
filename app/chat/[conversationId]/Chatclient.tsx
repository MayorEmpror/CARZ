"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { connectSocket, getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

type Message = {
  message_id: number | string; // string for optimistic temp messages before the server confirms
  conversation_id: number;
  sender_id: number;
  username: string;
  content: string;
  created_at: string;
  clientTempId?: string | null;
  pending?: boolean; // true = optimistic, not yet confirmed by the server
  failed?: boolean;  // true = server rejected it
};

interface CurrentUser {
  user_id: number;
  full_name: string;
}

interface ChatClientProps {
  conversationId: number;
  currentUser: CurrentUser;
}

// Deterministic pastel color per user, so each person's avatar/name is
// visually consistent across the conversation without storing a color.
function colorForUser(userId: number) {
  const palette = [
    "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500",
    "bg-teal-500", "bg-cyan-500", "bg-blue-500", "bg-violet-500",
    "bg-fuchsia-500", "bg-pink-500",
  ];
  return palette[userId % palette.length];
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function ChatClient({ conversationId, currentUser }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // ---- history fetch (REST) ---------------------------------------
  // Runs independently of the socket connection — NOT awaited before
  // connecting, and the socket connect NOT awaited before this fires.
  // They race in parallel; whichever resolves first paints first.
  useEffect(() => {
    let cancelled = false;
  
    fetch(`/api/chat/messages/${conversationId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setHistoryLoading(false);
  
        setMessages((prev) => {
          const historyIds = new Set(
            (data.messages ?? []).map((m: Message) => m.message_id)
          );
  
          const extras = prev.filter(
            (m) => !m.pending && !historyIds.has(m.message_id)
          );
  
          return [...(data.messages ?? []), ...extras];
        });
      })
      .catch((err) => {
        if (cancelled) return;
  
        console.error("[chat] failed to load history:", err);
        setHistoryLoading(false);
      });
  
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  
  // ---- socket wiring --------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    // null assignment to a possibly null socket of type Socket
    let socket: Socket | null = null;

    function handleConnect() {
      setConnected(true);
      setError(null);
      // this is the emitter, "join conversation is the event listener and conv_id is the argument"
      // "! clears out to TS that socket is not null at this point"
      socket!.emit("join-conversation", conversationId);
    }
    function handleDisconnect() {
      setConnected(false);
    }
    function handleNewMessage(message: Message) {
      if (message.conversation_id !== conversationId) return;

      setMessages((prev) => {
        // If this confirms one of OUR OWN optimistic messages (matched
        // by the tempId we sent), replace the temp one in place rather
        // than appending a duplicate.
        if (message.clientTempId) {
          const idx = prev.findIndex((m) => m.message_id === message.clientTempId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = message;
            return next;
          }
        }
        // Otherwise it's a message from someone else, or history
        // already contains it — append only if genuinely new.
        if (prev.some((m) => m.message_id === message.message_id)) return prev;
        return [...prev, message];
      });
      setTypingUser(null);
    }
    function handleTyping(payload: { conversationId: number; userId: number; username: string }) {
      if (payload.conversationId !== conversationId || payload.userId === currentUser.user_id) return;
      setTypingUser(payload.username);
    }
    function handleStopTyping(payload: { conversationId: number; userId: number }) {
      if (payload.conversationId !== conversationId) return;
      setTypingUser(null);
    }
    function handleChatError(payload: { message: string; clientTempId?: string | null }) {
      setError(payload.message);
      // Mark the specific optimistic message as failed, if this error
      // was about one, instead of just showing a generic banner.
      if (payload.clientTempId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.message_id === payload.clientTempId ? { ...m, pending: false, failed: true } : m
          )
        );
      }
    }

    connectSocket()
      .then((s) => {
        if (cancelled) return; // component unmounted before this resolved
        socket = s;

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("new-message", handleNewMessage);
        socket.on("typing", handleTyping);
        socket.on("stop-typing", handleStopTyping);
        socket.on("chat-error", handleChatError);

        if (socket.connected) handleConnect();
      })
      .catch((err) => {
        // Most likely cause: not logged in, or the socket-token route
        // couldn't find a valid session — see console for details.
        console.error("[chat] failed to connect:", err);
        setError("Couldn't connect to chat. Try refreshing the page.");
      });

    return () => {
      cancelled = true;
      if (!socket) return;
      socket.emit("leave-conversation", conversationId);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new-message", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stop-typing", handleStopTyping);
      socket.off("chat-error", handleChatError);
    };
  }, [conversationId, currentUser.user_id]);

  // ---- auto-scroll ------------------------------------------------
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // ---- typing debounce --------------------------------------------
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    const socket = getSocket();
    if (!socket) return; // not connected yet — ignore typing pings until it is

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", conversationId);
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("stop-typing", conversationId);
    }, 1500);
  }

  const sendMessage = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const socket = getSocket();
    if (!socket || !socket.connected) {
      setError("Not connected yet — hang on a second and try again.");
      return;
    }

    // ---- Optimistic UI ------------------------------------------
    // Render the message in OUR OWN window immediately, before the
    // server has confirmed anything. This is what makes sending feel
    // instant without actually skipping the DB write for everyone
    // else — the server still inserts first, then broadcasts; we're
    // just not waiting on that round trip ourselves.
    const tempId = crypto.randomUUID();
    const optimisticMessage: Message = {
      message_id: tempId,
      conversation_id: conversationId,
      sender_id: currentUser.user_id,
      username: currentUser.full_name,
      content: trimmed,
      created_at: new Date().toISOString(),
      clientTempId: tempId,
      pending: true,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    // The real send — server will insert into Postgres, then broadcast
    // "new-message" (including this same tempId) to everyone in the
    // room, including us. handleNewMessage() above swaps our temp
    // entry out for the confirmed one when that arrives.
    socket.emit("send-message", { conversationId, content: trimmed, clientTempId: tempId });

    setText("");
    isTypingRef.current = false;
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    socket.emit("stop-typing", conversationId);
  }, [conversationId, text, currentUser]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="mx-auto flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Conversation #{conversationId}</h1>
          <p className="text-xs text-slate-400">
            {connected ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> Connecting…
              </span>
            )}
          </p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${colorForUser(currentUser.user_id)}`}>
          {initials(currentUser.full_name)}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-5 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-5 py-4">
        {historyLoading && messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Loading messages…
          </div>
        )}

        {!historyLoading && messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No messages yet — say hello.
          </div>
        )}

        {messages.map((msg) => {
          const mine = msg.sender_id === currentUser.user_id;
          return (
            <div key={msg.message_id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              {!mine && (
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${colorForUser(msg.sender_id)}`}>
                  {initials(msg.username)}
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  msg.failed
                    ? "rounded-br-sm bg-red-50 text-red-700 ring-1 ring-red-200"
                    : mine
                    ? `rounded-br-sm bg-blue-600 text-white ${msg.pending ? "opacity-60" : ""}`
                    : "rounded-bl-sm bg-white text-slate-900 ring-1 ring-slate-200"
                }`}
              >
                {!mine && (
                  <div className="mb-0.5 text-xs font-semibold text-slate-500">{msg.username}</div>
                )}
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                <div className={`mt-1 text-right text-[10px] ${mine && !msg.failed ? "text-blue-100" : "text-slate-400"}`}>
                  {msg.failed
                    ? "Failed to send"
                    : msg.pending
                    ? "Sending…"
                    : new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}

        {typingUser && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex gap-0.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
            </span>
            {typingUser} is typing
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="max-h-32 flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}