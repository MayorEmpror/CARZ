import User from "@/lib/types";
import { useState } from "react";
import {
  Phone,
  Mail,
  MoreHorizontal,
  BadgeCheck,
  ListFilter,
  Plus,
  Send,
} from "lucide-react";

type Props = {
  user: User;
};

/* ---------------- dummy data ---------------- */

type Payment = {
  id: string;
  ref: string;
  date: string;
  category: string;
  color: string;
  amount: number;
};

type Note = {
  id: string;
  author: string;
  role: string;
  date: string;
  content: string;
};

const dummyPayments: Payment[] = [
  { id: "1", ref: "№1227673", date: "06 Sep 2025", category: "Restaurant", color: "text-emerald-400 bg-emerald-500/10", amount: 270 },
  { id: "2", ref: "№1227589", date: "05 Sep 2025", category: "Bar", color: "text-amber-400 bg-amber-500/10", amount: 120 },
  { id: "3", ref: "№1226793", date: "05 Sep 2025", category: "Spa", color: "text-sky-400 bg-sky-500/10", amount: 70 },
  { id: "4", ref: "№1226479", date: "04 Sep 2025", category: "Laundry", color: "text-pink-400 bg-pink-500/10", amount: 56 },
];

const dummyNotes: Note[] = [
  { id: "1", author: "Ariana Davis", role: "Admin", date: "Sep 1, 2025", content: "" },
  { id: "2", author: "Alice Smith", role: "Admin", date: "Jul 7, 2025", content: "The guest is allergic to dairy products. Don't forget to inform the restaurant." },
];

type Message = {
  id: string;
  from: "guest" | "staff";
  author: string;
  time: string;
  content: string;
};

const dummyMessages: Message[] = [
  { id: "1", from: "guest", author: "Hashir Ali", time: "9:02 AM", content: "Hi, could we get late check-out on the 7th?" },
  { id: "2", from: "staff", author: "Ariana Davis", time: "9:05 AM", content: "Of course! I've noted 2 PM check-out for room 505." },
  { id: "3", from: "guest", author: "Hashir Ali", time: "9:06 AM", content: "Perfect, thank you." },
  { id: "4", from: "staff", author: "Ariana Davis", time: "11:40 AM", content: "Also, breakfast is included daily 7–10 AM in the main restaurant." },
];

export const dummyUser: User = {
  user_id: 5,
  full_name: "Hashir Ali",
  email: "hashirbutt2610@gmail.com",
  phone: "+92-300-1234567",
  password_hash: "" as any,
  role: "customer",
  created_at: new Date("2024-01-15").toISOString() as any,
};

/* ---------------- main component ---------------- */

export default function Profile({ user }: Props) {
  return (
    <div
      className="grid h-screen w-full max-w-6xl gap-4 overflow-hidden bg-black p-4"
      style={{
        gridTemplateColumns: "1fr 1fr 0.85fr",
        gridTemplateRows: "auto 1fr",
        gridTemplateAreas: `"profile notes chats" "payments payments chats"`,
      }}
    >
      <div style={{ gridArea: "profile" }} className="min-h-0">
        <ProfileCard user={user} />
      </div>
      <div style={{ gridArea: "notes" }} className="min-h-0">
        <NotesCard notes={dummyNotes} />
      </div>
      <div style={{ gridArea: "payments" }} className="min-h-0 overflow-hidden">
        <PaymentsCard payments={dummyPayments} />
      </div>
      <div style={{ gridArea: "chats" }} className="min-h-0 overflow-hidden">
        <ChatsCard messages={dummyMessages} />
      </div>
    </div>
  );
}

/* ---------------- Profile card ---------------- */

