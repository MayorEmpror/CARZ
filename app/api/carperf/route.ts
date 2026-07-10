import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db"

export async function  GET() {
    try{
        const result = await pool.query("SELECT  cp.*, c.model AS car_name, c.make as brand FROM car_performance cp JOIN cars c ON cp.car_id = c.car_id;");
        return NextResponse.json(result.rows)
    }catch(err){
        return NextResponse.json({
            error : "Database connection failed",
            status : 500
        });
    }
}