import pool from "../db";


export async function logoutHandler(
    sessionId: string
) {

    if (!sessionId) {
        return {
            success: false,
            message: "No active session."
        };
    }


    await pool.query(
        `
        DELETE FROM sessions
        WHERE session_id = $1
        `,
        [
            sessionId
        ]
    );


    return {
        success: true,
        message: "Logged out successfully."
    };
}