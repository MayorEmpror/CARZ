"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { connectSocket, getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";
import {
  MessageCircle,
  Hash,
  UserRound,
  Calendar,
  Star,
  CarFront,
  Fuel,
  Cog,
  Link as LinkIcon,
  Clock,
} from "lucide-react";
import { Car } from "@/lib/types";
import ConversationInfoPanel, {
  ConversationMember,
  ConversationFile,
  ConversationLink,
} from "./Conversationinfopanel";

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
  car: Car;
  members?: ConversationMember[];
  media?: ConversationFile[];
  documents?: ConversationFile[];
  links?: ConversationLink[];
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

// ---- small presentational helpers for the sidebar ----------------------
function formatPrice(price: string) {
  const n = Number(price);
  if (Number.isNaN(n)) return price;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function statusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "available":
      return "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30";
    case "sold":
      return "bg-red-500/15 text-red-400 ring-1 ring-red-500/30";
    case "pending":
      return "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30";
    default:
      return "bg-neutral-500/15 text-neutral-400 ring-1 ring-neutral-500/30";
  }
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-3">
      <span className="flex items-center gap-2.5 text-xs text-neutral-500">
        <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-600" strokeWidth={1.75} />
        {label}
      </span>
      <span
        className={`max-w-[55%] truncate text-right text-xs font-medium text-neutral-200 ${
          mono ? "font-mono text-[11px] text-neutral-400" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ---- the car details tab content, showing every Car field except `model` --------
function CarSidebarContent({ car }: { car: Car }) {
  return (
    <>
      {/* Image card */}
      {car.image_url && (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-neutral-900 to-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={car.image_url}
            alt={`${car.make} ${car.model}`}
            className="aspect-video w-full object-cover h-70"
          />
        </div>
      )}

      {/* Title + status */}
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">
          {car.year} {car.make}
        </h2>
        <span
          className={`inline-block shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium capitalize ${statusColor(
            car.status
          )}`}
        >
          {car.status}
        </span>
      </div>

      {/* Price hero */}
      <div className="mt-3 rounded-2xl border border-white/5 bg-black/40 px-4 py-3">
        <div className="text-[10px] uppercase tracking-wide text-neutral-500">Price</div>
        <div className="mt-0.5 text-xl font-semibold text-white">{formatPrice(car.price)}</div>
        <div className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
          {car.rating}
          <span className="text-neutral-600">· {car.rating_count} ratings</span>
        </div>
      </div>

      {/* Spec details */}
      <div className="mt-4 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/5 bg-black/20">
        <DetailRow icon={Calendar} label="Year" value={car.year} />
        <DetailRow icon={CarFront} label="Body type" value={car.body_type} />
        <DetailRow icon={Fuel} label="Fuel type" value={car.fuel_type} />
        <DetailRow icon={Cog} label="Transmission" value={car.transmission} />
 
      </div>
    </>
  );
}

export default function ChatClient({
  conversationId,
  currentUser,
  car,
  members = [],
  media = [],
  documents = [],
  links = [],
}: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [convCar, setconvCar] = useState<Car>(car);

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
    <div className="flex h-full w-full max-w-7xl overflow-hidden border border-white/10 bg-[#131318]">
      {/* Main chat column */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[#131318]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#131318] px-5 py-4 backdrop-blur-xl">
          <div>
            <h1 className="text-base font-semibold text-white">{convCar.make + " " + convCar.model}</h1>
            <p className="mt-0.5 text-xs text-neutral-500">
              {connected ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-500" />
                  Connecting…
                </span>
              )}
            </p>
          </div>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-white/10 ${colorForUser(
              currentUser.user_id
            )}`}
          >
            {initials(currentUser.full_name)}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="border-b border-red-500/20 bg-red-500/10 px-5 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-black px-5 py-4 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] [background-size:24px_24px] no-scrollbar">
          {historyLoading && messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-neutral-500">
              Loading messages…
            </div>
          )}

          {!historyLoading && messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-neutral-500">
              No messages yet — say hello.
            </div>
          )}

          {messages.map((msg) => {
            const mine = msg.sender_id === currentUser.user_id;
            return (
              <div key={msg.message_id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                {!mine && (
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-1 ring-white/10 ${colorForUser(
                      msg.sender_id
                    )}`}
                  >
                    {initials(msg.username)}
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-md ${
                    msg.failed
                      ? "rounded-br-sm border border-red-500/30 bg-[#131318] text-red-300"
                      : mine
                      ? `rounded-br-sm bg-linear-to-br from-blue-600 to-blue-500 text-white ${
                          msg.pending ? "opacity-60" : ""
                        }`
                      : "rounded-bl-sm border border-white/5 bg-[#131318] text-neutral-100 backdrop-blur"
                  }`}
                >
                  {!mine && (
                    <div className="mb-0.5 text-xs font-semibold text-neutral-400">{msg.username}</div>
                  )}
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  <div
                    className={`mt-1 text-right text-[10px] ${
                      msg.failed ? "text-red-400" : mine ? "text-blue-100/70" : "text-neutral-500"
                    }`}
                  >
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
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-600 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-600 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-600" />
              </span>
              {typingUser} is typing
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-end gap-2 border-t border-white/10 bg-[#131318] px-4 py-3 backdrop-blur-xl">
          <textarea
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-2xl border border-white/10 bg-black px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-blue-500/10 focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-blue-500 text-white transition hover:from-blue-500 hover:to-blue-400 disabled:cursor-not-allowed disabled:from-neutral-900 disabled:to-neutral-900 disabled:opacity-50"
          >
            <MessageCircle />
          </button>
        </div>
      </div>

      {/* Right sidebar: car details + group info stacked together */}
      <div className="hidden w-[20rem] shrink-0 flex-col overflow-y-auto border-l border-white/10 bg-[#131318] md:flex">
        <div className="p-4">
          <CarSidebarContent car={convCar} />
        </div>

        <div className="mx-4 h-px bg-white/5" />

        <ConversationInfoPanel members={members} media={media} documents={documents} links={links} />
      </div>
    </div>
  );
}