"use client";
import { useState } from "react";
import { ChevronDown, ArrowUpDown } from "lucide-react";

type SortOption =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

const sortLabels: Record<SortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A-Z",
  "name-desc": "Name: Z-A",
};

function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (val: SortOption) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-200">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
      >
        <ArrowUpDown className="w-4 h-4 text-zinc-400" />
        <span>{sortLabels[value]}</span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          {/* backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-20 overflow-hidden">
            {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  value === opt
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {sortLabels[opt]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- USAGE IN HEADER ---------------- */
export default function VehiclesHeader({ cars }: { cars: any[] }) {
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  return (
    <div className="max-w-7xl mx-auto w-full pl-4 pr-4 flex items-center justify-between">
      <div>
        <h1 className="text-white text-2xl font-semibold">Manage Vehicles</h1>
        <p className="text-neutral-500 text-sm mt-1">
          {cars.length} vehicles in the fleet
        </p>
      </div>

      <SortDropdown value={sortBy} onChange={setSortBy} />
    </div>
  );
}