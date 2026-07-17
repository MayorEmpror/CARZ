// app/api/cars/[carId]/set-default-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import  pool  from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { carId: string } }
) {
  console.log("set-default-image hit, carId:", params.carId);
  const carId = Number(params.carId);

  if (Number.isNaN(carId)) {
    return NextResponse.json({ error: "Invalid carId" }, { status: 400 });
  }

  // Prefer the "left" angle; fall back to any available generated image
  // if "left" hasn't been captured for this car for some reason.
  const { rows } = await pool.query(
    `SELECT url FROM car_images
     WHERE car_id = $1
     ORDER BY (angle = 'left') DESC, created_at DESC
     LIMIT 1`,
    [carId]
  );

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No generated images found for this car" },
      { status: 404 }
    );
  }

  const imageUrl = rows[0].url;

  const updateResult = await pool.query(
    `UPDATE cars SET image_url = $1 WHERE car_id = $2 RETURNING car_id, image_url`,
    [imageUrl, carId]
  );

  if (updateResult.rows.length === 0) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  return NextResponse.json({ imageUrl });
}