import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
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
        Number(params.id),
      ],
    );

    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "failed to update car" },
      { status: 500 },
    );
  }
}
