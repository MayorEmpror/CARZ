"use client";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import {NavItem} from "@/lib/types"


export type SidebarUser = {
  name: string;
  email: string;
  /** Shown in the avatar circle if avatarUrl is not provided. Defaults to first letter of name. */
  avatarInitial?: string;
  avatarUrl?: string;
};

export interface SidebarProps<T extends string = string> {
  /** Currently active tab (must match one of navItems[].tab) */
  activeTab: T;
  /** Called with the tab value when a nav item is clicked. Accepts a plain setter
   *  or a React Dispatch<SetStateAction<T>> from useState. */
  setActiveTab: (tab: T) => void;
  /** List of navigation items to render */
  navItems: NavItem<T>[];

  /** Brand / logo section */
  brandName?: string;
  brandSubtitle?: string;
  brandIcon?: React.ElementType | string;

  /** Section heading above the nav list (e.g. "Management") */
  sectionLabel?: string;

  /** Footer user info */
  user?: SidebarUser;

  /** Settings button */
  showSettings?: boolean;
  settingsLabel?: string;
  onSettingsClick?: () => void;

  /** Logout button */
  showLogout?: boolean;
  logoutLabel?: string;
  onLogoutClick?: () => void;

  /** Optional width override, e.g. "w-64" */
  widthClassName?: string;
}

function NavButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ElementType | string;
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

export default function Sidebar<T extends string = string>({
  activeTab,
  setActiveTab,
  navItems,
  brandName = "Admin Panel",
  brandSubtitle = "Fleet Manager",
  brandIcon: BrandIcon = LayoutDashboard,
  sectionLabel = "Management",
  user,
  showSettings = true,
  settingsLabel = "Settings",
  onSettingsClick,
  showLogout = true,
  logoutLabel = "Log out",
  onLogoutClick,
  widthClassName = "w-64",
}: SidebarProps<T>) {
  const avatarInitial = user?.avatarInitial ?? user?.name?.charAt(0)?.toUpperCase() ?? "A";

  return (
    <div className={`${widthClassName} h-full bg-zinc-950 border-r border-zinc-800 flex flex-col`}>
      {/* LOGO / BRAND */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
          <BrandIcon className="w-5 h-5 text-black" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">
            {brandName}
          </p>
          <p className="text-zinc-500 text-xs leading-tight">{brandSubtitle}</p>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex-1 px-4 py-6">
        {sectionLabel && (
          <p className="px-3 text-[11px] font-semibold tracking-wider text-zinc-600 uppercase mb-3">
            {sectionLabel}
          </p>
        )}
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
        {showSettings && (
          <button
            onClick={onSettingsClick}
            className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Settings className="w-4 h-4 text-zinc-500" />
            {settingsLabel}
          </button>
        )}
        {showLogout && (
          <button
            onClick={onLogoutClick}
            className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors mt-1"
          >
            <LogOut className="w-4 h-4 text-zinc-500" />
            {logoutLabel}
          </button>
        )}

        {user && (
          <div className="flex items-center gap-3 mt-4 px-3 pt-4 border-t border-zinc-800">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold text-white">
                {avatarInitial}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              <p className="text-zinc-500 text-xs truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}