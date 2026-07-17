import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import pool from "@/lib/db";
import { generateCarImages } from "@/lib/generate";

export const maxDuration = 120;

export async function POST(req: NextRequest) {

  const formData = await req.formData();

  const file = formData.get("file") as File;
  const carId = formData.get("carId") as string;


  if (!file) {
    return NextResponse.json(
      { error: "No file" },
      { status: 400 }
    );
  }


  if (!file.name.endsWith(".glb")) {
    return NextResponse.json(
      { error: "Only GLB files allowed" },
      { status: 400 }
    );
  }


  if (!carId) {
    return NextResponse.json(
      { error: "No carId" },
      { status: 400 }
    );
  }


  const bytes = await file.arrayBuffer();

  const buffer = Buffer.from(bytes);


  const filePath =
    `models/${Date.now()}-${file.name}`;


  const { error } =
    await supabaseAdmin
      .storage
      .from("car-models")
      .upload(
        filePath,
        buffer,
        {
          contentType: "model/gltf-binary",
          upsert: false,
        }
      );


  if (error) {

    return NextResponse.json(
      {
        error: error.message
      },
      {
        status:500
      }
    );

  }


  const { data } =
  supabaseAdmin
    .storage
    .from("car-models")
    .getPublicUrl(filePath);


  // model upload done — save model_path immediately so the car has a
  // working model even if image generation below fails
  await pool.query(
    `UPDATE cars SET model_path = $1 WHERE car_id = $2`,
    [data.publicUrl, carId]
  );


  let imageUrl: string | null = null;

  try {

    const images = await generateCarImages(Number(carId), data.publicUrl);

    // Only "left" is generated right now — just take whatever came back.
    const primary = images[0];

    imageUrl = primary?.url ?? null;

    if (imageUrl) {
      await pool.query(
        `UPDATE cars SET image_url = $1 WHERE car_id = $2`,
        [imageUrl, carId]
      );
    }

  } catch (genError) {

    console.error(`Image generation failed for car ${carId}:`, genError);

  }


return NextResponse.json({
  url: data.publicUrl,
  imageUrl,
});

}