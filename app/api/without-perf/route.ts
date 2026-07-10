import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db"

export async function GET(){
    try {
        const result = await pool.query("SELECT * from cars where car_id not in (SELECT car_id from car_performance);");
        return NextResponse.json(result.rows);
    }catch(err){
        return NextResponse.json(
            {
                error: "Database connection failed",
                status : 500
            }
        )
    }
}
