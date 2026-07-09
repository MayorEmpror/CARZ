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
    <div className="rounded-2xl bg-neutral-900 p-5">
      <div className="mb-5 flex h-14 items-end gap-[3px]">
        {BAR_HEIGHTS.map((h, i) => {
          const barPct = (i / (BAR_HEIGHTS.length - 1)) * 100;
          const inRange = barPct >= minPct && barPct <= maxPct;
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-colors ${
                inRange ? "bg-white" : "bg-neutral-700"
              }`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>

      <div className="relative flex h-5 items-center">
        <div className="absolute h-[3px] w-full rounded-full bg-neutral-700" />
        <div
          className="absolute h-[3px] rounded-full bg-white"
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
          className="range-thumb pointer-events-none absolute h-5 w-full appearance-none bg-transparent"
          style={{ zIndex: minPct > 90 ? 5 : 3 }}
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
          className="range-thumb pointer-events-none absolute h-5 w-full appearance-none bg-transparent"
          style={{ zIndex: 4 }}
        />
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs">
        <div className="flex-1 rounded-lg bg-neutral-800 px-2.5 py-1.5">
          <div className="text-[10px] uppercase text-neutral-500">From</div>
          <div className="font-medium text-white">${range[0].toFixed(2)}</div>
        </div>
        <div className="flex-1 rounded-lg bg-neutral-800 px-2.5 py-1.5">
          <div className="text-[10px] uppercase text-neutral-500">To</div>
          <div className="font-medium text-white">${range[1].toFixed(2)}</div>
        </div>
      </div>

      <style jsx>{`
        .range-thumb::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.4);
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          width: 12px;
          height: 12px;
          border: none;
          border-radius: 9999px;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.4);
        }
        .range-thumb::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}