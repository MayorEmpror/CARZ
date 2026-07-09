// lib/cars.ts
import pool from "@/lib/db";

// lib/api/products.ts
import { CarFilters } from "@/components/filters/carFilterTypes";

export async function getFilteredCars(filters: CarFilters) {
  const conditions: string[] = [];
  const values: any[] = [];
  let i = 1;

  // rentalType has no backing column in `cars` yet — skipped for now, see note below

  if (filters.availableOnly) {
    conditions.push(`status = $${i++}`);
    values.push("available");
  }

  if (filters.priceRange) {
    conditions.push(`price >= $${i++}`);
    values.push(filters.priceRange[0]);

    conditions.push(`price <= $${i++}`);
    values.push(filters.priceRange[1]);
  }

  if (filters.bodyTypes && filters.bodyTypes.length > 0) {
    conditions.push(`body_type = ANY($${i++})`);
    values.push(filters.bodyTypes);
  }

  if (filters.transmission && filters.transmission !== "Any") {
    conditions.push(`transmission = $${i++}`);
    values.push(filters.transmission);
  }

  if (filters.fuelTypes && filters.fuelTypes.length > 0) {
    conditions.push(`fuel_type = ANY($${i++})`);
    values.push(filters.fuelTypes);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  console.log("SQL:", `SELECT * FROM cars ${where} ORDER BY created_at DESC LIMIT 50`);
  console.log("VALUES:", values);
  
  const result = await pool.query(
    `SELECT * FROM cars ${where} ORDER BY created_at DESC LIMIT 50`,
    values
  );
  console.log("ROWS:", result.rows.length);

  return result.rows;
}