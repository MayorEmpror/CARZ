import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Protect the cron endpoint
    const authHeader = request.headers.get("authorization");

    if (
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await pool.query(
      `
      UPDATE rentals
      SET
        status = 'expired'
      WHERE status = 'pending'
        AND hold_expires_at <= NOW()
      RETURNING rental_id
      `
    );

    return NextResponse.json({
      success: true,
      expired_count: result.rowCount,
      rental_ids: result.rows.map(
        (row) => row.rental_id
      ),
    });
  } catch (error) {
    console.error("Rental expiration error:", error);

    return NextResponse.json(
      { error: "Failed to expire rentals" },
      { status: 500 }
    );
  }
}