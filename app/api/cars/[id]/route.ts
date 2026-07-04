import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const body = await req.json();

    const {
      owner_id,
      make,
      model,
      year,
      body_type,
      fuel_type,
      transmission,
      price,
      status,
      rating,
      rating_count,
      image_url,
    } = body;

    const carId = Number(id);

    if (isNaN(carId)) {
      return NextResponse.json(
        { error: "Invalid car id" },
        { status: 400 }
      );
    }

    const { rows } = await db.query(
      `UPDATE cars
       SET
         owner_id = COALESCE($1, owner_id),
         make = COALESCE($2, make),
         model = COALESCE($3, model),
         year = COALESCE($4, year),
         body_type = COALESCE($5, body_type),
         fuel_type = COALESCE($6, fuel_type),
         transmission = COALESCE($7, transmission),
         price = COALESCE($8, price),
         status = COALESCE($9, status),
         rating = COALESCE($10, rating),
         rating_count = COALESCE($11, rating_count),
         image_url = COALESCE($12, image_url)
       WHERE car_id = $13
       RETURNING *`,
      [
        owner_id ?? null,
        make ?? null,
        model ?? null,
        year ?? null,
        body_type ?? null,
        fuel_type ?? null,
        transmission ?? null,
        price ?? null,
        status ?? null,
        rating ?? null,
        rating_count ?? null,
        image_url ?? null,
        carId,
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "failed to update car" },
      { status: 500 }
    );
  }
}