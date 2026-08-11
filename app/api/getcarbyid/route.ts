import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const conv_id = request.nextUrl.searchParams.get("conv_id");

  if (!conv_id) {
    return NextResponse.json(
      { error: "conv_id is required" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      "SELECT * from cars where car_id in ( SELECT car_id  from conversations where conversation_id = $1);",
      [Number(conv_id)]
    );
    console.log("from the route : " + conv_id)
     console.log("from the route, the result : " + result)
     return NextResponse.json(result.rows[0] ?? null);
  } catch (err) {
    return NextResponse.json(
      { error:  "Database connection failed" },
      { status: 500 }
    );
  }
}