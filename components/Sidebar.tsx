"use client";

import {
  Home,
  Car,
  FileText,
  Heart,
  Clock,
  Bell,
  MessageSquare,
  ShieldCheck,
  LifeBuoy,
  LogOut,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Home", icon: Home },
  { label: "Vehicles", icon: Car },
  { label: "Notes", icon: FileText },
  { label: "Favourites", icon: Heart },
  { label: "Recents", icon: Clock },
  { label: "Notifications", icon: Bell },
  { label: "Chat", icon: MessageSquare },
];

const FOOTER_ITEMS = [
  { label: "License", icon: ShieldCheck },
  { label: "Support", icon: LifeBuoy },
  { label: "Logout", icon: LogOut },
];

export default function Sidebar() {
  const [active, setActive] = useState("Vehicles");

  return (
    <aside className="flex h-full w-44 shrink-0 flex-col justify-between border-r border-white/10 bg-[#131318] py-4">
      <nav className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(({ label, icon: Icon }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => setActive(label)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-white/10 font-medium text-white"
                  : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </button>
          );
        })}
      </nav>

      <nav className="flex flex-col gap-0.5 px-3">
        {FOOTER_ITEMS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}