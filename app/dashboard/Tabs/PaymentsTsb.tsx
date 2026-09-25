// app/dashboard/Tabs/PaymentsTsb.tsx
"use client"
import { Car } from "@/lib/types";
import AnalyticsTab from "./Analytics";

export default function PaymentsTsb({ cars }: { cars: Car[] }) {
  if (cars.length === 0) {
    return (
      <div className="text-white flex flex-col items-center justify-center h-full py-24 text-center">
        <div className="text-5xl mb-4">:(</div>
        <p className="text-white/60">Sorry, you don't have enough data.</p>
      </div>
    );
  }

  return <AnalyticsTab cars={cars} />;
}