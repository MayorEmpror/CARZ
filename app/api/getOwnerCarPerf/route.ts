import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const ownerId = Number(request.nextUrl.searchParams.get("owner_id"));

  if (Number.isNaN(ownerId)) {
    return NextResponse.json(
      { error: "Valid owner_id is required" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM car_performance p
      JOIN cars c ON c.car_id = p.car_id
      JOIN users u ON c.owner_id = u.user_id
      WHERE c.owner_id = $1
      `,
      [ownerId]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Database error:", err);
  
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}