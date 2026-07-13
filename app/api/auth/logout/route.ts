import { NextRequest, NextResponse } from "next/server";
import { logoutHandler } from "@/lib/IAM/logout";


export async function POST(req: NextRequest) {

    try {

        const sessionId =
            req.cookies.get("session_id")?.value;


        const result = await logoutHandler(
            sessionId ?? ""
        );


        const response = NextResponse.json(
            result,
            {
                status: 200
            }
        );


        // Remove cookie
        response.cookies.set(
            "session_id",
            "",
            {
                httpOnly: true,
                expires: new Date(0),
                path: "/"
            }
        );


        return response;


    } catch(error) {

        console.error(error);


        return NextResponse.json(
            {
                success:false,
                message:"Internal Server Error"
            },
            {
                status:500
            }
        );
    }
}