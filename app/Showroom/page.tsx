import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import FilterPanel from "@/components/filters/FilterPanel";
import CarGridHeader from "@/components/CarGridHeader";
import CarGrid from "@/components/CarGrid";
import  Car  from "@/lib/types";

async function getCars(): Promise<Car[]> {
  const res = await fetch(`${process.env.HOST}/api/cars`, {
    cache: "no-store",
  });

  return res.json();
}

export default async function Home() {
  const cars = await getCars();

  return (
    <div className="flex h-screen flex-col bg-neutral-50">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <FilterPanel />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          <CarGridHeader count={cars.length} />
          <CarGrid cars={cars} />
        </main>
      </div>
    </div>
  );
}