"use client";

import { Heart, MapPin, Star } from "lucide-react";
import { useState } from "react";
import   {Car} from "@/lib/types";
import {
  formatPrice,
  getCarDistance,
  getCarImage,
  getCarRating,
} from "@/lib/carDisplay";

type Props = {
  car: Car;
  initiallyFavourited?: boolean;
};

export default function CarCard({ car, initiallyFavourited = false }: Props) {
  const [favourited, setFavourited] = useState(initiallyFavourited);
  const { rating, reviews } = getCarRating(car);
  const { meters, minutes } = getCarDistance(car);
  const isAvailable = car.status?.toLowerCase() === "available";

  return (
    <div className="group rounded-xl border border-neutral-100 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center justify-between text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {meters}m ({minutes} min)
          <span className="mx-1 text-neutral-300">•</span>
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-neutral-700">{rating}</span>
          <span className="text-neutral-400">({reviews})</span>
        </span>

        <button
          onClick={() => setFavourited((f) => !f)}
          aria-label="Toggle favourite"
          className="text-neutral-300 hover:text-rose-500"
        >
          <Heart
            className={`h-4 w-4 ${
              favourited ? "fill-rose-500 text-rose-500" : ""
            }`}
          />
        </button>
      </div>

      <div className="mb-3 flex h-32 items-center justify-center">
        <img
          src={getCarImage(car)}
          alt={`${car.make} ${car.model}`}
          className="h-full w-auto object-contain transition-transform group-hover:scale-105"
        />
      </div>

      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">
            {car.make} {car.model}
          </h3>
          <p className="text-xs text-neutral-400">
            {car.year} · {isAvailable ? "Available" : car.status}
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold text-neutral-900">
            {formatPrice(car.price)}
          </span>
          <span className="text-xs text-neutral-400"> / hour</span>
        </div>
      </div>
    </div>
  );
}