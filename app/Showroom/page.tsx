import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import FilterPanel from "@/components/filters/FilterPanel";
import CarGridHeader from "@/components/CarGridHeader";
import CarGrid from "@/components/CarGrid";
import  {getCars} from "@/lib/api/car"


export default async function Home() {
  const cars = await getCars();
  console.log(process.env.HOST)
  return (
    <div className="flex h-screen flex-col bg-black">
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