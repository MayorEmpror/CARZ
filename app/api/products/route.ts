// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFilteredCars } from "@/lib/api/products";


import { searchParamsToFilters } from "@/components/filters/carFilters";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filters = searchParamsToFilters(Object.fromEntries(sp.entries()));
  const cars = await getFilteredCars(filters);
  return NextResponse.json(cars);
}