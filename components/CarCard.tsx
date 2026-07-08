"use client";

import { StarIcon } from "lucide-react";
import { FaGasPump, FaCarSide } from "react-icons/fa";

import type { Car } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CarCard({ car }: { car: Car }) {
  return (
    <div
      className={cn(
        "relative block w-full h-[420px] overflow-hidden group text-left border border-white/10 hover:border-white/20 transition-colors",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={car.image_url}
        alt={`${car.make} ${car.model}`}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />

      <div className="absolute inset-0 bg-linear-to-t from-[#131318] via-transparent to-[#131318]/70" />

      <div className="relative z-10 flex h-full flex-col justify-between p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-white text-2xl font-bold leading-tight truncate">
              {car.make} {car.model}
            </h3>

            <p className="text-neutral-300 text-sm mt-1">
              {car.year} • {car.body_type}
            </p>
          </div>
        </div>

        {/* Bottom content */}
        <div className="space-y-4">
          {/* Price + Rating */}
          <div className="flex items-end justify-between gap-3">
            <div className="leading-tight">
              <p className="text-white text-2xl font-bold">
                {Math.round(Number(car.price) / 100000)}.0
                <span className="text-neutral-300 text-base font-normal">
                  {" "}
                  €/day
                </span>
              </p>
              <p className="text-white/50 text-sm font-medium">
                {Math.round(Number(car.price) / 1000)}K total
              </p>
            </div>

            <div className="flex items-center gap-1">
              <StarIcon
                size={16}
                className="fill-yellow-400 text-yellow-400"
              />
              <span className="text-white text-base">{car.rating}</span>
              <span className="text-neutral-300 text-sm">
                ({car.rating_count})
              </span>
            </div>
          </div>

          {/* Specifications */}
          <div className="flex gap-2 w-full">
            <div className="rounded-xl flex items-center gap-2 bg-stone-700/30 backdrop-blur-sm p-2 w-fit">
              <FaGasPump className="text-neutral-300 shrink-0" size={14} />

              <div>
                <p className="text-white text-sm font-medium truncate">
                  {car.fuel_type}
                </p>
              </div>
            </div>

            <div className="rounded-xl flex items-center gap-2 bg-stone-700/30 backdrop-blur-sm p-2 w-fit">
              <FaCarSide className="text-neutral-300 shrink-0" size={14} />

              <p className="text-white text-sm font-medium">
                {car.transmission}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}