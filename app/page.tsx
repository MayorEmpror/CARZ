import { Link } from "next-transition-router";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <span className="text-xl font-bold tracking-tight">AutoLink</span>
        <nav className="flex gap-8 text-sm text-neutral-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#fleet" className="hover:text-white transition">Fleet</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
        </nav>
        <div className="flex gap-3">
          <Link
            href="/register"
            className="rounded-lg px-4 py-2 text-sm border border-neutral-700 hover:border-neutral-500 transition"
          >
            Sign up
          </Link>
          <Link
            href="/showroom"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 transition"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-8 pt-24 pb-32 text-center">
        <span className="inline-block rounded-full bg-neutral-900 border border-neutral-800 px-4 py-1 text-xs text-neutral-400 mb-6">
          Lorem ipsum dolor sit amet
        </span>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
          Consectetur adipiscing <span className="text-blue-500">elit</span>
        </h1>
        <p className="mt-6 text-lg text-neutral-400 max-w-2xl mx-auto">
          Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/showroom"
            className="rounded-lg bg-blue-600 px-8 py-3 font-medium hover:bg-blue-700 transition"
          >
            Browse Showroom
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-neutral-700 px-8 py-3 font-medium hover:border-neutral-500 transition"
          >
            Admin Dashboard
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-8 py-24 grid md:grid-cols-3 gap-8">
        {[
          {
            title: "Duis aute irure",
            desc: "Dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
          },
          {
            title: "Excepteur sint",
            desc: "Occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.",
          },
          {
            title: "Id est laborum",
            desc: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl bg-neutral-900 border border-neutral-800 p-8 hover:border-neutral-700 transition"
          >
            <div className="h-10 w-10 rounded-lg bg-blue-600/20 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-neutral-400">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Fleet preview */}
      <section id="fleet" className="max-w-6xl mx-auto px-8 py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold">Nemo enim ipsam</h2>
            <p className="text-neutral-400 mt-2">
              Voluptatem quia voluptas sit aspernatur aut odit aut fugit.
            </p>
          </div>
          <Link href="/showroom" className="text-blue-500 text-sm hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden"
            >
              <div className="h-40 bg-neutral-800" />
              <div className="p-4">
                <h4 className="font-medium">Lorem Model {i + 1}</h4>
                <p className="text-xs text-neutral-500 mt-1">From $99/day</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-8 py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ut enim ad minima veniam
        </h2>
        <p className="text-neutral-400 mb-8">
          Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse.
        </p>
        <Link
          href="/register"
          className="rounded-lg bg-blue-600 px-8 py-3 font-medium hover:bg-blue-700 transition inline-block"
        >
          Create an account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-10 text-center text-sm text-neutral-500">
        © 2026 AutoLink. Lorem ipsum dolor sit amet consectetur.
      </footer>
    </main>
  );
}