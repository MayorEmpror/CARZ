import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">CARZ</h1>

      <nav className="flex gap-4">
        <Link
          href="/showroom"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition"
        >
          Showroom
        </Link>

        <Link
          href="/admin"
          className="rounded-lg bg-gray-800 px-6 py-3 text-white hover:bg-gray-900 transition"
        >
          Admin
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-gray-800 px-6 py-3 text-white hover:bg-gray-900 transition"
        >
          Register
        </Link>
      </nav>
    </main>
  );
}