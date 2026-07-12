import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/IAM/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const user = await registerUser(body);

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Registration failed",
      },
      { status: 400 }
    );
  }
}