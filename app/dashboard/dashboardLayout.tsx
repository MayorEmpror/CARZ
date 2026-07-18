"use client";
import Sidebar from "@/components/DashboardSideBar";
import { NavItem, Sales, Car, User, Payment } from "@/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CustomerTab from "@/components/CustomersHandler"
import SalesTab from "./Handlers/SalesTab"
import  PaymentsTab from "./Handlers/PaymentsTsb"
import Profile from "./Handlers/Profiles"
import CarTab from "../admin/CarHandlers/CarHandler";

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

export default function DashboardLayout ({
  initialCars,
  sales,
  customers,
  payments,
  user,
}: {
  initialCars: Car[]  ;
  sales: Sales[]  ;
  customers: User[] ;
  payments: Payment[] ;
  user : User;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const router = useRouter()
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
          brandName={user.full_name}
          brandSubtitle="Fleet Manager"
          user={{ name: "Admin User", email: "admin@fleet.com" }}
          onSettingsClick={() => router.push("/settings")}
          onLogoutClick={handleLogout}
        />

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "cars" && <CarTab initialCars={initialCars} />}
          {activeTab === "customers" && (
            <CustomerTab initialCustomers={customers} />
          )}
          {activeTab === "sales" && <SalesTab sales={sales} />}
          {activeTab === "payments" && <PaymentsTab payments ={payments}/>}
          {activeTab === "profile" && (
            <Profile/>
          )}
        </div>
      </div>
    </div>
  );
}
