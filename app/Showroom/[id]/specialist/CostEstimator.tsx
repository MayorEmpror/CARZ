"use client";

import { useMemo, useState } from "react";

type CarPerf = {
  make: string;
  model: string;
  price: number;
  rating: number;
  rating_count: number;
  top_speed: number;
  acceleration_0_100: number;
  engine_power: number;
  torque: number;
  fuel_efficiency: number;
};

const SERVICES = [
  { id: "diagnostic", label: "Diagnostic Check", base: 40, powerFactor: 0.02 },
  { id: "oil_change", label: "Oil & Filter Change", base: 55, powerFactor: 0.03 },
  { id: "brake", label: "Brake Inspection", base: 90, powerFactor: 0.015 },
  { id: "engine_tune", label: "Engine Tune-up", base: 140, powerFactor: 0.08 },
  { id: "tire", label: "Tire Replacement", base: 220, powerFactor: 0.01 },
  { id: "detailing", label: "Full Detailing", base: 130, powerFactor: 0 },
] as const;

const CONDITION_MULTIPLIER = { good: 1, fair: 1.25, poor: 1.6 } as const;
const URGENCY_MULTIPLIER = { standard: 1, express: 1.35 } as const;

type ServiceId = (typeof SERVICES)[number]["id"];
type Condition = keyof typeof CONDITION_MULTIPLIER;
type Urgency = keyof typeof URGENCY_MULTIPLIER;

export default function CostEstimator({ car }: { car: CarPerf }) {
  const [serviceId, setServiceId] = useState<ServiceId>("diagnostic");
  const [mileage, setMileage] = useState(20000);
  const [condition, setCondition] = useState<Condition>("good");
  const [urgency, setUrgency] = useState<Urgency>("standard");

  const service = SERVICES.find((s) => s.id === serviceId)!;

  const estimate = useMemo(() => {
    // Base cost from service type
    let cost = service.base;

    // Scale with engine power/torque — higher-performance engines cost more to service
    const perfIndex = (car.engine_power * 0.6 + car.torque * 0.4) / 100;
    cost += perfIndex * service.powerFactor * 100;

    // Car price bracket nudges parts/labor cost (luxury parts markup)
    cost += (car.price / 10000) * 1.5;

    // Top speed / acceleration bump for engine-related services only
    if (serviceId === "engine_tune" || serviceId === "diagnostic") {
      const speedFactor = car.top_speed / 250;
      const accelFactor = 6 / Math.max(car.acceleration_0_100, 1.5);
      cost *= 1 + (speedFactor + accelFactor) * 0.15;
    }

    // Poor fuel efficiency correlates with more wear -> higher service cost
    if (car.fuel_efficiency > 0) {
      const efficiencyPenalty = Math.max(0, (12 - car.fuel_efficiency) * 1.2);
      cost += efficiencyPenalty;
    }

    // Mileage — every 10k miles adds wear cost
    cost += (mileage / 10000) * 8;

    // Condition and urgency multipliers
    cost *= CONDITION_MULTIPLIER[condition];
    cost *= URGENCY_MULTIPLIER[urgency];

    return Math.round(cost);
  }, [serviceId, mileage, condition, urgency, car, service]);

  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-3">
        Cost Estimator
      </h3>

      <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
        <div>
          <label className="text-xs text-neutral-400 block mb-1">Service</label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value as ServiceId)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-neutral-100"
          >
            {SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-neutral-400 block mb-1">
            Mileage ({mileage.toLocaleString()} mi)
          </label>
          <input
            type="range"
            min={0}
            max={150000}
            step={1000}
            value={mileage}
            onChange={(e) => setMileage(Number(e.target.value))}
            className="w-full accent-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as Condition)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-neutral-100"
            >
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Urgency</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as Urgency)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-neutral-100"
            >
              <option value="standard">Standard</option>
              <option value="express">Express</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
          <span className="text-xs text-neutral-400">Estimated Cost</span>
          <span className="text-lg font-semibold text-white">${estimate}</span>
        </div>
      </div>
    </div>
  );
}