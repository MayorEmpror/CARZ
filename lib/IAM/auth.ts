import bcrypt from "bcrypt";
import pool from "../db";


interface RegisterUserInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export async function registerUser(
  data: RegisterUserInput
) {
  const {
    fullName,
    email,
    phone,
    password,
    confirmPassword,
  } = data;

  if (
    !fullName ||
    !email ||
    !phone ||
    !password ||
    !confirmPassword
  ) {
    throw new Error("All fields are required.");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  const existingUser = await pool.query(
    `
    SELECT user_id
    FROM users
    WHERE email = $1
    `,
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("Email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `
    INSERT INTO users
    (
      full_name,
      email,
      phone,
      password_hash,
      role
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      'customer'
    )
    RETURNING
      user_id,
      full_name,
      email,
      phone,
      role,
      created_at
    `,
    [
      fullName,
      email,
      phone,
      passwordHash,
    ]
  );

  return result.rows[0];
}


export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}

export async function loginHandler(
  data: LoginRequest
): Promise<LoginResponse> {
  const { email, password } = data;

  if (!email || !password) {
    return {
      success: false,
      message: "Email and password are required.",
    };
  }

  const result = await pool.query(
    `
   SELECT 
      user_id,
      email,
      password_hash,
      role
    FROM users
    WHERE email = $1
    `,
    [email]
  );

  if (result.rowCount === 0) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  const user = result.rows[0];

  // Plain text comparison (only if passwords are stored as plain text)
  const passwordMatch = await bcrypt.compare(
    password,
    user.password_hash
);

if (!passwordMatch) {
    return {
        success: false,
        message: "Invalid email or password."
    };
}
  return {
    success: true,
    message: "Login successful.",
  };
}