import { carDetails } from "@/lib/api/car";
import CarModelViewer from "@/components/CarModelViewer/CarModelViewer";
import { Gauge, ArrowUpRight, Fuel, Star } from "lucide-react";
import {Link} from "next-transition-router";
// ---------- helpers ----------

function computeScore(car: {
  top_speed: number;
  acceleration_0_100: number;
  engine_power: number;
  torque: number;
}) {
  const speedScore = Math.min(car.top_speed / 220, 1);
  const accelScore = Math.min(Math.max((9 - car.acceleration_0_100) / 8, 0), 1);
  const powerScore = Math.min(car.engine_power / 600, 1);
  const torqueScore = Math.min(car.torque / 650, 1);
  const avg = (speedScore + accelScore + powerScore + torqueScore) / 4;
  return Math.round(avg * 500) / 100;
}

function scoreLabel(score: number) {
  if (score >= 3.5) return { text: "Sport", color: "bg-green-500/20 text-green-400" };
  if (score >= 2) return { text: "Balanced", color: "bg-yellow-500/20 text-yellow-400" };
  return { text: "Comfort", color: "bg-neutral-500/20 text-neutral-300" };
}

// Glass card shell — dark frosted panel
function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] ${className}`}
    >
      {children}
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <GlassCard className="px-5 py-4 flex items-center justify-between gap-6 min-w-[180px]">
      <div>
        <p className="text-neutral-400 text-xs">{label}</p>
        <p className="text-white text-lg font-semibold mt-1">{value}</p>
      </div>
      <div className="text-neutral-500">{icon}</div>
    </GlassCard>
  );
}

function StarRow({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < full ? "fill-yellow-400 text-yellow-400" : "fill-neutral-700 text-neutral-700"}`}
        />
      ))}
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
    price,
    rating,
    rating_count,
    top_speed,
    acceleration_0_100,
    engine_power,
    torque,
    fuel_efficiency,
    model_path,
  } = carperf;

  const score = computeScore({ top_speed, acceleration_0_100, engine_power, torque });
  const label = scoreLabel(score);
  const efficiencyPct = Math.min((fuel_efficiency / 50) * 100, 100);
  
  return (
    <div className="min-h-screen relative overflow-hidden pointer-events-none bg-[#0B0B10]">
      <CarModelViewer modelUrl={model_path}/>

      {/* Top nav */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6 pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-white" />
          <div>
            <p className="text-white font-semibold leading-none">Luxon</p>
            <p className="text-neutral-500 text-[10px] leading-none mt-0.5">Prime Cars Collection</p>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          {["Models", "Services", "Shop", "Purchase", "Contact"].map((item, i) => (
            <button
              key={item}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                i === 0
                  ? "bg-white text-neutral-900"
                  : "bg-white/5 backdrop-blur-md border border-white/10 text-neutral-300 hover:bg-white/10"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

     

      {/* Title block */}
      <div className="relative z-10 px-8 mt-4 pointer-events-none">
        <h1 className="text-5xl font-semibold text-white tracking-tight">
          {make} {model}
        </h1>
        <p className="text-neutral-400 mt-2">{label.text} Edition</p>
        <p className="text-4xl font-semibold text-white mt-4">
          ${Number(price).toLocaleString()}
        </p>
      </div>

      {/* Left stat column */}
      <div className="absolute left-8 top-[240px] z-10 flex flex-col gap-4 pointer-events-auto">
      <Link
          href="/showroom"
          className="rounded-lg z-10 mt-5 relative bg-slate-700 px-6 py-3 text-white hover:bg-slate-600 transition"
        >
          Showroom
        </Link>
        <StatPill icon={<Gauge className="w-6 h-6" />} label="Top Speed" value={`${top_speed} mph`} />
        <StatPill icon={<ArrowUpRight className="w-6 h-6" />} label="0-100 mph" value={`${acceleration_0_100}s`} />
        <StatPill icon={<Fuel className="w-6 h-6" />} label="Fuel Efficiency" value={`${fuel_efficiency} mpg`} />
      </div>

      {/* Right stat column */}
      <div className="absolute right-8 top-[140px] z-10 flex flex-col gap-4 w-[260px] pointer-events-auto">
        <StatPill icon={<Gauge className="w-6 h-6" />} label="Engine Power" value={`${engine_power} hp`} />
        <StatPill icon={<Gauge className="w-6 h-6" />} label="Torque" value={`${torque} lb-ft`} />

        <GlassCard className="p-5">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-semibold text-sm">Performance</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${label.color}`}>{label.text}</span>
          </div>
          <p className="text-white text-3xl font-semibold mt-3">{score.toFixed(2)}</p>
          <div className="h-1.5 rounded-full bg-white/10 mt-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-green-400"
              style={{ width: `${(score / 5) * 100}%` }}
            />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-white font-semibold text-sm">Rating</h3>
          <div className="flex items-center gap-2 mt-2">
            <StarRow rating={Number(rating)} />
            <span className="text-white font-semibold text-sm">{rating}</span>
          </div>
          <p className="text-neutral-400 text-xs mt-1">{rating_count} reviews</p>
        </GlassCard>
      </div>

      {/* Fuel efficiency bar, bottom left */}
      <div className="absolute left-8 bottom-8 z-10 pointer-events-auto">
        <GlassCard className="px-5 py-4 w-[320px]">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-300 font-medium">Fuel Efficiency</span>
            <span className="text-white font-semibold">{fuel_efficiency} mpg</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 mt-3 overflow-hidden">
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
        </GlassCard>
      </div>

      {/* CTA, bottom right */}
      <div className="absolute right-8 bottom-8 z-10 pointer-events-auto">
        <GlassCard className="p-5 w-[260px]">
          <p className="text-white font-semibold text-sm">View Full Report</p>
          <p className="text-neutral-400 text-xs mt-1">
            Full spec sheet, history, and inspection details.
          </p>
          <button className="w-full mt-4 bg-violet-300 hover:bg-violet-400 text-black font-medium py-3 rounded-xl transition-colors">
            View Full Report
          </button>
        </GlassCard>
      </div>
    </div>
  );
}