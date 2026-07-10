"use client";

import { useState } from "react";
import type { Car_Perf } from "@/lib/types";
import { MoreHorizontal, Gauge, Fuel, Wrench, Zap } from "lucide-react";
import { Plus } from "lucide-react";

type Props = {
  initialPerfMetric: Car_Perf[];
};

export default function CarTab({ initialPerfMetric }: Props) {
  const [cars] = useState<Car_Perf[]>(initialPerfMetric);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="text-white p-6">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">

<div>
  <h1 className="text-2xl font-semibold">
    Vehicle Performance
  </h1>

  <p className="text-neutral-500 text-sm mt-1">
    {cars.length} performance records
  </p>
</div>


<button
  className="
    flex
    items-center
    gap-2
    rounded-lg
    bg-white
    text-black
    px-4
    py-2
    text-sm
    font-medium
    hover:bg-neutral-200
    transition
  "
>
  <Plus size={16} />
  Add Performance
</button>

</div>


      <div className="space-y-3">

        {cars.map((perf, idx) => (
          <PerformanceCard
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


function PerformanceCard({
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
        rounded-xl
        border
        border-zinc-800
        p-4
        transition
        ${
          hovered
            ? "bg-zinc-900"
            : "bg-zinc-950"
        }
      `}
    >

      {/* Top section */}
      <div className="flex items-center justify-between mb-4">

        <div className="flex items-center gap-4">

          <span className="text-neutral-600 text-sm">
            #{index}
          </span>


          <div>
            <p className="font-mono text-sm text-neutral-400">
              car_{perf.car_id}
            </p>

            <p className="text-xs text-neutral-500 mt-1">
              {perf.created_at ?? "No date"}
            </p>
          </div>

        </div>


        <button
          className="
            text-neutral-500
            hover:text-white
            transition
          "
        >
          <MoreHorizontal size={20}/>
        </button>

      </div>



      {/* Main stats */}
      <div className="
        grid
        grid-cols-2
        md:grid-cols-4
        gap-3
      ">

        <Stat
          icon={<Gauge size={15}/>}
          label="Mileage"
          value={`${perf.mileage ?? "—"} km`}
        />


        <Stat
          icon={<Fuel size={15}/>}
          label="Fuel Efficiency"
          value={perf.fuel_efficiency ?? "—"}
        />


        <Stat
          icon={<Zap size={15}/>}
          label="Engine"
          value={`${perf.engine_power ?? "—"}%`}
        />


        <Stat
          icon={<Wrench size={15}/>}
          label="Service"
          value={perf.fuel_efficiency ?? "—"}
        />

      </div>



      {/* Performance metrics */}
      <div className="
        mt-4
        pt-4
        border-t
        border-zinc-800
        grid
        grid-cols-2
        md:grid-cols-4
        gap-3
      ">

        <Metric
          label="Top Speed"
          value={`${perf.top_speed ?? "—"} km/h`}
        />


        <Metric
          label="Torque"
          value={`${perf.torque ?? "—"} Nm`}
        />


        <Metric
          label="0-100"
          value={`${perf.acceleration_0_100 ?? "—"} sec`}
        />

      </div>


    </div>
  );
}



function Stat({
  icon,
  label,
  value,
}:{
  icon: React.ReactNode;
  label:string;
  value:string | number;
}){

  return (
    <div className="
      flex
      items-center
      gap-3
      rounded-lg
      bg-zinc-900
      p-3
    ">

      <div className="text-neutral-400">
        {icon}
      </div>

      <div>
        <p className="text-xs text-neutral-500">
          {label}
        </p>

        <p className="text-sm font-medium">
          {value}
        </p>
      </div>

    </div>
  );
}



function Metric({
  label,
  value,
}:{
  label:string;
  value:string;
}){

  return (
    <div>
      <p className="text-xs text-neutral-500">
        {label}
      </p>

      <p className="text-sm text-white mt-1">
        {value}
      </p>
    </div>
  );
}