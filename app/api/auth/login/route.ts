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



    const response =  NextResponse.json(result, {
      status: 200,
    });

   if(result.sessionId){
    response.cookies.set(
        "session_id",
        result.sessionId,
        {
            httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            sameSite:"lax",
            maxAge:60*60*24*7,
            path:"/"
        }
    );
   }
    return response;
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