import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      customer_id,
      car_id,
      start_time,
      end_time,

      pickup_location,
      pickup_latitude,
      pickup_longitude,

      dropoff_location,
      dropoff_latitude,
      dropoff_longitude,

      distance_km,
      estimated_duration,

      base_price,
      distance_charge,
      service_fee,
      total_amount,
    } = body;

    // Basic validation
    if (
      !customer_id ||
      !car_id ||
      !start_time ||
      !end_time ||
      !pickup_location ||
      pickup_latitude == null ||
      pickup_longitude == null ||
      !dropoff_location ||
      dropoff_latitude == null ||
      dropoff_longitude == null
    ) {
      return NextResponse.json(
        { error: "Missing required rental information" },
        { status: 400 }
      );
    }

    // Make sure the end time is after the start time
    if (new Date(end_time) <= new Date(start_time)) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Check that the car exists
    const carResult = await pool.query(
      `
      SELECT car_id
      FROM cars
      WHERE car_id = $1
      `,
      [car_id]
    );

    if (carResult.rowCount === 0) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      );
    }

    // Check for overlapping rentals
    const availabilityResult = await pool.query(
      `
      SELECT rental_id
      FROM rentals
      WHERE car_id = $1
        AND status IN (
          'pending',
          'confirmed',
          'payment_pending',
          'paid',
          'active'
        )
        AND start_time < $3
        AND end_time > $2
      LIMIT 1
      `,
      [car_id, start_time, end_time]
    );

    if (availabilityResult.rowCount > 0) {
      return NextResponse.json(
        { error: "Car is already rented during this period" },
        { status: 409 }
      );
    }

    // Create rental
    const result = await pool.query(
      `
      INSERT INTO rentals (
        customer_id,
        car_id,

        start_time,
        end_time,

        pickup_location,
        pickup_latitude,
        pickup_longitude,

        dropoff_location,
        dropoff_latitude,
        dropoff_longitude,

        distance_km,
        estimated_duration,

        base_price,
        distance_charge,
        service_fee,
        total_amount,

        status
      )
      VALUES (
        $1, $2,
        $3, $4,
        $5, $6, $7,
        $8, $9, $10,
        $11, $12,
        $13, $14, $15, $16,
        'pending'
      )
      RETURNING *
      `,
      [
        customer_id,
        car_id,

        start_time,
        end_time,

        pickup_location,
        pickup_latitude,
        pickup_longitude,

        dropoff_location,
        dropoff_latitude,
        dropoff_longitude,

        distance_km,
        estimated_duration,

        base_price,
        distance_charge,
        service_fee,
        total_amount,
      ]
    );

    return NextResponse.json(
      {
        message: "Rental created successfully",
        rental: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Rental creation error:", error);

    return NextResponse.json(
      { error: "Failed to create rental" },
      { status: 500 }
    );
  }
}