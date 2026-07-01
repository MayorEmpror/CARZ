"use client";

import { useState } from "react";
import PriceRangeSlider from "@/components/PriceRangeSlider";
import {
  CheckboxRow,
  CollapsibleSection,
  SegmentedControl,
  ToggleSwitch,
} from "./FilterPrimitives";

const BODY_TYPES = [
  "Sedan",
  "Wagon",
  "Coupe",
  "Hatchback",
  "Pickup",
  "Sport coupe",
  "Crossover",
  "Van",
];

const FUEL_TYPES = ["Gasoline", "Flex Fuel (E85)", "Diesel", "Hybrid", "Electric", "Hydrogen", "Other"];

export type CarFilters = {
  rentalType: string;
  availableOnly: boolean;
  priceRange: [number, number];
  bodyTypes: string[];
  transmission: string;
  fuelTypes: string[];
};

export const DEFAULT_FILTERS: CarFilters = {
  rentalType: "Per hour",
  availableOnly: false,
  priceRange: [19, 98.5],
  bodyTypes: ["Sedan", "Coupe", "Hatchback", "Crossover", "Van"],
  transmission: "Any",
  fuelTypes: ["Gasoline", "Flex Fuel (E85)", "Electric"],
};

export default function FilterPanel({
  onChange,
}: {
  onChange?: (filters: CarFilters) => void;
}) {
  const [filters, setFilters] = useState<CarFilters>(DEFAULT_FILTERS);

  const update = (patch: Partial<CarFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    onChange?.(next);
  };

  const toggleInArray = (key: "bodyTypes" | "fuelTypes", value: string) => {
    const set = new Set(filters[key]);
    set.has(value) ? set.delete(value) : set.add(value);
    update({ [key]: Array.from(set) } as Partial<CarFilters>);
  };

  const resetAll = () => {
    setFilters(DEFAULT_FILTERS);
    onChange?.(DEFAULT_FILTERS);
  };

  return (
    <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filter by</h2>
        <button
          onClick={resetAll}
          className="text-xs text-neutral-400 hover:text-neutral-700"
        >
          Reset all ✕
        </button>
      </div>

      <div className="border-b border-neutral-100 pb-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Rental type
        </div>
        <SegmentedControl
          options={["Any", "Per day", "Per hour"]}
          value={filters.rentalType}
          onChange={(v) => update({ rentalType: v })}
        />
      </div>

      <div className="flex items-center justify-between border-b border-neutral-100 py-3">
        <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Available now only
        </span>
        <ToggleSwitch
          checked={filters.availableOnly}
          onChange={(v) => update({ availableOnly: v })}
        />
      </div>

      <div className="border-b border-neutral-100 py-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Price range / hour
        </div>
        <PriceRangeSlider
          min={19}
          max={98.5}
          onChange={(range) => update({ priceRange: range })}
        />
      </div>

      <CollapsibleSection title="Car brand">
        <p className="text-sm text-neutral-400">All brands</p>
      </CollapsibleSection>

      <CollapsibleSection title="Car model & year">
        <p className="text-sm text-neutral-400">All models</p>
      </CollapsibleSection>

      <CollapsibleSection title="Body type" defaultOpen>
        <div className="grid grid-cols-2 gap-x-2">
          {BODY_TYPES.map((type) => (
            <CheckboxRow
              key={type}
              label={type}
              checked={filters.bodyTypes.includes(type)}
              onChange={() => toggleInArray("bodyTypes", type)}
            />
          ))}
        </div>
      </CollapsibleSection>

      <div className="border-b border-neutral-100 py-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Transmission
        </div>
        <SegmentedControl
          options={["Any", "Automatic", "Manual"]}
          value={filters.transmission}
          onChange={(v) => update({ transmission: v })}
        />
      </div>

      <CollapsibleSection title="Fuel type" defaultOpen>
        <div className="grid grid-cols-2 gap-x-2">
          {FUEL_TYPES.map((type) => (
            <CheckboxRow
              key={type}
              label={type}
              checked={filters.fuelTypes.includes(type)}
              onChange={() => toggleInArray("fuelTypes", type)}
            />
          ))}
        </div>
      </CollapsibleSection>
    </aside>
  );
}