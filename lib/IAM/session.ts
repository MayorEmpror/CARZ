import { cookies } from "next/headers";
import pool from "../db";


export async function getCurrentUser() {

    const cookieStore = await cookies();

    const sessionId = cookieStore.get(
        "session_id"
    )?.value;


    if (!sessionId) {
        return null;
    }


    const result = await pool.query(
        `
        SELECT
            users.user_id,
            users.full_name,
            users.email,
            users.role
        FROM sessions
        JOIN users
        ON sessions.user_id = users.user_id
        WHERE sessions.session_id = $1
        AND sessions.expires_at > NOW()
        `,
        [
            sessionId
        ]
    );


    if(result.rowCount === 0){
        return null;
    }


    return result.rows[0];
}