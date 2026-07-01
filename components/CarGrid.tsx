import  Car  from "@/lib/types";
import CarCard from "./CarCard";

export default function CarGrid({ cars }: { cars: Car[] }) {
  if (cars.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-neutral-200 text-sm text-neutral-400">
        No vehicles match your filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cars.map((car) => (
        <CarCard key={car.car_id} car={car} />
      ))}
    </div>
  );
}