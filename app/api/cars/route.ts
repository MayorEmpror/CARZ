import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query("SELECT * FROM cars");
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      owner_id,
      make,
      model,
      year,
      price,
      body_type,
      fuel_type,
      transmission,
      image_url,
    } = body;

    const result = await pool.query(
      `INSERT INTO cars 
      (owner_id, make, model, year, price, body_type, fuel_type, transmission, image_url, status, rating, rating_count)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'available',4.5,0)
      RETURNING *`,
      [
        owner_id,
        make,
        model,
        year,
        price,
        body_type,
        fuel_type,
        transmission,
        image_url,
      ]
    );

  
    const newCar = result.rows[0];


    return NextResponse.json({
      success: true,
      car_id: newCar.car_id,
      car: newCar,
      message: "Car added successfully"
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create car" },
      { status: 500 }
    );
  }
}