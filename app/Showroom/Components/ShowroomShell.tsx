"use client";

import { useRouter, usePathname } from "next/navigation";
import { Car, MessageSquare, Settings, HandCoins, MapPinSearch} from "lucide-react";
import Sidebar from "@/components/DashboardSideBar";
import { NavItem } from "@/lib/types";

type Tab = "cars" | "chat" | "settings" | "hire" | "rent";

const navItems: NavItem<Tab>[] = [
  { tab: "cars", label: "Cars", icon: Car },
  { tab: "hire", label: "Hire Driver", icon: MapPinSearch },
  { tab: "chat", label: "My Chat", icon: MessageSquare },
  { tab: "rent", label: "Rent", icon: HandCoins },
  { tab: "settings", label: "Settings", icon: Settings },
];
export default function ShowroomShell({
  activeTab,
  children,
  user,
}: {
  activeTab: Tab;
  children: React.ReactNode;
  user?: any
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  function setActiveTab(tab: Tab) {
    if (tab === "chat") {
      router.push("/chat");
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
        brandName="Customer Panel"
        brandSubtitle={String(user.role).charAt(0).toUpperCase() + String(user.role).slice(1)}
        user={{ name: user.full_name, email: user.emal }}
        onSettingsClick={() => router.push("/settings")}
        onLogoutClick={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
}