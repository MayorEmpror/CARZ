"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import PriceRangeSlider from "@/components/PriceRangeSlider";
import { filtersToSearchParams, searchParamsToFilters } from "./carFilters";
import {
  CheckboxRow,
  CollapsibleSection,
  SegmentedControl,
  ToggleSwitch,
} from "./FilterPrimitives";

const BODY_TYPES = ["Sedan", "SUV", "Hatchback", "Coupe", "Wagon", "Pickup", "Van", "Crossover"];
const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric", "Hydrogen", "Other"];

export type CarFilters = {
  rentalType: string;
  availableOnly: boolean;
  priceRange: [number, number];
  bodyTypes: string[];
  transmission: string;
  fuelTypes: string[];
};

export const DEFAULT_FILTERS: CarFilters = {
  rentalType: "Any",
  availableOnly: false,
  priceRange: [0, 9800000000.5],
  bodyTypes: [],
  fuelTypes: [],
  transmission: "Any",
};

export default function FilterPanel() {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<CarFilters>(() =>
    searchParamsToFilters(Object.fromEntries(searchParams.entries()))
  );
  
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const pushToUrl = (next: CarFilters) => {
    const params = filtersToSearchParams(next);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  

  const update = (patch: Partial<CarFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);

    // debounce so the slider doesn't push a URL update on every pixel of drag
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushToUrl(next), 300);
  };


  const toggleInArray = (key: "bodyTypes" | "fuelTypes", value: string) => {
    const set = new Set(filters[key]);
    set.has(value) ? set.delete(value) : set.add(value);
    update({ [key]: Array.from(set) } as Partial<CarFilters>);
  };


  const resetAll = () => {
    setFilters(DEFAULT_FILTERS);
    router.push(pathname, { scroll: false });
  };

  return (
    <aside className="w-64 shrink-0 border-r border-white/10 bg-[#131318] px-4 py-4 overflow-scroll no-scrollbar">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Filter by</h2>
        <button
          onClick={resetAll}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Reset all ✕
        </button>
      </div>

      <div className="border-b border-white/10 pb-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
          Rental type
        </div>
        <SegmentedControl
          options={["Any", "Per day", "Per hour"]}
          value={filters.rentalType}
          onChange={(v) => update({ rentalType: v })}
        />
      </div>

      <div className="flex items-center justify-between border-b border-white/10 py-3">
        <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
          Available now only
        </span>
        <ToggleSwitch
          checked={filters.availableOnly}
          onChange={(v) => update({ availableOnly: v })}
        />
      </div>

      <div className="border-b border-white/10 py-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
          Price range / hour
        </div>
        <PriceRangeSlider
          min={0}
          max={1000000000}
          onChange={(range) => update({ priceRange: range })}
        />
      </div>

      <CollapsibleSection title="Car brand">
        <p className="text-sm text-neutral-500">All brands</p>
      </CollapsibleSection>

      <CollapsibleSection title="Car model & year">
        <p className="text-sm text-neutral-500">All models</p>
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

      <div className="border-b border-white/10 py-3">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
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