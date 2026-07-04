"use client";

import { useState } from "react";
import CarTab from "./CarHandler";
import CustomerTab from "./CustomersHandler";

type Tab = "cars" | "customers";

export default function AdminLayout({
  initialCars,
}: {
  initialCars: any[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("cars");

  return (
    <div className="flex h-screen bg-black text-white">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-4">
        <h1 className="text-xl font-bold mb-6">Admin Panel</h1>

        <button
          onClick={() => setActiveTab("cars")}
          className={`block w-full text-left p-3 rounded ${
            activeTab === "cars" ? "bg-zinc-700" : "hover:bg-zinc-800"
          }`}
        >
          Cars
        </button>

        <button
          onClick={() => setActiveTab("customers")}
          className={`block w-full text-left p-3 rounded mt-2 ${
            activeTab === "customers" ? "bg-zinc-700" : "hover:bg-zinc-800"
          }`}
        >
          Customers
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 p-6">
        {activeTab === "cars" && (
          <CarTab initialCars={initialCars} />
        )}

        {activeTab === "customers" && <CustomerTab />}
      </div>
    </div>
  );
}