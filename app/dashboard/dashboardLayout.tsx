"use client";
import Sidebar from "@/components/DashboardSideBar";
import { NavItem, Sales, Car, User, Payment, CarDetails } from "@/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CustomerTab from "@/components/CustomersHandler"
import SalesTab from "./sales/SalesTab"
import  PaymentsTab from "./Handlers/PaymentsTsb"
import Profile from "./Handlers/Profiles"
import CarTab from "../admin/CarHandlers/CarHandler";
import AddCar from "../admin/AddCar";
import ManageCars from "./managecars/ManageCars"

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
    Wrench
  } from "lucide-react";
  

type Tab = "cars" | "customers" | "sales" | "payments" | "profile" | "addcar" | "manage_cars";

export default function DashboardLayout ({
  initialCars,
  sales,
  customers,
  payments,
  user,
  carswithperf,

}: {
  initialCars: Car[]  ;
  sales: Sales[]  ;
  customers: User[] ;
  payments: Payment[] ;
  user : User;
    carswithperf: CarDetails[];

}) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const router = useRouter()
  async function handleLogout ()  {
    const response = await fetch(
        "/api/auth/logout",
        {
            method:"POST"
        }
    );


    const result = await response.json();


    if(result.success){
      router.push("/login");
      router.refresh();
    }
    return 
  };
  const navItems: NavItem<Tab>[] = [
    { tab: "cars", label: "Cars", icon: CarIcon },
    { tab: "customers", label: "Customers", icon: Users },
    { tab: "sales", label: "sales", icon: UserCog },
    { tab: "profile", label: "profile", icon: PlusCircle },
    { tab: "payments", label: "payments", icon: ClipboardPen },
    { tab: "addcar", label: "AddCar", icon: PlusCircle },
    { tab : "manage_cars", label : "manage", icon: Wrench},
  ];
   console.log("user id : " + user.user_id)
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
          {activeTab === "profile" && <Profile user={user} />}
          {activeTab === "addcar" &&  <AddCar user_id = {user.user_id}/>}
          {activeTab === "manage_cars" &&  <ManageCars user_id = {user.user_id} carswithperf={carswithperf}/>}
        </div>
      </div>
    </div>
  );
}