function ProfileCard({ user }: Props) {
  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const createdDate = new Date(user.created_at as unknown as string);
  const memberSince = isNaN(createdDate.getTime())
    ? "—"
    : createdDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-100">Profile</h3>
        <button className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-sm font-semibold text-neutral-400">
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-neutral-100">{user.full_name}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
              <BadgeCheck size={12} />
              {user.role}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">ID: {user.user_id}</p>
        </div>
      </div>

      <hr className="my-4 border-neutral-800" />

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-300">Contact information</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-400">
              <Phone size={14} />
            </span>
            {user.phone || "—"}
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-400">
              <Mail size={14} />
            </span>
            {user.email}
          </div>
        </div>
      </div>

      <hr className="my-4 border-neutral-800" />

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-300">Account information</p>
        <div className="grid grid-cols-2 gap-y-3">
          <div>
            <p className="text-xs text-neutral-500">Role</p>
            <p className="text-sm font-medium text-neutral-200">{user.role}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Member since</p>
            <p className="text-sm font-medium text-neutral-200">{memberSince}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Payments card ---------------- */

function PaymentsCard({ payments }: { payments: Payment[] }) {
  const [selected, setSelected] = useState<string[]>(payments.slice(0, 3).map((p) => p.id));

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const toggleAll = () =>
    setSelected(selected.length === payments.length ? [] : payments.map((p) => p.id));

  return (
    <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-neutral-100">Payments</h3>
            <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
              {payments.length} Bills
            </span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">All guest charges for the last period</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800">
          <ListFilter size={13} />
          Filters
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-2 text-xs text-neutral-500">
          <input
            type="checkbox"
            checked={selected.length === payments.length}
            onChange={toggleAll}
            className="h-3.5 w-3.5 accent-blue-500"
          />
          <span className="flex-1">Date</span>
          <span className="w-24">Category</span>
          <span className="w-16 text-right">Amount</span>
        </div>

        {payments.map((p) => (
          <div key={p.id} className="flex items-center gap-3 border-b border-neutral-800/60 py-3 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(p.id)}
              onChange={() => toggle(p.id)}
              className="h-3.5 w-3.5 accent-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-neutral-200">{p.category}</p>
              <p className="text-xs text-neutral-500">{p.ref}</p>
            </div>
            <span className={`w-24 rounded-full px-2 py-0.5 text-center text-xs font-medium ${p.color}`}>
              {p.category}
            </span>
            <span className="w-16 text-right font-medium text-neutral-200">${p.amount}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end">
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
          Close Bills
        </button>
      </div>
    </div>
  );
}

/* ---------------- Notes card ---------------- */

function NotesCard({ notes }: { notes: Note[] }) {
  const [draft, setDraft] = useState("");

  return (
    <div className="h-full w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-neutral-100">Notes</h3>
          <p className="mt-0.5 text-xs text-neutral-500">Important details for staff reference</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800">
          <Plus size={13} />
          Add
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {notes.map((n) => (
          <div key={n.id} className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-semibold text-neutral-400">
                {n.author.split(" ").map((p) => p[0]).join("")}
              </div>
              <span className="text-sm font-medium text-neutral-200">{n.author}</span>
              <span className="text-xs font-medium text-emerald-400">{n.role}</span>
              <span className="ml-auto text-xs text-neutral-500">{n.date}</span>
            </div>

            {n.content ? (
              <p className="mt-2 text-sm text-neutral-400">{n.content}</p>
            ) : (
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a new note"
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-300 placeholder:text-neutral-600 outline-none"
              />
            )}
          </div>
        ))}
      </div>

      <button className="mt-4 w-full rounded-lg border border-neutral-800 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800">
        View All Notes
      </button>
    </div>
  );
}

/* ---------------- Chats card ---------------- */

function ChatsCard({ messages }: { messages: Message[] }) {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
      <div>
        <h3 className="text-base font-semibold text-neutral-100">Chats</h3>
        <p className="mt-0.5 text-xs text-neutral-500">Conversation with the guest</p>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "staff" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                m.from === "staff"
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-neutral-200"
              }`}
            >
              <p>{m.content}</p>
              <p
                className={`mt-1 text-[10px] ${
                  m.from === "staff" ? "text-blue-100/70" : "text-neutral-500"
                }`}
              >
                {m.author} · {m.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-neutral-800 pt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message"
          className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 placeholder:text-neutral-600 outline-none"
        />
        <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-500">
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}