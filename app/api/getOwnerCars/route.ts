import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const owner_id = request.nextUrl.searchParams.get("owner_id");

  if (!owner_id) {
    return NextResponse.json(
      { error: "owner_id is required" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      "SELECT * FROM cars WHERE owner_id = $1",
      [Number(owner_id)]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json(
      { error:  "Database connection failed" },
      { status: 500 }
    );
  }
}