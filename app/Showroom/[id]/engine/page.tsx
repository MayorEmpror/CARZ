import { getCarEngineById } from "@/lib/api/engine";
import CarModelViewer from "@/components/CarModelViewer/CarModelViewer";
import { Gauge, ArrowUpRight, Flame, Wind } from "lucide-react";
import { Link } from "next-transition-router";

const MODEL_URL =
  "https://komfiysvyopiflyzeems.supabase.co/storage/v1/object/public/Carz_assets/sbc_v8_engine.glb";

// ---------- helpers ----------

function computeScore(engine: {
  max_power_hp: number | null;
  max_torque_nm: number | null;
  redline_rpm: number | null;
}) {
  const powerScore = Math.min((engine.max_power_hp ?? 0) / 700, 1);
  const torqueScore = Math.min((engine.max_torque_nm ?? 0) / 700, 1);
  const redlineScore = Math.min((engine.redline_rpm ?? 0) / 9000, 1);
  const avg = (powerScore + torqueScore + redlineScore) / 3;
  return Math.round(avg * 500) / 100;
}

function scoreLabel(score: number) {
  if (score >= 3.5) return { text: "Track", color: "bg-green-500/20 text-green-400" };
  if (score >= 2) return { text: "Balanced", color: "bg-yellow-500/20 text-yellow-400" };
  return { text: "Daily", color: "bg-neutral-500/20 text-neutral-300" };
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

// ---------- page ----------

export default async function EnginePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const carId = Number(id);
  const engine = await getCarEngineById(carId);

  if (!engine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B10] text-white text-2xl">
        Engine not found
      </div>
    );
  }

  const {
    engine_name,
    engine_code,
    manufacturer,
    engine_type,
    cylinder_count,
    cylinder_arrangement,
    displacement_liters,
    compression_ratio,
    aspiration_type,
    fuel_type,
    max_power_hp,
    max_torque_nm,
    redline_rpm,
    idle_rpm,
    max_power_rpm,
  } = engine;

  const score = computeScore({ max_power_hp, max_torque_nm, redline_rpm });
  const label = scoreLabel(score);

  const redlineForBar = redline_rpm ?? 1;
  const idlePct = Math.min(((idle_rpm ?? 0) / redlineForBar) * 100, 100);
  const peakPct = Math.min(((max_power_rpm ?? 0) / redlineForBar) * 100, 100);

  return (
    <div className="min-h-screen relative overflow-hidden pointer-events-none bg-[#0B0B10]">
      <CarModelViewer
        ReflectorOn={true}
        modelUrl={MODEL_URL} />

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
          <Link
            href={`/car/${carId}`}
            className="px-4 py-2 rounded-full text-sm transition-colors bg-white/5 backdrop-blur-md border border-white/10 text-neutral-300 hover:bg-white/10"
          >
            Back to Car
          </Link>
        </nav>
      </div>

      {/* Title block */}
      <div className="relative z-10 px-8 mt-4 pointer-events-none">
        <h1 className="text-5xl font-semibold text-white tracking-tight">
          {engine_name ?? engine_code ?? "Unnamed Engine"}
        </h1>
        <p className="text-neutral-400 mt-2">
          {label.text} Engine {manufacturer ? `— ${manufacturer}` : ""}
        </p>
        <p className="text-4xl font-semibold text-white mt-4">
          {max_power_hp ?? "—"} <span className="text-2xl text-neutral-400">HP</span>
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
        <StatPill icon={<Gauge className="w-6 h-6" />} label="Power" value={`${max_power_hp ?? "—"} hp`} />
        <StatPill icon={<ArrowUpRight className="w-6 h-6" />} label="Torque" value={`${max_torque_nm ?? "—"} N·m`} />
        <StatPill icon={<Flame className="w-6 h-6" />} label="Redline" value={`${redline_rpm ?? "—"} rpm`} />
      </div>

      {/* Right stat column */}
      <div className="absolute right-8 top-[140px] z-10 flex flex-col gap-4 w-[260px] pointer-events-auto">
        <StatPill icon={<Gauge className="w-6 h-6" />} label="Displacement" value={`${displacement_liters ?? "—"} L`} />
        <StatPill icon={<Wind className="w-6 h-6" />} label="Compression" value={compression_ratio ? `${compression_ratio}:1` : "—"} />

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
          <h3 className="text-white font-semibold text-sm">Configuration</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-white font-semibold text-sm">
              {cylinder_count ?? "—"} cyl • {cylinder_arrangement ?? engine_type ?? "—"}
            </span>
          </div>
          <p className="text-neutral-400 text-xs mt-1">
            {aspiration_type ?? "—"} • {fuel_type ?? "—"}
          </p>
        </GlassCard>
      </div>

      {/* Power band bar, bottom left */}
      <div className="absolute left-8 bottom-8 z-10 pointer-events-auto">
        <GlassCard className="px-5 py-4 w-[320px]">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-300 font-medium">Power Band</span>
            <span className="text-white font-semibold">{max_power_rpm ?? "—"} rpm</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 mt-3 overflow-hidden relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-green-400"
              style={{ width: `${peakPct}%` }}
            />
            <div className="absolute top-0 h-full w-0.5 bg-white/60" style={{ left: `${idlePct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-neutral-500 mt-2">
            <span>Idle</span>
            <span>Peak Power</span>
            <span>Redline</span>
          </div>
        </GlassCard>
      </div>

      {/* CTA, bottom right */}
      <div className="absolute right-8 bottom-8 z-10 pointer-events-auto">
        <GlassCard className="p-5 w-[260px]">
          <p className="text-white font-semibold text-sm">View Full Report</p>
          <p className="text-neutral-400 text-xs mt-1">
            Full spec sheet, materials, and service history.
          </p>
          <Link
            href={`/engine/${carId}/full`}
            className="w-full mt-4 bg-violet-300 hover:bg-violet-400 text-black font-medium py-3 rounded-xl transition-colors block text-center"
          >
            View Full Report
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}