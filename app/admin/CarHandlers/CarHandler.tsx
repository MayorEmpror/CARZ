"use client";

import { useState } from "react";
import type { Car } from "@/lib/types";
import { CarCard } from "./carcard";

export default function CarTab({ initialCars }: { initialCars: Car[] }) {
  const [cars, setCars] = useState(initialCars);

  function handleCarUpdate(updated: Car) {
    setCars((prev) => prev.map((c) => (c.car_id === updated.car_id ? updated : c)));
  }

  return (
    <div className="h-full flex flex-col bg-[#0B0B10]">
      <div className="shrink-0 p-6 lg:p-4 pb-4">
        <div className="max-w-7xl mx-auto w-full">
          <h1 className="text-white text-2xl font-semibold">Manage Vehicles</h1>
          <p className="text-neutral-500 text-sm mt-1">{cars.length} vehicles in the fleet</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-8 pt-2">
        <div className="max-w-8xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {cars.map((car) => (
              <CarCard key={car.car_id} car={car} onUpdate={handleCarUpdate} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}