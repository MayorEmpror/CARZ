"use client";
import { Car } from "@/lib/types";
import { User } from "@/lib/types";
import { useState } from "react";
import CarTab from "./CarHandlers/CarHandler";
import CustomerTab from "./CustomersHandler";
import {OwnerTab} from "./OwnersHandler"
import AddCar from "./AddCar"

type Tab = "cars" | "customers" | "owners" | "addcar";

export default function AdminLayout({
  initialCars,
  initialCust,
  initialOnwers,
}: {
  initialCars: Car[];
  initialCust : User[];
  initialOnwers : User[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("cars");

  return (
    <div className="flex h-screen bg-black text-white">
      
      {/* SIDEBAR */}
      <div className="w-54 bg-zinc-900 border-r border-zinc-800 p-4">
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
        <button
          onClick={() => setActiveTab("owners")}
          className={`block w-full text-left p-3 rounded mt-2 ${
            activeTab === "owners" ? "bg-zinc-700" : "hover:bg-zinc-800"
          }`}
        >
          Owners
        </button>

        <button
          onClick={() => setActiveTab("addcar")}
          className={`block w-full text-left p-3 rounded mt-2 ${
            activeTab === "addcar" ? "bg-zinc-700" : "hover:bg-zinc-800"
          }`}
        >
          AddCars
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 ">
        {activeTab === "cars" && (
          <CarTab initialCars={initialCars} />
        )}

        {activeTab === "customers" && (
           <CustomerTab initialCustomers={initialCust} />
        )
         }

        {activeTab === "owners" && (
           <OwnerTab initialOnwers={initialOnwers} />
        )
         }
          {activeTab === "addcar" && (
           <AddCar  />
        )
         }
      </div>
    </div>
  );
}