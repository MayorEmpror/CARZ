import { useState } from "react";
import type { Named_Car_Perf } from "@/lib/types";
import { Field, inputClass, PerfModalShell } from "./PerfModalShell";
import { Car, AddPerfFormData } from "@/lib/types";
import { AddCarPerformance } from "@/lib/api/carperf";

type AddPerfFormProps = {
  onCancel: () => void;
  onSave: () => void;
  carwithoutperf: Car[];
};

const EMPTY: AddPerfFormData = {
  car_id: 0,
  mileage: 0,
  fuel_efficiency: 0,
  engine_power: 0,
  top_speed: 0,
  torque: 0,
  acceleration_0_100: 0,
};

export function AddPerfForm({ onCancel, onSave, carwithoutperf }: AddPerfFormProps) {
  const [data, setData] = useState<AddPerfFormData>(EMPTY);
  const [carsWithoutPerf] = useState<Car[]>(carwithoutperf);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  function setField<K extends keyof AddPerfFormData>(
    field: K,
    value: AddPerfFormData[K],
  ) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("idle");
    console.log(data);

    if (!data.car_id) {
      setStatus("error");
      setStatusMessage("Select a car before saving.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await AddCarPerformance(data);

      if (!result.success) {
        setStatus("error");
        setStatusMessage(result.message);
        return;
      }

      setStatus("success");
      setStatusMessage(result.message);
      setData(EMPTY);
      onSave();
    } catch (err) {
      setStatus("error");
      setStatusMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
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
            disabled={submitting}
            className="text-sm text-neutral-400 hover:text-white transition-colors px-3 py-2 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-perf-form"
            disabled={submitting}
            className="bg-violet-300 hover:bg-violet-400 text-black text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding…" : "Add record"}
          </button>
        </>
      }
    >
      <form id="add-perf-form" onSubmit={handleSubmit} className="space-y-3 pb-5">
        {status === "error" && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
            {statusMessage}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand">
            <select
              value={data.car_id || ""}
              onChange={(e) => setField("car_id", Number(e.target.value))}
              className={inputClass}
            >
              <option value="" disabled>
                Select a brand
              </option>
              {carsWithoutPerf.map((brand) => (
                <option key={brand.car_id} value={brand.car_id}>
                  {brand.make}
                </option>
              ))}
            </select>
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
              type="number"
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