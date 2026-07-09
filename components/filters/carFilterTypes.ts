// lib/carFilterTypes.ts
export type CarFilters = {
    rentalType: string;
    availableOnly: boolean;
    priceRange: [number, number];
    bodyTypes: string[];
    transmission: string;
    fuelTypes: string[];
  };
  
  export const DEFAULT_FILTERS: CarFilters = {
    rentalType: "Any",
    availableOnly: false,
    priceRange: [0, 9800000000.5],
    bodyTypes: [],
    fuelTypes: [],
    transmission: "Any",
  };