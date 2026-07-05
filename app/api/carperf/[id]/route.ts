// app/api/carperf/[id]/route.ts

import pool from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id} = await params;

    if (!id) {
      return Response.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "SELECT * FROM car_performance WHERE performance_id = $1",
      [id]
    );

    return Response.json(result.rows[0] || null);
  } catch (err) {
    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}


