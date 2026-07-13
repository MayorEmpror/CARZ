import { NextRequest, NextResponse } from "next/server";
import { loginHandler } from "@/lib/IAM/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await loginHandler(body);

    if (!result.success) {
      return NextResponse.json(result, {
        status: 401,
      });
    }

    return NextResponse.json(result, {
      status: 200,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}