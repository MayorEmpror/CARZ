// app/api/cars/[id]/details/route.ts

import pool from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
   
    const { id } = await params;

    const result = await pool.query(
      `
      SELECT
        c.*,
        cp.*
      FROM cars c
      JOIN car_performance cp
        ON c.car_id = cp.car_id
      WHERE c.car_id = $1
      `,
      [id]
    );

    return Response.json(result.rows[0] || null);
  }catch (err) {
    console.error(err);
  
    return Response.json(
      {
        error: String(err)
      },
      { status: 500 }
    );
  }
}