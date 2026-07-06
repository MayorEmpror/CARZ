import { carDetails } from "@/lib/api/car";

// ---------- helpers ----------

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

// Draws a semicircle arc from 180deg (left) to 0deg (right) for a given percent (0-100)
function describeArc(cx: number, cy: number, r: number, startPct: number, endPct: number) {
  const startAngle = 180 * (1 - startPct / 100);
  const endAngle = 180 * (1 - endPct / 100);
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = Math.abs(startAngle - endAngle) <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function computeScore(car: {
  top_speed: number;
  acceleration_0_100: number;
  engine_power: number;
  torque: number;
}) {
  // Normalize each stat against a rough "high performance" ceiling, weight equally.
  const speedScore = Math.min(car.top_speed / 220, 1);
  const accelScore = Math.min(Math.max((9 - car.acceleration_0_100) / 8, 0), 1);
  const powerScore = Math.min(car.engine_power / 600, 1);
  const torqueScore = Math.min(car.torque / 650, 1);
  const avg = (speedScore + accelScore + powerScore + torqueScore) / 4;
  return Math.round(avg * 500) / 100; // 0.00 - 5.00 scale, matches gauge below
}

function scoreLabel(score: number) {
  if (score >= 3.5) return { text: "Sport", color: "bg-green-500/20 text-green-400" };
  if (score >= 2) return { text: "Balanced", color: "bg-yellow-500/20 text-yellow-400" };
  return { text: "Comfort", color: "bg-neutral-700 text-neutral-300" };
}

function StarRow({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`w-4 h-4 ${i < full ? "fill-yellow-400" : "fill-neutral-700"}`}
        >
          <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
        </svg>
      ))}
    </div>
  );
}

function SpecCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0F0F14] rounded-xl px-4 py-3 border border-white/5">
      <p className="text-neutral-500 text-xs">{label}</p>
      <p className="text-white text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function Gauge({ value, max = 5 }: { value: number; max?: number }) {
  const cx = 140;
  const cy = 130;
  const r = 100;
  const pct = Math.min((value / max) * 100, 100);

  const bgPath = describeArc(cx, cy, r, 0, 100);
  const fgPath = describeArc(cx, cy, r, 0, pct);

  const ticks = [0, 1, 2, 3, 4, 5];

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 280 150" className="w-full max-w-[280px]">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
        </defs>
        <path d={bgPath} stroke="#27272a" strokeWidth={14} fill="none" strokeLinecap="round" />
        <path
          d={fgPath}
          stroke="url(#gaugeGradient)"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        {ticks.map((t) => {
          const angle = 180 * (1 - t / max);
          const pos = polarToCartesian(cx, cy, r + 22, angle);
          return (
            <text
              key={t}
              x={pos.x}
              y={pos.y}
              fontSize="10"
              fill="#6b7280"
              textAnchor="middle"
            >
              {t}
            </text>
          );
        })}
      </svg>
      <div className="absolute top-[58px] flex flex-col items-center">
        <span className="text-white text-4xl font-semibold">{value.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ---------- page ----------

export default async function CarDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const carperf = await carDetails(id);

  if (!carperf) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B10] text-white text-2xl">
        Car not found
      </div>
    );
  }

  const {
    make,
    model,
    year,
    price,
    status,
    rating,
    rating_count,
    image_url,
    mileage,
    top_speed,
    acceleration_0_100,
    engine_power,
    torque,
    fuel_efficiency,
  } = carperf;

  const score = computeScore({ top_speed, acceleration_0_100, engine_power, torque });
  const label = scoreLabel(score);
  const efficiencyPct = Math.min((fuel_efficiency / 50) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0B0B10] p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Hero */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-neutral-800 to-neutral-900 h-[360px] border border-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image_url}
              alt={`${make} ${model}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
            <span
              className={`absolute top-5 left-5 px-3 py-1 rounded-full text-xs font-medium ${
                status === "Available"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-neutral-700 text-neutral-300"
              }`}
            >
              {status}
            </span>
            <div className="absolute bottom-5 left-5">
              <h1 className="text-3xl font-semibold text-white">
                {make} {model}
              </h1>
              <p className="text-neutral-400 text-sm mt-1">
                {year} · {mileage.toLocaleString()} mi
              </p>
            </div>
          </div>

          {/* Quick Specs panel */}
          <div className="bg-[#131318] rounded-2xl p-6 border border-white/5">
            <h2 className="text-white text-xl font-semibold">Quick Specs</h2>
            <p className="text-neutral-500 text-sm mt-1">
              Key performance figures for this {make} {model}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <SpecCard label="Top Speed" value={`${top_speed} mph`} />
              <SpecCard label="0-100 mph" value={`${acceleration_0_100}s`} />
              <SpecCard label="Engine Power" value={`${engine_power} hp`} />
              <SpecCard label="Torque" value={`${torque} lb-ft`} />
            </div>

            {/* Efficiency bar (replaces LTV bar) */}
            <div className="mt-6">
              <div className="flex justify-between text-sm">
                <span className="text-white font-medium">Fuel Efficiency</span>
                <span className="text-white font-semibold">{fuel_efficiency} mpg</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-800 mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-green-400"
                  style={{ width: `${efficiencyPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-neutral-500 mt-2">
                <span>Economical</span>
                <span>Balanced</span>
                <span>Sporty</span>
              </div>
            </div>

            <button className="w-full mt-6 bg-violet-300 hover:bg-violet-400 text-black font-medium py-3 rounded-xl transition-colors">
              View Full Report
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Price card (replaces Borrow Rate) */}
          <div className="bg-[#131318] rounded-2xl p-6 border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-neutral-400 text-sm">Price</p>
              <p className="text-white text-3xl font-semibold mt-2">
                ${Number(price).toLocaleString()}
              </p>
            </div>
            <svg viewBox="0 0 64 64" className="w-14 h-14 text-violet-300">
              <path
                fill="currentColor"
                d="M8 40h4l4-10a4 4 0 0 1 3.7-2.5h24.6A4 4 0 0 1 48 30l4 10h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4a6 6 0 0 1-12 0H22a6 6 0 0 1-12 0H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2Zm8-2h32l-3-8H19l-3 8Zm0 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm32 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
              />
            </svg>
          </div>

          {/* Performance Score gauge (replaces Health Factor) */}
          <div className="bg-[#131318] rounded-2xl p-6 border border-white/5">
            <div className="flex justify-between items-center">
              <h3 className="text-white font-semibold">Performance Score</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${label.color}`}>
                {label.text}
              </span>
            </div>
            <Gauge value={score} />
            <div className="flex justify-between text-sm mt-2 border-t border-white/5 pt-4">
              <div>
                <p className="text-neutral-500">0-100 mph</p>
                <p className="text-white font-medium">{acceleration_0_100}s</p>
              </div>
              <div className="text-right">
                <p className="text-neutral-500">Engine Power</p>
                <p className="text-white font-medium">{engine_power} hp</p>
              </div>
            </div>
          </div>

          {/* Rating card */}
          <div className="bg-[#131318] rounded-2xl p-6 border border-white/5">
            <h3 className="text-white font-semibold">Rating</h3>
            <div className="flex items-center gap-2 mt-3">
              <StarRow rating={Number(rating)} />
              <span className="text-white font-semibold">{rating}</span>
            </div>
            <p className="text-neutral-500 text-sm mt-1">{rating_count} reviews</p>
          </div>
        </div>
      </div>
    </div>
  );
}