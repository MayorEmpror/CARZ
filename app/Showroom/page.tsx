// app/showroom/page.tsx
import FilterPanel from "@/components/filters/FilterPanel";
import CarGrid from "@/components/CarGrid";
import { getFilteredCars } from "@/lib/api/products";
import { searchParamsToFilters } from "@/components/filters/carFilters";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import CarGridHeader from "@/components/CarGridHeader";
import { requireUser } from "@/lib/IAM/validators";



export default async function ShoroomPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const sp = await searchParams;
  const filters = searchParamsToFilters(sp);
  const cars = await getFilteredCars(filters);
  const user = await requireUser();

  return (
    <div className="flex h-screen flex-col bg-black">
      <TopBar user={user} />

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



// export default async function Home() {
//   const cars = await getCars();
//   console.log(process.env.HOST)
//   return (
//     <div className="flex h-screen flex-col bg-black">
//       <TopBar />

//       <div className="flex flex-1 overflow-hidden">
//         <Sidebar />
//         <FilterPanel />

//         <main className="flex-1 overflow-y-auto px-6 py-5">
//           <CarGridHeader count={cars.length} />
//           <CarGrid cars={cars} />
//         </main>
//       </div>
//     </div>
//   );
// }