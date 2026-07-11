import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db"

export async function  GET() {
    try{
        const result = await pool.query("SELECT  cp.*, c.model AS car_name, c.make as brand FROM car_performance cp JOIN cars c ON cp.car_id = c.car_id;");
        return NextResponse.json(result.rows)
    }catch(err){
        return NextResponse.json({
            error : "Database connection failed",
            status : 500
        });
    }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      car_id,
      mileage,
      top_speed,
      acceleration_0_100,
      engine_power,
      torque,
      fuel_efficiency,
    } = body;

    if (
      car_id === undefined ||
      mileage === undefined ||
      top_speed === undefined ||
      acceleration_0_100 === undefined ||
      engine_power === undefined ||
      torque === undefined ||
      fuel_efficiency === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO car_performance
       (car_id, mileage, top_speed, acceleration_0_100, engine_power, torque, fuel_efficiency)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [car_id, mileage, top_speed, acceleration_0_100, engine_power, torque, fuel_efficiency]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to add car_performance" },
      { status: 500 }
    );
  }
}

