"use client";

import { useState } from "react";

type FieldErrors = Partial<{
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}>;

export default function RegisterPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(data: Record<string, string>): FieldErrors {
    const next: FieldErrors = {};

    if (!data.fullName.trim()) next.fullName = "Required";
    if (!/^\S+@\S+\.\S+$/.test(data.email)) next.email = "Enter a valid email";
    if (!/^[0-9+()\-\s]{7,}$/.test(data.phone)) next.phone = "Enter a valid phone number";
    if (data.password.length < 8) next.password = "At least 8 characters";
    if (data.confirmPassword !== data.password) next.confirmPassword = "Passwords don't match";

    return next;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formElement = e.currentTarget;
    const form = new FormData(formElement);

    const data = {
      fullName: String(form.get("fullName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
    };

    const fieldErrors = validate(data);
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      setStatus("error");
      setServerMessage("Check the highlighted fields.");
      return;
    }

    setStatus("loading");
    setServerMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      console.log("Status:", response.status);

      const text = await response.text();
      
      console.log("Raw response:", text);
      
      const result = text ? JSON.parse(text) : {};

      if (!response.ok) {
        setStatus("error");
        setServerMessage(result?.message ?? "Registration failed. Try again.");
        return;
      }

      setStatus("success");
      setServerMessage(result?.message ?? "Account created. Welcome aboard.");
      formElement.reset();
    }  catch (error) {
        console.error("Registration error:", error);
      
        setStatus("error");
        setServerMessage("Connection lost. Check your network and retry.");
      }
  }

  return (
    <main className="min-h-screen bg-black flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-white/5 bg-zinc-900/80 p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-zinc-50">Register</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Create an account to get started.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          <TextField
            name="fullName"
            label="Full name"
            placeholder="e.g. Jane Doe"
            error={errors.fullName}
          />

          <TextField
            name="email"
            label="Email"
            type="email"
            placeholder="e.g. jane@domain.com"
            error={errors.email}
          />

          <TextField
            name="phone"
            label="Phone"
            placeholder="e.g. +1 555 010 1234"
            error={errors.phone}
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password}
            />
            <TextField
              name="confirmPassword"
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword}
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-xl bg-emerald-300 py-3.5 font-semibold text-zinc-900 transition hover:bg-emerald-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "Creating account..." : "Create account"}
          </button>

          {serverMessage && (
            <p
              className={`text-sm ${
                status === "success" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {serverMessage}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

function TextField({
  name,
  label,
  placeholder,
  type = "text",
  error,
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm text-zinc-400">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-xl bg-zinc-800/60 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 ${
          error ? "ring-1 ring-rose-500 focus:ring-rose-500" : "focus:ring-zinc-500"
        }`}
      />
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  );
}