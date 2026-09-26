import { carDetails } from "@/lib/api/car";
import CarHeader from "../CarHeader"
import CostEstimator from "./CostEstimator";

const specialists = [
  { name: "James Carter", role: "Engine Specialist", rating: 4.9, rate: "$85/hr" },
  { name: "Aisha Patel", role: "Bodywork & Paint", rating: 4.7, rate: "$70/hr" },
  { name: "Marco Rossi", role: "Electrical Systems", rating: 4.8, rate: "$90/hr" },
  { name: "Sofia Nguyen", role: "Transmission", rating: 4.6, rate: "$80/hr" },
  { name: "Daniel Osei", role: "Suspension & Handling", rating: 4.8, rate: "$75/hr" },
  { name: "Liam O'Connor", role: "Diagnostics", rating: 4.9, rate: "$65/hr" },
  { name: "Priya Sharma", role: "Detailing", rating: 4.5, rate: "$55/hr" },
];

export default async function CarDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const carperf = await carDetails(id);
  if (!carperf) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B10] text-white text-2xl">
        Car not found
      </div>
    );
  }

  const {
    make,
    model,
    price,
    rating,
    rating_count,
    top_speed,
    acceleration_0_100,
    engine_power,
    torque,
    fuel_efficiency,
    model_path,
  } = carperf;

  return (
    <div className="min-h-screen bg-[#0B0B10] text-white flex">
      <div className="flex-1">
        <CarHeader model_path={model_path} id={id} mode="wireframe" />
      </div>

      <aside className="w-80 shrink-0 border-l border-white/10 p-4 space-y-6 bg-white/5 backdrop-blur-md overflow-y-auto">
        <CostEstimator
          car={{
            make,
            model,
            price,
            rating,
            rating_count,
            top_speed,
            acceleration_0_100,
            engine_power,
            torque,
            fuel_efficiency,
          }}
        />

        <div>
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-3">
            Specialists
          </h3>
          <div className="space-y-3">
            {specialists.map((s) => (
              <div
                key={s.name}
                className="p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-neutral-400">{s.role}</p>
                <div className="flex justify-between items-center mt-2 text-xs text-neutral-300">
                  <span>★ {s.rating}</span>
                  <span>{s.rate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}