import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db"

export async function  GET() {
    try{
        const result = await pool.query("SELECT * FROM car_performance;");
        return NextResponse.json(result.rows)
    }catch(err){
        return NextResponse.json({
            error : "Database connection failed",
            status : 500
        });
    }
}