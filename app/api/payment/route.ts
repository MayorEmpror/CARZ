import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const owner_id = request.nextUrl.searchParams.get("owner_id");

  if (!owner_id) {
    return NextResponse.json(
      { error: "owner_id is required" },
      { status: 400 },
    );
  }

  try {
    const result = await pool.query(
      `SELECT p.*
FROM payments p
LEFT JOIN rentals r 
    ON p.rental_id = r.rental_id
LEFT JOIN purchases pu
    ON p.purchase_id = pu.purchase_id
LEFT JOIN cars c1
    ON r.car_id = c1.car_id
LEFT JOIN cars c2
    ON pu.car_id = c2.car_id
WHERE c1.owner_id = $1 
   OR c2.owner_id = $1;`,
      [Number(owner_id)],
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 },
    );
  }
}
