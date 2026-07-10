import { useState } from "react";
import type { Named_Car_Perf } from "@/lib/types";
import { Field, inputClass, PerfModalShell } from "./PerfModalShell";
import { Car } from "@/lib/types";

type NewPerfData = Omit<Partial<Named_Car_Perf>, "car_id" | "created_at">;

type AddPerfFormProps = {
  onCancel: () => void;
  onSave: () => void;
  carwithoutperf: Car[];
};

const EMPTY: NewPerfData = {
  brand: "",
  car_name: "",
  mileage: undefined,
  fuel_efficiency: 0,
  engine_power: undefined,
  top_speed: undefined,
  torque: undefined,
  acceleration_0_100: undefined,
};

export function AddPerfForm({ onCancel, onSave,carwithoutperf }: AddPerfFormProps) {
  const [data, setData] = useState<NewPerfData>(EMPTY);
  const [Carwithoutperf] = useState<Car[]>(carwithoutperf)

  function setField<K extends keyof NewPerfData>(
    field: K,
    value: NewPerfData[K],
  ) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    // Frontend only — wire this up to a real create call later.
    onSave();
  }

  return (
    <PerfModalShell
      title="Add performance record"
      onCancel={onCancel}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-neutral-400 hover:text-white transition-colors px-3 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-violet-300 hover:bg-violet-400 text-black text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Add record
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-3 pb-5"
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand">
            <select
              value={data.brand ?? ""}
              onChange={(e) => setField("brand", e.target.value)}
              className={inputClass}
            >
              <option value="">Select a brand</option>
              {Carwithoutperf.map((brand, key) => (
                <option key={key} value={String(brand.make)}>
                  {String(brand.make)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Model">
            <input
              value={data.car_name ?? ""}
              onChange={(e) => setField("car_name", e.target.value)}
              className={inputClass}
              placeholder="Supra"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Mileage (km)">
            <input
              type="number"
              value={data.mileage ?? ""}
              onChange={(e) => setField("mileage", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Fuel efficiency">
            <input
              value={data.fuel_efficiency ?? ""}
              onChange={(e) =>
                setField("fuel_efficiency", Number(e.target.value))
              }
              className={inputClass}
              placeholder="14 km/l"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Engine power (%)">
            <input
              type="number"
              value={data.engine_power ?? ""}
              onChange={(e) => setField("engine_power", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Top speed (km/h)">
            <input
              type="number"
              value={data.top_speed ?? ""}
              onChange={(e) => setField("top_speed", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Torque (Nm)">
            <input
              type="number"
              value={data.torque ?? ""}
              onChange={(e) => setField("torque", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="0-100 (sec)">
            <input
              type="number"
              step="0.1"
              value={data.acceleration_0_100 ?? ""}
              onChange={(e) =>
                setField("acceleration_0_100", Number(e.target.value))
              }
              className={inputClass}
            />
          </Field>
        </div>
      </form>
    </PerfModalShell>
  );
}
