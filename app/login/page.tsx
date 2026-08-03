"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FieldErrors = Partial<{
  email: string;
  password: string;
}>;

export default function Login() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  function validate(data: Record<string, string>): FieldErrors {
    const next: FieldErrors = {};

    if (!/^\S+@\S+\.\S+$/.test(data.email))
      next.email = "Enter a valid email";

    if (data.password.length < 8)
      next.password = "Password must be at least 8 characters";

    return next;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formElement = e.currentTarget;
    const form = new FormData(formElement);

    const data = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
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
      // Placeholder endpoint.
      // Replace with your real login API when implemented.
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Status:", response.status);

      const result = await response.json();
      console.log("Result:", result);

      if (!response.ok) {
        setStatus("error");
        setServerMessage(result?.message ?? "Login failed.");
        return;
      }

      setStatus("success");
      setServerMessage(result?.message ?? "Logged in successfully.");
      formElement.reset();

      // Route based on account role — sellers/owners and drivers land on
      // the dashboard, everyone else goes to the showroom.
      const role = result?.user?.role ?? result?.role;
      const destination =
        role === "owner" || role === "seller" || role === "driver"
          ? "/dashboard"
          : "/showroom";

      router.push(destination);
      router.refresh();

      // TODO:
      // Save JWT / session
    } catch (error) {
      console.error("Login error:", error);

      setStatus("error");
      setServerMessage("Connection lost. Check your network and retry.");
    }
  }

  return (
    <main className="h-screen  flex items-center justify-center ">
      <div className="flex w-full h-full overflow-hidden  bg-[#151420] shadow-2xl">
        {/* Left panel — brand / imagery */}
        <div className="relative hidden w-2/3 md:block">
          <div className="absolute inset-0 overflow-hidden">
            {/* Dune-style gradient scene (CSS only, no external image) */}
            <div className="absolute inset-0 bg-linear-to-b from-[#5b4b8a] via-[#3c3660] to-[#0c0b12]" />
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 400 520"
              preserveAspectRatio="none"
            >
              <path
                d="M0 300 Q 100 230 200 290 T 400 260 V520 H0 Z"
                fill="#1c1a2b"
                opacity="0.9"
              />
              <path
                d="M0 360 Q 130 300 220 350 T 400 330 V520 H0 Z"
                fill="#131120"
              />
            </svg>
            {/* Top bar */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6">
              <span className="text-lg font-semibold tracking-wide text-white">
                CARZ
              </span>
              <Link
                href="/"
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-white/20"
              >
                Back to website →
              </Link>
            </div>
            {/* Bottom copy */}
            <div className="absolute inset-x-0 bottom-8 px-7">
              <p className="text-2xl font-semibold leading-snug text-white">
                Car Dealerships
                <br />
                Creating Profits
              </p>
              <div className="mt-6 flex gap-2">
                <span className="h-1 w-6 rounded-full bg-white/30" />
                <span className="h-1 w-6 rounded-full bg-white/30" />
                <span className="h-1 w-6 rounded-full bg-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex w-full flex-col justify-center px-8 py-10 md:w-[54%] md:px-14">
          <h1 className="text-3xl font-bold text-zinc-50">Welcome back</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-indigo-400 hover:underline">
              Sign up
            </a>
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
            <TextField
              name="email"
              label="Email"
              type="email"
              placeholder="e.g. jane@domain.com"
              error={errors.email}
            />

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-zinc-400"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(errors.password)}
                  className={`w-full rounded-xl bg-[#1e1c2b] px-4 py-3.5 text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 ${
                    errors.password
                      ? "ring-1 ring-rose-500 focus:ring-rose-500"
                      : "focus:ring-indigo-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-400">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 text-sm">
              <label className="flex items-center gap-2 text-zinc-400">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-600 bg-[#1e1c2b] accent-indigo-500"
                />
                Remember me
              </label>
              <a href="/forgot-password" className="text-indigo-400 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-indigo-500 py-3.5 font-semibold text-white transition hover:bg-indigo-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Signing in..." : "Log in"}
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

            <div className="flex items-center gap-3 pt-2">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-zinc-500">Or continue with</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1e1c2b] py-3 text-sm font-medium text-zinc-200 transition hover:bg-[#26243a]"
              >
                <GoogleIcon /> Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1e1c2b] py-3 text-sm font-medium text-zinc-200 transition hover:bg-[#26243a]"
              >
                <AppleIcon /> Apple
              </button>
            </div>
          </form>
        </div>
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
        className={`w-full rounded-xl bg-[#1e1c2b] px-4 py-3.5 text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 ${
          error
            ? "ring-1 ring-rose-500 focus:ring-rose-500"
            : "focus:ring-indigo-500"
        }`}
      />

      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 34.9 26.9 36 24 36c-5.2 0-9.7-3.1-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.4 5.4-6.3 6.7l6.6 5.6C39.4 37.4 44 31.4 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.4 1c.1 1.2-.4 2.4-1.1 3.3-.7.9-1.9 1.6-3 1.5-.1-1.2.4-2.4 1.1-3.2C14.1 1.6 15.3 1 16.4 1zM20 17c-.6 1.3-.9 1.9-1.7 3-1.1 1.6-2.6 3.6-4.5 3.6-1.7 0-2.1-1.1-4.4-1.1s-2.8 1.1-4.4 1.1c-1.9 0-3.3-1.8-4.4-3.4C-1.6 16.6-.4 10.8 3 8.1c1.7-1.4 3.5-1.4 4.6-1.4 1.2 0 2.3.5 3.1.5.7 0 2.2-.6 3.7-.5.6 0 2.4.2 3.6 1.9-.1.1-2.1 1.2-2.1 3.6 0 2.9 2.5 3.9 2.6 3.9-.1.2-.4 1.4-1.5 2.9z" />
    </svg>
  );
}