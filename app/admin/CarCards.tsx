import React from "react";
import { Info, User, Briefcase } from "lucide-react";

/**
 * CarCard
 * Full-bleed image card with dark scrim, top pill badges,
 * and pricing / spec info anchored to the bottom — matching
 * the reference rental-car listing design.
 *
 * Props (car):
 *  - make, model: string
 *  - image_url: string
 *  - similarLabel: string (e.g. "Or similar coupe")
 *  - badge: string (e.g. "Advice of the day") — optional
 *  - pricePerDay: number | string
 *  - totalPrice: number | string
 *  - kmIncluded: number | string
 *  - passengers: number
 *  - bags: number
 *  - transmission: "Automatic" | "Manual"
 */
export default function CarCard({ car, onClick } : {any}) {
  const {
    make,
    model,
    image_url,
    similarLabel = "Or similar coupe",
    badge = "Advice of the day",
    pricePerDay,
    totalPrice,
    kmIncluded,
    passengers = 2,
    bags = 1,
    transmission = "Automatic",
  } = car;

  return (
    <button
      onClick={onClick}
      className="group relative w-full max-w-sm aspect-[3/4] rounded-[28px] overflow-hidden text-left
                 bg-neutral-900 ring-1 ring-white/5 hover:ring-white/15 transition-all duration-300
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      {/* Background image */}
      <img
        src={image_url}
        alt={`${make} ${model}`}
        className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110
                   transition-transform duration-700 ease-out"
      />

      {/* Base radial vignette so the car pops regardless of source image */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_35%,rgba(40,40,45,0.15),rgba(0,0,0,0.55)_75%)]" />

      {/* Top gradient for badge legibility */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 via-black/25 to-transparent" />

      {/* Bottom gradient for text legibility */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {/* Title */}
      <div className="absolute top-5 left-5 right-5">
        <h3 className="text-white text-2xl font-bold tracking-tight drop-shadow-sm">
          {make} {model}
        </h3>
      </div>

      {/* Top pill badges */}
      <div className="absolute top-16 left-5 right-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/5 backdrop-blur-sm px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-white/90 uppercase">
          {similarLabel}
          <Info size={13} className="text-white/60" />
        </span>
        {badge && (
          <span className="inline-flex items-center rounded-full border border-white/25 bg-white/5 backdrop-blur-sm px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-white/90 uppercase">
            {badge}
          </span>
        )}
      </div>

      {/* Bottom info block */}
      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white leading-none">
              <span className="text-4xl font-extrabold tracking-tight">
                {pricePerDay}
              </span>
              <span className="text-lg font-semibold">.99</span>
              <span className="ml-1.5 text-neutral-400 text-sm font-medium">
                € / day
              </span>
            </p>
            <p className="mt-1.5 text-neutral-300 text-sm">
              <span className="font-semibold text-white">{totalPrice}</span>{" "}
              € total price
            </p>
          </div>
          <p className="text-neutral-300 text-sm font-medium whitespace-nowrap">
            {kmIncluded} km per rental
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-white text-xs font-semibold">
            <User size={13} />
            {passengers}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-white text-xs font-semibold">
            <Briefcase size={13} />
            {bags}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-white text-xs font-semibold">
            <span className="flex items-center justify-center w-3.5 h-3.5 rounded-sm bg-white/90 text-black text-[9px] font-bold">
              A
            </span>
            {transmission}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ---------------- Demo wrapper (remove if importing CarCard elsewhere) ---------------- */

export function Demo() {
  const car = {
    make: "BMW",
    model: "M440 Coupe",
    image_url:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200&auto=format&fit=crop",
    similarLabel: "Or similar coupe",
    badge: "Advice of the day",
    pricePerDay: 159,
    totalPrice: "1,427.84",
    kmIncluded: 900,
    passengers: 2,
    bags: 1,
    transmission: "Automatic",
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-8">
      <CarCard car={car} onClick={() => {}} />
    </div>
  );
}