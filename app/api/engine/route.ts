import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const car_id = request.nextUrl.searchParams.get("car_id");
  if (!car_id) {
    return NextResponse.json(
      { error: "car_id is required" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      "SELECT * FROM engine WHERE car_id = $1",
      [Number(car_id)]
    );

    const engine = result.rows[0];

    if (!engine) {
      return NextResponse.json(
        { error: "Engine not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(engine);
  } catch (err) {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }
}