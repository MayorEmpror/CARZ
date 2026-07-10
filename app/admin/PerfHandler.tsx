"use client";

import { useState } from "react";
import type { Car_Perf } from "@/lib/types";
import { MoreHorizontal } from "lucide-react";

type Props = {
  initialPerfMetric: Car_Perf[];
};

export default function CarTab({ initialPerfMetric }: Props) {
  const [cars, setCars] = useState<Car_Perf[]>(initialPerfMetric);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Vehicle Performance
          </h1>

          <p className="text-neutral-500 text-sm mt-1">
            {cars.length} performance records
          </p>
        </div>
      </div>


      <div className="border-t border-zinc-800">

        {cars.map((perf, idx) => (
          <PerformanceRow
            key={perf.car_id}
            perf={perf}
            index={idx + 1}
            hovered={hoveredId === perf.car_id}
            onHover={() => setHoveredId(perf.car_id)}
            onLeave={() => setHoveredId(null)}
          />
        ))}

      </div>


      {cars.length === 0 && (
        <p className="text-neutral-500 text-sm mt-6">
          No performance data found.
        </p>
      )}

    </div>
  );
}


function PerformanceRow({
  perf,
  index,
  hovered,
  onHover,
  onLeave,
}: {
  perf: Car_Perf;
  index: number;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {

  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        grid 
        grid-cols-[40px_140px_1fr_160px_160px_140px_40px]
        items-center
        gap-4
        px-2
        py-4
        border-b
        border-zinc-800
        transition-colors
        ${hovered ? "bg-zinc-900" : ""}
      `}
    >

      {/* Index */}
      <span className="text-neutral-500 text-sm">
        {index}
      </span>


      {/* Car ID */}
      <span className="font-mono text-sm text-neutral-400 truncate">
        car_{perf.car_id}
      </span>


      {/* Mileage */}
      <span
        className={`
          text-sm
          font-medium
          truncate
          w-fit
          px-2
          py-1
          rounded-md
          transition-colors
          ${
            hovered
              ? "border border-zinc-600 bg-zinc-800"
              : ""
          }
        `}
      >
        {perf.mileage ?? "—"} km
      </span>


      {/* Fuel */}
      <span className="text-neutral-300 text-sm truncate">
        Fuel:
        <span className="ml-1 text-white">
          {perf.fuel_efficiency ?? "—"}
        </span>
      </span>


      {/* Engine */}
      <span className="text-neutral-300 text-sm truncate">
        Engine:
        <span className="ml-1 text-white">
          {perf.engine_power ?? "—"}%
        </span>
      </span>


      {/* Maintenance */}
      <span className="text-neutral-300 text-sm truncate">
        Service:
        <span className="ml-1 text-white">
          {perf.fuel_efficiency ?? "—"}
        </span>
      </span>


      {/* Actions */}
      <button
        className="
          justify-self-end
          text-neutral-500
          hover:text-white
          transition-colors
        "
      >
        <MoreHorizontal size={18}/>
      </button>

    </div>
  );
}