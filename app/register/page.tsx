"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Role = "customer" | "driver" | "owner";

type FieldErrors = Partial<{
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
}>;

export default function RegisterPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState<Role>("customer");

  function validate(data: Record<string, string>): FieldErrors {
    const next: FieldErrors = {};

    if (!data.fullName.trim()) next.fullName = "Required";
    if (!/^\S+@\S+\.\S+$/.test(data.email)) next.email = "Enter a valid email";
    if (!/^[0-9+()\-\s]{7,}$/.test(data.phone)) next.phone = "Enter a valid phone number";
    if (data.password.length < 8) next.password = "At least 8 characters";
    if (data.confirmPassword !== data.password) next.confirmPassword = "Passwords don't match";
    if (!["customer", "driver", "owner"].includes(data.role)) next.role = "Select a role";

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
      role: String(form.get("role") ?? ""),
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
      // REGISTER
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const registerResult = await registerResponse.json();

      if (!registerResponse.ok) {
        setStatus("error");
        setServerMessage(registerResult?.message ?? "Registration failed.");
        return;
      }

      // LOGIN AFTER SUCCESSFUL REGISTER
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const loginResult = await loginResponse.json();

      if (!loginResponse.ok) {
        setStatus("error");
        setServerMessage(loginResult?.message ?? "Auto login failed.");
        return;
      }

      // USER IS LOGGED IN NOW
      setStatus("success");
      setServerMessage("Welcome aboard.");

      formElement.reset();
      setRole("customer");

      const destination =
        data.role === "owner"
          ? "/dashboard"
          : data.role === "driver"
          ? "/dashboard"
          : "/showroom";

      router.push(destination);
      router.refresh();
    } catch (error) {
      console.error(error);

      setStatus("error");
      setServerMessage("Connection lost. Check your network and retry.");
    }
  }

  return (
    <main className="h-screen  flex items-center justify-center  overflow-y-auto">
      <div className="flex w-full h-full  overflow-hidden  bg-[#151420] shadow-2xl">
        {/* Left panel — brand / imagery */}
        <div className="relative hidden w-1/2 md:block">
          <div className="absolute inset-0  overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, #5b4b8a 0%, #3c3660 45%, #0c0b12 100%)",
              }}
            />
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

            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6">
              <span className="text-lg font-semibold tracking-wide text-white">
                AMU
              </span>
              <Link
                href="/"
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-white/20"
              >
                Back to website →
              </Link>
            </div>

            <div className="absolute inset-x-0 bottom-8 px-7">
              <p className="text-2xl font-semibold leading-snug text-white">
                Capturing Moments,
                <br />
                Creating Memories
              </p>
              <div className="mt-6 flex gap-2">
                <span className="h-1 w-6 rounded-full bg-white/30" />
                <span className="h-1 w-6 rounded-full bg-white" />
                <span className="h-1 w-6 rounded-full bg-white/30" />
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex w-1/2 mx-auto flex-col overflow-y-auto px-8 py-10 md:w-1/3 md:px-10">
          <h1 className="text-3xl font-bold text-zinc-50">Create an account</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:underline">
              Log in
            </Link>
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
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

            <RoleField
              name="role"
              label="I am registering as"
              value={role}
              onChange={setRole}
              error={errors.role}
            />

            <PasswordField
              name="password"
              label="Password"
              placeholder="Enter your password"
              error={errors.password}
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />

            <PasswordField
              name="confirmPassword"
              label="Confirm password"
              placeholder="Re-enter your password"
              error={errors.confirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
            />

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-indigo-500 py-3.5 font-semibold text-white transition hover:bg-indigo-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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

            <div className="flex items-center gap-3 pt-2">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-zinc-500">Or register with</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-2 gap-3 pb-2">
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

      {/* Kill browser autofill styling so inputs stay dark */}
      <style jsx global>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #1e1c2b inset !important;
          -webkit-text-fill-color: #f4f4f5 !important;
          caret-color: #f4f4f5 !important;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>
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
          error ? "ring-1 ring-rose-500 focus:ring-rose-500" : "focus:ring-indigo-500"
        }`}
      />
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

function PasswordField({
  name,
  label,
  placeholder,
  error,
  show,
  onToggle,
}: {
  name: string;
  label: string;
  placeholder: string;
  error?: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm text-zinc-400">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl bg-[#1e1c2b] px-4 py-3.5 pr-11 text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 ${
            error ? "ring-1 ring-rose-500 focus:ring-rose-500" : "focus:ring-indigo-500"
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

function RoleField({
  name,
  label,
  value,
  onChange,
  error,
}: {
  name: string;
  label: string;
  value: Role;
  onChange: (role: Role) => void;
  error?: string;
}) {
  const options: { value: Role; label: string }[] = [
    { value: "customer", label: "Customer" },
    { value: "driver", label: "Driver" },
    { value: "owner", label: "Owner" },
  ];

  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-400">{label}</label>
      {/* Hidden input keeps this participating in FormData like the other fields */}
      <input type="hidden" name={name} value={value} />
      <div
        role="radiogroup"
        aria-label={label}
        className={`grid grid-cols-3 gap-2 rounded-xl border p-1 ${
          error ? "border-rose-500" : "border-white/10"
        } bg-[#1e1c2b]`}
      >
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={`rounded-lg py-2.5 text-sm font-medium transition ${
                selected
                  ? "bg-indigo-500 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
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