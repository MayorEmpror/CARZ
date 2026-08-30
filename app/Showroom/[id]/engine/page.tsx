import { getCarEngineById } from "@/lib/api/engine";
import CarModelViewer from "@/components/CarModelViewer/CarModelViewer";
import {
  Gauge,
  Fuel,
  Cog,
  Boxes,
  Wrench,
  LayoutGrid,
  ChevronDown,
  ArrowUpRight,
  Droplet,
  Ruler,
} from "lucide-react";
import { Link } from "next-transition-router";

const MODEL_URL =
  "https://komfiysvyopiflyzeems.supabase.co/storage/v1/object/public/Carz_assets/sbc_v8_engine.glb";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutGrid, href: "#overview", active: true },
  { label: "Performance", icon: Gauge, href: "#performance" },
  { label: "Construction", icon: Boxes, href: "#construction" },
  { label: "Fuel & Induction", icon: Fuel, href: "#fuel" },
  { label: "Systems", icon: Cog, href: "#systems" },
  { label: "Drivetrain", icon: Wrench, href: "#drivetrain" },
];

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

// One label/value row inside a right-panel section
function StatRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-neutral-400">{label}</span>
      <span className="text-white font-medium text-right">
        {value === null || value === undefined || value === "" ? "—" : value}
      </span>
    </div>
  );
}

