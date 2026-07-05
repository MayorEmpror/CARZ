import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db"

export async function GET(){
    try{
        const result = await pool.query("SELECT * FROM users where role = 'owner'")
        return NextResponse.json(result)
    }catch(error){
        return NextResponse.json({
            error : "Database connection failed",
            status: 500,
        })
    }
}