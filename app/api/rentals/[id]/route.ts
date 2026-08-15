import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `
      SELECT
        r.*,
        c.make,
        c.model,
        c.year
      FROM rentals r
      JOIN cars c
        ON r.car_id = c.car_id
      WHERE r.rental_id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Rental not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      rental: result.rows[0],
    });
  } catch (error) {
    console.error("Get rental error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve rental" },
      { status: 500 }
    );
  }
}