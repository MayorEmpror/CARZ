"use client";

import { useRouter, usePathname } from "next/navigation";
import { Car, MessageSquare, Settings } from "lucide-react";
import Sidebar from "@/components/DashboardSideBar";
import { NavItem } from "@/lib/types";

type Tab = "cars" | "chat" | "settings";

const navItems: NavItem<Tab>[] = [
  { tab: "cars", label: "Cars", icon: Car },
  { tab: "chat", label: "Chat", icon: MessageSquare },
  { tab: "settings", label: "Settings", icon: Settings },
];
export default function ShowroomShell({
  activeTab,
  children,
}: {
  activeTab: Tab;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function setActiveTab(tab: Tab) {
    if (tab === "settings") {
      router.push("/settings");
      return;
    }
    router.push(`${pathname}?tab=${tab}`);
  }

  function handleLogout() {
    router.push("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={navItems}
        brandName="Admin Panel"
        brandSubtitle="Fleet Manager"
        user={{ name: "Admin User", email: "admin@fleet.com" }}
        onSettingsClick={() => router.push("/settings")}
        onLogoutClick={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
}