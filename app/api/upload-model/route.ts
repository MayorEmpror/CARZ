import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";


export async function POST(req: NextRequest) {

  const formData = await req.formData();

  const file = formData.get("file") as File;


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


return NextResponse.json({
  url: data.publicUrl,
});

}