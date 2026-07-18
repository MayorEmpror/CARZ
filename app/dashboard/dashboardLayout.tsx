"use Client";
import Sidebar from "@/components/DashboardSideBar";
import { NavItem, Sales, Car, User, Payment } from "@/lib/types";
import { useState } from "react";
import {
    Menu,
    Car as CarIcon,
    Globe,
    User as UserIcon,
    HelpCircle,
    Check,
    ClipboardPen,
    PlusCircle,
    UserCog,
    Users,
  } from "lucide-react";
  

type Tab = "cars" | "customers" | "sales" | "payments" | "profile";

export default function ({
  initialCars,
  sales,
  payments,
}: {
  initialCars: Car[];
  sales: Sales[];
  payments: Payment[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const handleLogout = () => {
    console.log("handle admin logout here ");
  };
  const navItems: NavItem<Tab>[] = [
    { tab: "cars", label: "Cars", icon: CarIcon },
    { tab: "customers", label: "Customers", icon: Users },
    { tab: "sales", label: "Owners", icon: UserCog },
    { tab: "profile", label: "Add Car", icon: PlusCircle },
    { tab: "payments", label: "Performance", icon: ClipboardPen },
  ];
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* HEADERS */}
      {/* <TopNavbar /> */}
      {/* <StepHeaderBar /> */}

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
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

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "cars" && <CarTab initialCars={initialCars} />}
          {activeTab === "customers" && (
            <CustomerTab initialCustomers={initialCust} />
          )}
          {activeTab === "owners" && <OwnerTab initialOnwers={initialOnwers} />}
          {activeTab === "addcar" && <AddCar />}
          {activeTab === "Performance" && (
            <PerformanceHandler
              withoutperf={withoutperf}
              initialPerfMetric={initialPerfMetric}
            />
          )}
        </div>
      </div>
    </div>
  );
}
