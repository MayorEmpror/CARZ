import bcrypt from "bcrypt";
import pool from "@/lib/db";
import { randomUUID } from "crypto";

const VALID_ROLES = ["customer", "driver", "owner"] as const;
type Role = (typeof VALID_ROLES)[number];

interface RegisterUserInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  confirmPassword: string;
}

export async function registerUser(data: RegisterUserInput) {
  const { fullName, email, phone, password, role, confirmPassword } = data;

  if (!fullName || !email || !phone || !password || !confirmPassword || !role) {
    throw new Error("All fields are required.");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  if (!VALID_ROLES.includes(role as Role)) {
    throw new Error("Invalid role.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Which roles need to be created for this signup.
  // Owners automatically also get a customer account on the same email/password.
  const rolesToCreate: Role[] =
    role === "owner" ? ["owner", "customer"] : [role as Role];

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check for conflicts against every role we're about to create.
    // Requires a UNIQUE(email, role) constraint on the users table (see migration below) —
    // a plain UNIQUE(email) constraint will reject the second (customer) row for an owner.
    const existing = await client.query(
      `
      SELECT role
      FROM users
      WHERE email = $1
        AND role = ANY($2::text[])
      `,
      [normalizedEmail, rolesToCreate]
    );

    if (existing.rows.length > 0) {
      const conflictingRoles = existing.rows.map((r) => r.role).join(", ");
      throw new Error(
        `An account with this email already exists for role(s): ${conflictingRoles}.`
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const insertedUsers = [];

    for (const r of rolesToCreate) {
      const result = await client.query(
        `
        INSERT INTO users
          (full_name, email, phone, password_hash, role)
        VALUES
          ($1, $2, $3, $4, $5)
        RETURNING
          user_id,
          full_name,
          email,
          phone,
          role,
          created_at
        `,
        [fullName, normalizedEmail, phone, passwordHash, r]
      );

      insertedUsers.push(result.rows[0]);
    }

    await client.query("COMMIT");

    // Return the primary account (the role the user actually selected).
    // The auto-created customer account (if any) is still available in insertedUsers.
    const primaryUser = insertedUsers.find((u) => u.role === role);

    return {
      user: primaryUser,
      createdAccounts: insertedUsers,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Returns the owner-role account for this email, if one exists.
export async function findAccountByEmailAndRole(email: string, role: Role) {
  const result = await pool.query(
    `
    SELECT user_id, full_name, email, phone, role
    FROM users
    WHERE email = $1 AND role = $2
    `,
    [email.trim().toLowerCase(), role]
  );

  return result.rows[0] ?? null;
}

// Given an *already authenticated* user (via their current session's user_id),
// find their sibling account for targetRole (e.g. owner) and issue a fresh
// session for it. No password required since they're already logged in.
export async function switchRoleSession(currentUserId: string, targetRole: Role) {
  const current = await pool.query(
    `SELECT email FROM users WHERE user_id = $1`,
    [currentUserId]
  );

  if (current.rowCount === 0) {
    throw new Error("Current user not found.");
  }

  const email = current.rows[0].email;

  const target = await findAccountByEmailAndRole(email, targetRole);

  if (!target) {
    throw new Error(`No ${targetRole} account exists for this email.`);
  }

  const sessionId = randomUUID();

  await pool.query(
    `
    INSERT INTO sessions (session_id, user_id, expires_at)
    VALUES ($1, $2, $3)
    `,
    [sessionId, target.user_id, new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)]
  );

  return { sessionId, user: target };
}

export interface LoginRequest {
  email: string;
  password: string;
  role?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  role?: string;
}

export async function loginHandler(data: LoginRequest): Promise<LoginResponse> {
  const { email, password, role } = data;

  if (!email || !password) {
    return {
      success: false,
      message: "Email and password are required.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // If a user has both an owner and a customer account under the same email,
  // role disambiguates which one to log into. If no role is passed, we fall
  // back to the first match (adjust to your app's needs).
  const result = role
    ? await pool.query(
        `
        SELECT user_id, email, password_hash, role
        FROM users
        WHERE email = $1 AND role = $2
        `,
        [normalizedEmail, role]
      )
    : await pool.query(
        `
        SELECT user_id, email, password_hash, role
        FROM users
        WHERE email = $1
        `,
        [normalizedEmail]
      );

  if (result.rowCount === 0) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  const user = result.rows[0];

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  const sessionId = randomUUID();

  await pool.query(
    `
    INSERT INTO sessions (session_id, user_id, expires_at)
    VALUES ($1, $2, $3)
    `,
    [sessionId, user.user_id, new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)]
  );

  return {
    success: true,
    message: "Login successful.",
    sessionId,
    role: user.role,
  };
}