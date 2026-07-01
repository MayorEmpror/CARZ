"use client";

import { ChevronDown, Map } from "lucide-react";

export default function CarGridHeader({ count }: { count: number }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-neutral-900">
        {count} vehicles to rent
      </h1>

      <div className="flex items-center gap-4 text-sm">
        <button className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900">
          Closest to me
          <ChevronDown className="h-4 w-4" />
        </button>
        <button className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-neutral-600 hover:bg-neutral-50">
          <Map className="h-4 w-4" />
          Show map
        </button>
      </div>
    </div>
  );
}