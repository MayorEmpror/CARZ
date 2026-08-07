import FilterPanel from "@/components/filters/FilterPanel";
import CarGrid from "@/components/CarGrid";
import CarGridHeader from "@/components/CarGridHeader";
import { getFilteredCars } from "@/lib/api/products";
import { searchParamsToFilters } from "@/components/filters/carFilters";

export default async function Cardisplay({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const sp = await searchParams;
  const filters = searchParamsToFilters(sp);
  const cars = await getFilteredCars(filters);

  return (
    <div className="flex h-full min-h-0 gap-6 px-6 py-5">
      {/* Fixed / sticky filter column */}
      <aside className="w-64 shrink-0 h-full overflow-y-auto sticky top-0">
        <FilterPanel />
      </aside>

      {/* Scrollable car grid column */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto">
        <CarGridHeader count={cars.length} />
        <CarGrid cars={cars} />
      </div>
    </div>
  );
}