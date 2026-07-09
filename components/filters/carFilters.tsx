// lib/carFilters.ts
import { CarFilters, DEFAULT_FILTERS } from "./carFilterTypes";
// lib/carFilters.ts


export function filtersToSearchParams(filters: CarFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.rentalType !== "Any") params.set("rentalType", filters.rentalType);
  if (filters.availableOnly) params.set("available", "1");
  params.set("minPrice", String(filters.priceRange[0]));
  params.set("maxPrice", String(filters.priceRange[1]));
  if (filters.bodyTypes.length) params.set("bodyTypes", filters.bodyTypes.join(","));
  if (filters.transmission !== "Any") params.set("transmission", filters.transmission);
  if (filters.fuelTypes.length) params.set("fuelTypes", filters.fuelTypes.join(","));

  return params;
}

export function searchParamsToFilters(
  sp: { [key: string]: string | undefined }
): CarFilters {
  return {
    rentalType: sp.rentalType ?? DEFAULT_FILTERS.rentalType,
    availableOnly: sp.available === "1",
    priceRange: [
      sp.minPrice ? Number(sp.minPrice) : DEFAULT_FILTERS.priceRange[0],
      sp.maxPrice ? Number(sp.maxPrice) : DEFAULT_FILTERS.priceRange[1],
    ],
    bodyTypes: sp.bodyTypes ? sp.bodyTypes.split(",") : DEFAULT_FILTERS.bodyTypes,
    transmission: sp.transmission ?? DEFAULT_FILTERS.transmission,
    fuelTypes: sp.fuelTypes ? sp.fuelTypes.split(",") : DEFAULT_FILTERS.fuelTypes,
  };
}