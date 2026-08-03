import { User } from "@/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  Mail,
  MoreHorizontal,
  ListFilter,
  Plus,
  Send,
  UserRound,
  StickyNote,
  Wallet,
  MessagesSquare,
  Sparkles,
} from "lucide-react";

type Props = {
  user: User;
};

/* ---------------- design tokens ----------------
   Copper (#C08552) is the one accent — a concierge/
   brass tone rather than the default blue-on-black.
   Everything else stays quiet: warm stone neutrals
   on near-black, hairline borders, no drop shadows
   doing the work of hierarchy. */

const ACCENT = "#C08552";

/* ---------------- dummy data ---------------- */

type Payment = {
  id: string;
  ref: string;
  date: string;
  category: string;
  dot: string;
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
  { id: "1", ref: "№1227673", date: "06 Sep 2025", category: "Restaurant", dot: "bg-emerald-400", amount: 270 },
  { id: "2", ref: "№1227589", date: "05 Sep 2025", category: "Bar", dot: "bg-amber-400", amount: 120 },
  { id: "3", ref: "№1226793", date: "05 Sep 2025", category: "Spa", dot: "bg-sky-400", amount: 70 },
  { id: "4", ref: "№1226479", date: "04 Sep 2025", category: "Laundry", dot: "bg-pink-400", amount: 56 },
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

/* ---------------- shared bits ---------------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
      {children}
    </p>
  );
}

function CardShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-neutral-900/70 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------------- main component ---------------- */

export default function Profile({ user }: Props) {
  return (
    <div
      className="relative h-screen w-full max-w-6xl overflow-hidden bg-neutral-950 p-4"
      style={{
        backgroundImage: `radial-gradient(600px circle at 8% 0%, ${ACCENT}14, transparent 60%)`,
      }}
    >
      <div
        className="grid h-full w-full gap-4"
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
    </div>
  );
}

/* ---------------- Profile card ---------------- */

// Tailwind can't resolve arbitrary values built from a JS variable at
// build time, so the copper "owner" color is applied via inline style
// instead of a dynamic class string.
const ROLE_STYLES: Record<string, string> = {
  customer: "text-sky-300",
  driver: "text-emerald-300",
};

function ProfileCard({ user }: Props) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

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

  // Owners (and any other non-customer role) always have a sibling customer
  // account created at registration time, so no need to check first.
  const canSwitchToCustomer = user.role !== "customer";
  const roleColorClass = user.role === "owner" ? "" : ROLE_STYLES[user.role] ?? "text-stone-300";
  const roleColorStyle = user.role === "owner" ? { color: ACCENT } : undefined;

  async function handleSwitchToCustomer() {
    if (switching) return;
    setSwitching(true);

    try {
      const res = await fetch("/api/switchUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: "customer" }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        console.error(result?.message ?? "Failed to switch to customer mode.");
        setSwitching(false);
        return;
      }

      router.push("/showroom");
      router.refresh();
    } catch (err) {
      console.error(err);
      setSwitching(false);
    }
  }

  return (
    <CardShell className="flex h-full w-full flex-col overflow-y-auto p-5">
      <div className="flex items-center justify-between">
        <Eyebrow>Guest profile</Eyebrow>
        <button className="rounded-lg p-1.5 text-stone-500 transition hover:bg-white/5 hover:text-stone-300">
          <MoreHorizontal size={17} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full p-[1.5px]"
            style={{
              backgroundImage: `conic-gradient(${ACCENT}, transparent 65%, ${ACCENT})`,
            }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-neutral-900 font-serif text-base text-stone-100">
              {initials}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg text-stone-100">{user.full_name}</span>
            </div>
            <div
              className={`mt-1 inline-flex items-center gap-1 text-xs font-medium capitalize ${roleColorClass}`}
              style={roleColorStyle}
            >
              <span className="h-1 w-1 rounded-full bg-current" />
              {user.role}
              <span className="text-stone-600">· ID {user.user_id}</span>
            </div>
          </div>
        </div>

        {canSwitchToCustomer && (
          <button
            onClick={handleSwitchToCustomer}
            disabled={switching}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-stone-200 transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserRound size={13} />
            {switching ? "Switching…" : "Switch to customer"}
          </button>
        )}
      </div>

      <div className="my-4 h-px bg-white/[0.06]" />

      <div>
        <Eyebrow>Contact</Eyebrow>
        <div className="mt-2.5 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 text-sm text-stone-300">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
            >
              <Phone size={13} />
            </span>
            {user.phone || "—"}
          </div>
          <div className="flex items-center gap-2.5 text-sm text-stone-300">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
            >
              <Mail size={13} />
            </span>
            {user.email}
          </div>
        </div>
      </div>

      <div className="my-4 h-px bg-white/[0.06]" />

      <div>
        <Eyebrow>Account</Eyebrow>
        <div className="mt-2.5 grid grid-cols-2 gap-y-3">
          <div>
            <p className="text-[11px] text-stone-500">Role</p>
            <p className="text-sm font-medium capitalize text-stone-200">{user.role}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-500">Member since</p>
            <p className="text-sm font-medium text-stone-200">{memberSince}</p>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

/* ---------------- Payments card ---------------- */

function PaymentsCard({ payments }: { payments: Payment[] }) {
  const [selected, setSelected] = useState<string[]>(payments.slice(0, 3).map((p) => p.id));

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const toggleAll = () =>
    setSelected(selected.length === payments.length ? [] : payments.map((p) => p.id));

  const selectedTotal = payments
    .filter((p) => selected.includes(p.id))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <CardShell className="w-full p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
          >
            <Wallet size={15} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-stone-100">Payments</h3>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-stone-400">
                {payments.length} bills
              </span>
            </div>
            <p className="text-[11px] text-stone-500">All guest charges for the last period</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-stone-300 transition hover:bg-white/5">
          <ListFilter size={13} />
          Filters
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-2 text-[11px] uppercase tracking-wide text-stone-500">
          <input
            type="checkbox"
            checked={selected.length === payments.length}
            onChange={toggleAll}
            className="h-3.5 w-3.5 accent-[color:var(--accent)]"
            style={{ accentColor: ACCENT }}
          />
          <span className="flex-1">Guest &amp; date</span>
          <span className="w-24">Category</span>
          <span className="w-16 text-right">Amount</span>
        </div>

        {payments.map((p) => (
          <div key={p.id} className="flex items-center gap-3 border-b border-white/[0.04] py-3 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(p.id)}
              onChange={() => toggle(p.id)}
              className="h-3.5 w-3.5"
              style={{ accentColor: ACCENT }}
            />
            <div className="flex flex-1 items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
              <div>
                <p className="font-medium text-stone-200">{p.category}</p>
                <p className="text-xs text-stone-500">
                  {p.ref} · {p.date}
                </p>
              </div>
            </div>
            <span className="w-24 text-xs text-stone-500">{p.date}</span>
            <span className="w-16 text-right font-medium tabular-nums text-stone-100">
              ${p.amount}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-stone-500">
          Selected total ·{" "}
          <span className="font-medium tabular-nums text-stone-200">${selectedTotal}</span>
        </p>
        <button
          disabled={selected.length === 0}
          className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-950 transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: ACCENT }}
        >
          Close bills
        </button>
      </div>
    </CardShell>
  );
}

/* ---------------- Notes card ---------------- */

function NotesCard({ notes }: { notes: Note[] }) {
  const [draft, setDraft] = useState("");

  return (
    <CardShell className="flex h-full w-full flex-col p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
          >
            <StickyNote size={15} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-stone-100">Notes</h3>
            <p className="text-[11px] text-stone-500">Important details for staff reference</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-stone-300 transition hover:bg-white/5">
          <Plus size={13} />
          Add
        </button>
      </div>

      <div className="relative mt-4 flex flex-1 flex-col gap-4 overflow-y-auto pl-3">
        <div className="absolute bottom-2 left-[7px] top-1 w-px bg-white/[0.07]" />

        {notes.map((n) => (
          <div key={n.id} className="relative pl-4">
            <span
              className="absolute -left-3 top-1.5 h-[7px] w-[7px] rounded-full ring-4 ring-neutral-900"
              style={{ backgroundColor: ACCENT }}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-200">{n.author}</span>
              <span className="text-[11px] font-medium text-stone-500">{n.role}</span>
              <span className="ml-auto text-[11px] text-stone-600">{n.date}</span>
            </div>

            {n.content ? (
              <p className="mt-1 text-sm leading-relaxed text-stone-400">{n.content}</p>
            ) : (
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a new note"
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-sm text-stone-300 placeholder:text-stone-600 outline-none focus:border-white/20"
              />
            )}
          </div>
        ))}
      </div>

      <button className="mt-4 w-full rounded-lg border border-white/10 py-2 text-sm font-medium text-stone-300 transition hover:bg-white/5">
        View all notes
      </button>
    </CardShell>
  );
}

/* ---------------- Chats card ---------------- */

function ChatsCard({ messages }: { messages: Message[] }) {
  const [draft, setDraft] = useState("");

  return (
    <CardShell className="flex h-full w-full flex-col p-5">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
        >
          <MessagesSquare size={15} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-stone-100">Chats</h3>
          <p className="text-[11px] text-stone-500">Conversation with the guest</p>
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "staff" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                m.from === "staff"
                  ? "rounded-br-sm text-neutral-950"
                  : "rounded-bl-sm bg-white/[0.05] text-stone-200"
              }`}
              style={m.from === "staff" ? { backgroundColor: ACCENT } : undefined}
            >
              <p className="leading-relaxed">{m.content}</p>
              <p
                className={`mt-1 text-[10px] ${
                  m.from === "staff" ? "text-neutral-950/60" : "text-stone-500"
                }`}
              >
                {m.author} · {m.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3">
        <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 focus-within:border-white/20">
          <Sparkles size={13} className="shrink-0 text-stone-600" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a message"
            className="w-full bg-transparent text-sm text-stone-300 placeholder:text-stone-600 outline-none"
          />
        </div>
        <button
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-950 transition hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
        >
          <Send size={15} />
        </button>
      </div>
    </CardShell>
  );
}