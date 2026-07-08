"use client";
import {
  LayoutDashboard,
  Car,
  Users,
  UserCog,
  PlusCircle,
  Settings,
  LogOut,
} from "lucide-react";

type Tab = "cars" | "customers" | "owners" | "addcar";

const navItems: { tab: Tab; label: string; icon: React.ElementType }[] = [
  { tab: "cars", label: "Cars", icon: Car },
  { tab: "customers", label: "Customers", icon: Users },
  { tab: "owners", label: "Owners", icon: UserCog },
  { tab: "addcar", label: "Add Car", icon: PlusCircle },
];

function NavButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-white text-black"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      }`}
    >
      {/* active indicator bar */}
      {active && (
        <span className="absolute -left-4 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r bg-white" />
      )}
      <Icon
        className={`w-4 h-4 shrink-0 ${
          active ? "text-black" : "text-zinc-500 group-hover:text-white"
        }`}
      />
      <span>{label}</span>
    </button>
  );
}

export default function Sidebar({
  activeTab,
  setActiveTab,
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}) {
  return (
    <div className="w-64 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col">
      {/* LOGO / BRAND */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-black" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">
            Admin Panel
          </p>
          <p className="text-zinc-500 text-xs leading-tight">Fleet Manager</p>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex-1 px-4 py-6">
        <p className="px-3 text-[11px] font-semibold tracking-wider text-zinc-600 uppercase mb-3">
          Management
        </p>
        <div className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavButton
              key={item.tab}
              label={item.label}
              icon={item.icon}
              active={activeTab === item.tab}
              onClick={() => setActiveTab(item.tab)}
            />
          ))}
        </div>
      </nav>

      {/* FOOTER */}
      <div className="border-t border-zinc-800 p-4">
        <button className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
          <Settings className="w-4 h-4 text-zinc-500" />
          Settings
        </button>
        <button className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors mt-1">
          <LogOut className="w-4 h-4 text-zinc-500" />
          Log out
        </button>

        <div className="flex items-center gap-3 mt-4 px-3 pt-4 border-t border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold text-white">
            A
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">Admin User</p>
            <p className="text-zinc-500 text-xs truncate">admin@fleet.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}