// A titled group of StatRows in the right panel — mirrors the
// "Watchlist / Top Gainers / Top Losers" grouping in the reference.
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id}>
      <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1">{title}</p>
      <div className="divide-y divide-white/5">{children}</div>
    </div>
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
    engine_code,
    engine_name,
    manufacturer,
    country_of_origin,
    engine_type,
    cylinder_count,
    cylinder_arrangement,
    displacement_cc,
    displacement_liters,
    bore_mm,
    stroke_mm,
    compression_ratio,
    valve_mechanism,
    valves_per_cylinder,
    total_valves,
    fuel_type,
    fuel_delivery_system,
    aspiration_type,
    turbo_boost_pressure_bar,
    fuel_tank_compatibility_l,
    max_power_hp,
    max_power_rpm,
    max_torque_nm,
    max_torque_rpm,
    idle_rpm,
    redline_rpm,
    power_to_weight_ratio,
    cooling_system,
    ignition_system,
    lubrication_system,
    emission_standard,
    start_stop_system,
    is_hybrid,
    hybrid_system_type,
    electric_motor_power_kw,
    battery_capacity_kwh,
    block_material,
    head_material,
    weight_kg,
    engine_layout_position,
    engine_orientation,
    drive_type_compatibility,
    transmission_compatibility,
    oil_capacity_liters,
    oil_type_recommended,
    coolant_capacity_liters,
    production_start_year,
    production_end_year,
    warranty_period_months,
  } = engine;

  const score = computeScore({ max_power_hp, max_torque_nm, redline_rpm });
  const label = scoreLabel(score);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0B0B10] text-white">
      <CarModelViewer modelUrl={MODEL_URL} ReflectorOn={true}/>

      {/* Left sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-60 z-20 bg-[#0B0B10]/95 backdrop-blur-xl border-r border-white/10 flex flex-col pointer-events-auto">
        <div className="px-6 py-6 flex items-center gap-2 border-b border-white/10">
          <div className="w-7 h-7 rounded-md bg-white shrink-0" />
          <span className="font-semibold tracking-wide truncate">
            {manufacturer ? manufacturer.toUpperCase() : "ENGINE"}
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active
                  ? "bg-white text-neutral-900 font-medium"
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </a>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 space-y-1">
          <Link
            href={`/showroom/${carId}`}
            className="flex items-center justify-between text-xs text-neutral-400 hover:text-white px-2 py-2"
          >
            Back to Car <ArrowUpRight className="w-3 h-3" />
          </Link>
          <Link
            href={`/engine/${carId}/full`}
            className="flex items-center justify-between text-xs text-neutral-400 hover:text-white px-2 py-2"
          >
            Full Spec Sheet <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </aside>

      {/* Top bar */}
      <header className="fixed top-0 left-60 right-80 h-16 z-20 flex items-center justify-between px-6 bg-[#0B0B10]/70 backdrop-blur-xl border-b border-white/10 pointer-events-auto">
        <p className="text-neutral-300 text-sm">Overview</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-300">
            <Fuel className="w-3.5 h-3.5" />
            {fuel_type ?? "—"}
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-300">
            <Wrench className="w-3.5 h-3.5" />
            {weight_kg ?? "—"} kg
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-1 pr-3 py-1 text-xs text-neutral-300">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-600" />
            {engine_code ?? "—"}
          </div>
        </div>
      </header>

      {/* Right metrics panel */}
      <aside className="fixed right-0 top-0 h-screen w-80 z-20 bg-[#0B0B10]/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto pointer-events-auto px-5 py-6 pt-8 space-y-6">
        <div>
          <p className="text-neutral-500 text-xs">{engine_name ?? "Engine Dossier"}</p>
          <h2 className="text-white text-lg font-semibold mt-0.5">Metrics</h2>
        </div>

        <Section id="performance" title="Performance">
          <StatRow label="Max Power" value={`${max_power_hp ?? "—"} hp @ ${max_power_rpm ?? "—"} rpm`} />
          <StatRow label="Max Torque" value={`${max_torque_nm ?? "—"} N·m @ ${max_torque_rpm ?? "—"} rpm`} />
          <StatRow label="Idle Speed" value={`${idle_rpm ?? "—"} rpm`} />
          <StatRow label="Redline" value={`${redline_rpm ?? "—"} rpm`} />
          <StatRow label="Power-to-Weight" value={power_to_weight_ratio ?? "—"} />
          <StatRow label="Compression" value={compression_ratio ? `${compression_ratio}:1` : "—"} />
        </Section>

        <Section id="construction" title="Construction">
          <StatRow label="Cylinders" value={`${cylinder_count ?? "—"} · ${cylinder_arrangement ?? "—"}`} />
          <StatRow label="Valvetrain" value={valve_mechanism} />
          <StatRow label="Valves" value={`${valves_per_cylinder ?? "—"}/cyl · ${total_valves ?? "—"} total`} />
          <StatRow label="Bore x Stroke" value={`${bore_mm ?? "—"} x ${stroke_mm ?? "—"} mm`} />
          <StatRow label="Displacement" value={`${displacement_liters ?? "—"} L (${displacement_cc ?? "—"} cc)`} />
          <StatRow label="Block Material" value={block_material} />
          <StatRow label="Head Material" value={head_material} />
          <StatRow label="Weight" value={weight_kg ? `${weight_kg} kg` : "—"} />
          <StatRow label="Layout" value={`${engine_layout_position ?? "—"} · ${engine_orientation ?? "—"}`} />
        </Section>

        <Section id="fuel" title="Fuel & Induction">
          <StatRow label="Fuel Type" value={fuel_type} />
          <StatRow label="Delivery" value={fuel_delivery_system} />
          <StatRow label="Aspiration" value={aspiration_type} />
          <StatRow label="Boost Pressure" value={turbo_boost_pressure_bar ? `${turbo_boost_pressure_bar} bar` : "—"} />
          <StatRow label="Fuel Tank Compat." value={fuel_tank_compatibility_l ? `${fuel_tank_compatibility_l} L` : "—"} />
          <StatRow label="Oil Capacity" value={oil_capacity_liters ? `${oil_capacity_liters} L` : "—"} />
          <StatRow label="Oil Type" value={oil_type_recommended} />
          <StatRow label="Coolant Capacity" value={coolant_capacity_liters ? `${coolant_capacity_liters} L` : "—"} />
        </Section>

        <Section id="systems" title="Systems">
          <StatRow label="Cooling" value={cooling_system} />
          <StatRow label="Ignition" value={ignition_system} />
          <StatRow label="Lubrication" value={lubrication_system} />
          <StatRow label="Emissions" value={emission_standard} />
          <StatRow label="Start/Stop" value={start_stop_system ? "Enabled" : "Not Equipped"} />
          <StatRow label="Hybrid" value={is_hybrid ? hybrid_system_type ?? "Hybrid" : "No"} />
          <StatRow label="Electric Motor" value={electric_motor_power_kw ? `${electric_motor_power_kw} kW` : "—"} />
          <StatRow label="Battery" value={battery_capacity_kwh ? `${battery_capacity_kwh} kWh` : "—"} />
        </Section>

        <Section id="drivetrain" title="Drivetrain & Lifecycle">
          <StatRow label="Manufacturer" value={manufacturer} />
          <StatRow label="Origin" value={country_of_origin} />
          <StatRow label="Engine Type" value={engine_type} />
          <StatRow label="Engine Code" value={engine_code} />
          <StatRow label="Drive Type" value={drive_type_compatibility} />
          <StatRow label="Transmission" value={transmission_compatibility} />
          <StatRow label="Production" value={`${production_start_year ?? "—"}–${production_end_year ?? "Present"}`} />
          <StatRow label="Warranty" value={warranty_period_months ? `${warranty_period_months} months` : "—"} />
        </Section>
      </aside>

      {/* Middle content, floating over the model */}
      <main id="overview" className="relative z-10 pl-60 pr-80 pt-16 min-h-screen pointer-events-none">
        <div className="px-8 py-8 flex flex-col gap-4 max-w-sm">
          <GlassCard className="p-4 pointer-events-auto">
            <p className="text-neutral-400 text-xs">Performance Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-semibold">{score.toFixed(2)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${label.color}`}>{label.text}</span>
            </div>
          </GlassCard>

          <GlassCard className="p-5 pointer-events-auto">
            <h1 className="text-white font-semibold text-2xl tracking-tight">
              {engine_name ?? engine_code ?? "Unnamed Engine"}
            </h1>
            <p className="text-neutral-400 text-xs mt-2 leading-relaxed">
              {manufacturer ?? "Unknown manufacturer"}
              {country_of_origin ? ` · ${country_of_origin}` : ""} — {engine_type ?? "engine"} producing{" "}
              {max_power_hp ?? "—"} hp and {max_torque_nm ?? "—"} N·m.
            </p>
            <Link
              href={`/engine/${carId}/full`}
              className="inline-block mt-4 text-xs font-medium bg-violet-300 hover:bg-violet-400 text-black px-4 py-2 rounded-lg transition-colors"
            >
              View Full Report
            </Link>
          </GlassCard>

          <GlassCard className="p-5 pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-300 shrink-0">
                <Droplet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Recommended Fluids</p>
                <p className="text-neutral-500 text-xs">
                  {oil_type_recommended ?? "—"} · {oil_capacity_liters ?? "—"} L oil
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Quick specs, bottom-left */}
        <div className="absolute left-8 bottom-8 pointer-events-auto">
          <GlassCard className="px-5 py-4 w-[300px]">
            <p className="text-neutral-400 text-xs mb-3">Quick Specs</p>
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
              <span className="flex items-center gap-2 text-neutral-300">
                <Ruler className="w-4 h-4 text-neutral-500" /> Displacement
              </span>
              <span className="text-white font-medium">{displacement_liters ?? "—"} L</span>
            </div>
            <div className="flex items-center justify-between text-sm py-1.5">
              <span className="flex items-center gap-2 text-neutral-300">
                <Boxes className="w-4 h-4 text-neutral-500" /> Weight
              </span>
              <span className="text-white font-medium">{weight_kg ?? "—"} kg</span>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}