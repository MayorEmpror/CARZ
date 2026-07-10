"use client";
import { Car } from "@/lib/types";
import { User } from "@/lib/types";
import {Car_Perf} from "@/lib/types"
import { useState } from "react";
import CarTab from "./CarHandlers/CarHandler";
import CustomerTab from "./CustomersHandler";
import { OwnerTab } from "./OwnersHandler";
import AddCar from "./AddCar";
import Sidebar from "./sidebar"
import PerformanceHandler from "./Perf/PerfHandler"


import {
  Menu,
  Car as CarIcon,
  Globe,
  User as UserIcon,
  HelpCircle,
  Check,
} from "lucide-react";

type Tab = "cars" | "customers" | "owners" | "addcar" | "Performance";

/* ---------------- TOP NAVBAR ---------------- */
function TopNavbar() {
  return (
    <div className="flex items-center justify-between bg-black border-b border-zinc-800 px-6 py-3">
      {/* Left: logo + menu */}
      <div className="flex items-center gap-4">
        <span className="text-2xl font-bold tracking-widest">IN</span>
        <Menu className="w-5 h-5 cursor-pointer text-white/80 hover:text-white" />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-6 text-sm text-white/80">
        <div className="flex items-center gap-2 cursor-pointer hover:text-white">
          <CarIcon className="w-4 h-4" />
          <span>Manage bookings</span>
        </div>
        <div className="flex items-center gap-1 cursor-pointer hover:text-white">
          <Globe className="w-4 h-4" />
          <span>English | €</span>
        </div>
        <div className="flex items-center gap-2 cursor-pointer hover:text-white">
          <UserIcon className="w-4 h-4" />
          <span>Login</span>
        </div>
        <div className="flex items-center gap-2 cursor-pointer hover:text-white">
          <HelpCircle className="w-4 h-4" />
          <span>Help</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STEP HEADER BAR ---------------- */
type Step = {
  number: number;
  label: string;
  value: string;
  completed?: boolean;
  faded?: boolean;
};

function StepHeaderBar() {
  const steps: Step[] = [
    { number: 1, label: "RENTAL INFORMATION", value: "Wed, Feb 07, 11:00 AM → Wed, Feb 14, 10:00 AM", completed: true },
    { number: 2, label: "PICK UP & DROP OFF", value: "Munich Airport", completed: true },
    { number: 3, label: "RETURN STATION", value: "Hamburg-Eppendorf", completed: true },
    { number: 4, label: "VEHICLE", value: "Choose" },
    { number: 5, label: "ADDITIONAL PRODUCTS", value: "Choose", faded: true },
    { number: 6, label: "TOTAL", value: "00,00 €" },
  ];

  return (
    <div className="flex bg-zinc-950 border-b border-zinc-800">
      {steps.map((step, idx) => (
        <div
          key={step.number}
          className={`relative px-5 py-3 ${
            idx === 0 ? "flex-2" : "flex-1"
          } ${idx !== steps.length - 1 ? "border-r border-zinc-800" : ""}`}
        >
          {/* faint background number */}
          <span className="absolute -bottom-1 left-1 text-5xl font-bold text-zinc-800/60 select-none pointer-events-none">
            {step.number}
          </span>

          <div className="relative flex items-center justify-between">
            <span
              className={`text-[11px] font-semibold tracking-wide ${
                step.faded ? "text-zinc-500" : "text-zinc-300"
              }`}
            >
              {step.label}
            </span>
            {step.completed && (
              <Check className="w-3.5 h-3.5 text-white/70" />
            )}
          </div>

          <div
            className={`relative mt-1 text-sm font-medium ${
              step.faded ? "text-zinc-500" : "text-white"
            } ${idx === 0 ? "truncate" : ""}`}
          >
            {step.value}
          </div>
        </div>
      ))}
    </div>
  );
}
/* ---------------- ADMIN LAYOUT ---------------- */
export default function AdminLayout({
  initialCars,
  initialCust,
  initialOnwers,
  initialPerfMetric,
}: {
  initialCars: Car[];
  initialCust: User[];
  initialOnwers: User[];
  initialPerfMetric: Car_Perf[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("cars");

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* HEADERS */}
      <TopNavbar />
      <StepHeaderBar />

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
         />

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "cars" && <CarTab initialCars={initialCars} />}
          {activeTab === "customers" &&  <CustomerTab initialCustomers={initialCust} /> }
          {activeTab === "owners" &&  <OwnerTab initialOnwers={initialOnwers} />}
          {activeTab === "addcar" && <AddCar />}
          {activeTab === "Performance" && <PerformanceHandler  initialPerfMetric={initialPerfMetric} />}
        </div>
      </div>
    </div>
  );
}