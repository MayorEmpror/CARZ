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

    // -----------------------------
    // 1. Validate required fields
    // -----------------------------

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

    // -----------------------------
    // 2. Validate dates
    // -----------------------------

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid start or end time" },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // -----------------------------
    // 3. Get database client
    // -----------------------------

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // -----------------------------
      // 4. Check customer
      // -----------------------------

      const customerResult = await client.query(
        `
        SELECT user_id
        FROM users
        WHERE user_id = $1
        `,
        [customer_id]
      );

      if (customerResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }

      // -----------------------------
      // 5. Check car
      // -----------------------------

      const carResult = await client.query(
        `
        SELECT car_id, status
        FROM cars
        WHERE car_id = $1
        FOR UPDATE
        `,
        [car_id]
      );

      if (carResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          { error: "Car not found" },
          { status: 404 }
        );
      }

      const car = carResult.rows[0];

      // Don't allow obviously unavailable cars
      if (
        car.status === "sold" ||
        car.status === "maintenance" ||
        car.status === "inactive"
      ) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          { error: "Car is currently unavailable" },
          { status: 409 }
        );
      }

      // -----------------------------
      // 6. Check rental availability
      // -----------------------------

      const availabilityResult = await client.query(
        `
        SELECT rental_id
        FROM rentals
        WHERE car_id = $1

          AND (
            status IN (
              'confirmed',
              'payment_pending',
              'paid',
              'active'
            )

            OR (
              status = 'pending'
              AND hold_expires_at > NOW()
            )
          )

          AND start_time < $3
          AND end_time > $2

        LIMIT 1
        `,
        [car_id, start_time, end_time]
      );

      if (availabilityResult.rowCount! > 0) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          {
            error: "Car is already reserved during this period",
          },
          { status: 409 }
        );
      }

      // -----------------------------
      // 7. Create temporary rental hold
      // -----------------------------

      const result = await client.query(
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

          status,
          hold_expires_at
        )

        VALUES (
          $1,
          $2,

          $3,
          $4,

          $5,
          $6,
          $7,

          $8,
          $9,
          $10,

          $11,
          $12,

          $13,
          $14,
          $15,
          $16,

          'pending',
          NOW() + INTERVAL '10 minutes'
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

      await client.query("COMMIT");

      return NextResponse.json(
        {
          message: "Rental hold created successfully",
          rental: result.rows[0],
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Rental creation error:", error);

    return NextResponse.json(
      { error: "Failed to create rental" },
      { status: 500 }
    );
  }
}