"use client";

import { useMemo, useState } from "react";

type Props = {
  min: number;
  max: number;
  onChange?: (range: [number, number]) => void;
};

// Purely decorative bar heights, seeded so they don't reshuffle on re-render
const BAR_HEIGHTS = [
  20, 35, 55, 70, 90, 100, 85, 60, 40, 30, 45, 65, 80, 95, 75, 50, 35, 25, 15,
  10, 20, 30, 45, 60, 40, 20,
];

export default function PriceRangeSlider({ min, max, onChange }: Props) {
  const [range, setRange] = useState<[number, number]>([min, max]);

  const handleChange = (next: [number, number]) => {
    setRange(next);
    onChange?.(next);
  };

  const minPct = useMemo(
    () => ((range[0] - min) / (max - min)) * 100,
    [range, min, max]
  );
  const maxPct = useMemo(
    () => ((range[1] - min) / (max - min)) * 100,
    [range, min, max]
  );

  return (
    <div>
      <div className="mb-2 flex h-14 items-end gap-[3px]">
        {BAR_HEIGHTS.map((h, i) => {
          const barPct = (i / (BAR_HEIGHTS.length - 1)) * 100;
          const inRange = barPct >= minPct && barPct <= maxPct;
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm ${
                inRange ? "bg-neutral-800" : "bg-neutral-200"
              }`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>

      <div className="relative h-4">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-neutral-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-800"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={range[0]}
          onChange={(e) => {
            const val = Math.min(Number(e.target.value), range[1] - 1);
            handleChange([val, range[1]]);
          }}
          className="range-thumb pointer-events-none absolute top-1/2 h-4 w-full -translate-y-1/2 appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={range[1]}
          onChange={(e) => {
            const val = Math.max(Number(e.target.value), range[0] + 1);
            handleChange([range[0], val]);
          }}
          className="range-thumb pointer-events-none absolute top-1/2 h-4 w-full -translate-y-1/2 appearance-none bg-transparent"
        />
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <div className="flex-1 rounded-lg border border-neutral-200 px-2.5 py-1.5">
          <div className="text-[10px] uppercase text-neutral-400">From</div>
          <div className="font-medium">${range[0].toFixed(2)}</div>
        </div>
        <div className="flex-1 rounded-lg border border-neutral-200 px-2.5 py-1.5">
          <div className="text-[10px] uppercase text-neutral-400">To</div>
          <div className="font-medium">${range[1].toFixed(2)}</div>
        </div>
      </div>

      {/* Thumb styling — appended once globally in app/globals.css:
         .range-thumb::-webkit-slider-thumb { pointer-events: auto; ... }
      */}
    </div>
  );
}