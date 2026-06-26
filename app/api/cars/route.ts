import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query("SELECT * FROM cars");

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }
}