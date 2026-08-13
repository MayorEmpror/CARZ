'use client';

import { useMemo, useState, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type { LatLng, TripRoute } from './Maps';

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SETUP
 * ─────────────────────────────────────────────────────────────────────────
 * 1. npm install leaflet react-leaflet
 *    npm install -D @types/leaflet
 * 2. npm install three @react-three/fiber @react-three/drei
 * 3. Place Maps.tsx and AmbientBackground3D.tsx next to this file
 *    (same folder).
 * 4. Tailwind CSS must be configured in the project (tailwind.config +
 *    globals.css with @tailwind directives).
 * ─────────────────────────────────────────────────────────────────────────
 */

// Leaflet touches `window`, so it's client-only.
const TripMap = dynamic(() => import('./Maps'), {
  ssr: false,
  loading: () => <MapFallback text="Loading map…" />,
});
const AmbientBackground3D = dynamic(() => import('./Ambientbackground3d'), { ssr: false });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TripStatus = 'Active' | 'Completed';

interface Trip {
  id: string;
  name: string;
  date: string;
  status: TripStatus;
  earned: number;
  avatar: string;
}

interface TripDetail {
  id: string;
  date: string;
  status: TripStatus;
  customer: { name: string; dob: string; avatar: string };
  car: { name: string; rating: number; mileage: string; gearbox: string };
  payment: { rent: number; fines: number; deposit: string; bank: string; last4: string };
  stats: {
    distance: string;
    time: string;
    maxSpeed: string;
    fuel: string;
    passengers: number;
    road: string;
  };
  route: TripRoute;
  fuelStops: LatLng[];
}

interface IconProps {
  className?: string;
}

interface SidebarIconDef {
  key: string;
  icon: ComponentType<IconProps>;
  active?: boolean;
  badge?: boolean;
}

// ---------------------------------------------------------------------------
// Sample data — swap for real API data
// ---------------------------------------------------------------------------
const TRIPS: Trip[] = [
  { id: '1030', name: 'Henry Cummings', date: 'Monday, 15 June 2020', status: 'Active', earned: 26.44, avatar: 'https://i.pravatar.cc/80?img=13' },
  { id: '1029', name: 'Susan Parker', date: 'Monday, 15 June 2020', status: 'Active', earned: 84.72, avatar: 'https://i.pravatar.cc/80?img=32' },
  { id: '1028', name: 'Magnussen Peterson', date: 'Monday, 15 June 2020', status: 'Completed', earned: 124.68, avatar: 'https://i.pravatar.cc/80?img=51' },
  { id: '1026', name: 'Nora Salazar', date: 'Sunday, 15 June 2020', status: 'Completed', earned: 12.80, avatar: 'https://i.pravatar.cc/80?img=47' },
  { id: '1025', name: 'Owen Brooks', date: 'Sunday, 15 June 2020', status: 'Completed', earned: 58.10, avatar: 'https://i.pravatar.cc/80?img=15' },
];

const TRIP_DETAIL: TripDetail = {
  id: '1028',
  date: 'Monday, 15 June 2020',
  status: 'Completed',
  customer: { name: 'Magnussen Peterson', dob: '09/08/1995', avatar: 'https://i.pravatar.cc/160?img=51' },
  car: { name: 'Toyota Rav-4 2018', rating: 5, mileage: '56,245 km', gearbox: 'Auto' },
  payment: { rent: 124.68, fines: 0, deposit: 'Returned', bank: 'United Bank', last4: '3456' },
  stats: { distance: '42 km', time: '1h 10m', maxSpeed: '64 km/h', fuel: '12 liters', passengers: 4, road: 'Good' },
  route: {
    start: { label: 'Start point', time: '10:32 AM', address: 'Jones Street 24, Manhattan', lat: 40.7326, lng: -74.0028 },
    stop: { label: 'Stop point', time: '11:28 AM', address: 'Christopher Street 46, Manhattan', lat: 40.7317, lng: -74.0031 },
    finish: { label: 'Finish point', time: '12:40 PM', address: 'Grove Court 32, Manhattan', lat: 40.7335, lng: -74.0071 },
  },
  fuelStops: [
    { lat: 40.7333, lng: -74.0072 },
    { lat: 40.7309, lng: -74.0045 },
    { lat: 40.7340, lng: -74.0018 },
  ],
};

const SIDEBAR_ICONS: SidebarIconDef[] = [
  { key: 'overview', icon: PieIcon },
  { key: 'fleet', icon: CarIcon },
  { key: 'customers', icon: UserIcon },
  { key: 'trips', icon: PinIcon, active: true },
  { key: 'chat', icon: ChatIcon, badge: true },
  { key: 'billing', icon: CardIcon },
];

export default function Services() {
  const [selectedTripId, setSelectedTripId] = useState<string>(TRIP_DETAIL.id);
  const [query, setQuery] = useState<string>('');
  const [topCollapsed, setTopCollapsed] = useState(false);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);

  const filteredTrips = useMemo(
    () => TRIPS.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()) || t.id.includes(query)),
    [query]
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      {/* Ambient R3F particle field, fixed behind everything */}
      <AmbientBackground3D />

      <div className="relative z-10 h-full font-sans">
        <div className="mx-auto grid h-full max-w-[1920px] grid-cols-[76px_260px_1fr]">
          {/* ───────────────────────── Sidebar ───────────────────────── */}
          <aside className="flex h-full flex-col items-center border-r border-[#1F1F1F] bg-[#0A0A0A] py-5.5">
            <div className="mb-10 flex h-11 w-11 items-center justify-center bg-white/10">
              <LogoIcon />
            </div>

            <nav className="flex flex-1 flex-col gap-2.5">
              {SIDEBAR_ICONS.map(({ key, icon: Icon, active, badge }) => (
                <button
                  key={key}
                  type="button"
                  className={`relative flex h-11 w-11 items-center justify-center transition-colors ${
                    active ? 'bg-[#E5E5E5]' : 'bg-transparent hover:bg-white/10'
                  }`}
                >
                  <Icon className={active ? 'stroke-black' : 'stroke-[#8A8A8A]'} />
                  {badge && (
                    <span
                      className={`absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full border-2 bg-[#F5F5F5] ${
                        active ? 'border-[#E5E5E5]' : 'border-[#0A0A0A]'
                      }`}
                    />
                  )}
                </button>
              ))}
            </nav>

            <img
              src="https://i.pravatar.cc/80?img=68"
              alt="Account"
              className="h-10 w-10 rounded-full border-2 border-[#3A3A3A] object-cover"
            />
          </aside>

          {/* ───────────────────────── Trips list ───────────────────────── */}
          <section className="flex h-full min-h-0 flex-col overflow-hidden border-r border-[#1F1F1F] bg-[#0D0D0D]">
            <div className="shrink-0 px-[22px] pb-4 pt-6">
              <h1 className="mb-4 text-[22px] font-bold tracking-tight text-[#F5F5F5]">Trips</h1>
              <div className="flex items-center gap-2.5 rounded-xl border border-[#262626] bg-[#161616] px-3.5 py-2.5">
                <SearchIcon />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="flex-1 bg-transparent text-sm text-[#F5F5F5] outline-none placeholder:text-[#6B6B6B]"
                />
                <FilterIcon />
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-5 pt-1">
              {filteredTrips.map((trip) => {
                const isSelected = trip.id === selectedTripId;
                return (
                  <button
                    key={trip.id}
                    type="button"
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`w-full shrink-0 rounded-2xl border px-4 pb-3.5 pt-4 text-left ${
                      isSelected ? 'border-[#3A3A3A] bg-[#1A1A1A]' : 'border-[#262626] bg-[#161616]'
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span className="text-xs font-semibold tracking-wide text-[#6B6B6B]">#{trip.id}</span>
                      <DotsIcon />
                    </div>
                    <div className="mb-3.5 flex items-center gap-2.5">
                      <img src={trip.avatar} alt={trip.name} className="h-[34px] w-[34px] rounded-full object-cover" />
                      <span className="text-[14.5px] font-semibold text-[#F5F5F5]">{trip.name}</span>
                    </div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-[12.5px] text-[#A3A3A3]">{trip.date}</span>
                      <StatusPill status={trip.status} />
                    </div>
                    <div className="flex items-baseline justify-between border-t border-[#262626] pt-2.5">
                      <span className="text-xs text-[#6B6B6B]">Earned</span>
                      <span className="text-[15px] font-bold text-[#F5F5F5]">${trip.earned.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ───────────────────────── Trip detail — full-bleed map ───────────────────────── */}
          <section className="relative h-full min-h-0 overflow-hidden bg-black">
            {/* Map fills the entire main area, edge to edge, behind everything else */}
            <div className="absolute inset-0 z-0">
              <TripMap route={TRIP_DETAIL.route} fuelStops={TRIP_DETAIL.fuelStops} />
            </div>

            {/*
              Single overlay layer, laid out as a column:
              row 1 = top bar (auto height), row 2 = remaining space, with the
              timeline panel right-aligned inside it. This guarantees the two
              floating panels never overlap, no matter which is collapsed.

              z-[1200] is deliberate: Leaflet's own panes/zoom controls use
              z-index values up to 1000 internally, so anything lower can get
              painted over by the map (most visible mid-zoom). This overlay
              needs to sit above all of that, on every browser.
            */}
            <div className="pointer-events-none absolute inset-4 z-[1200] flex flex-col gap-4">
              {/* ── Top bar: header + stats, collapsible, glass blur ── */}
              <div className="pointer-events-auto shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
                <div className="flex items-center gap-3.5 px-6 py-4">
                  <h2 className="text-[22px] font-bold tracking-tight text-[#F5F5F5]">#{TRIP_DETAIL.id}</h2>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12.5px] text-[#A3A3A3]">
                    {TRIP_DETAIL.date}
                  </span>
                  <StatusPill status={TRIP_DETAIL.status} />
                  <div className="ml-auto flex items-center gap-1">
                    <DotsIcon className="fill-[#A3A3A3]" />
                    <button
                      type="button"
                      onClick={() => setTopCollapsed((v) => !v)}
                      aria-label={topCollapsed ? 'Expand trip stats' : 'Collapse trip stats'}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[#A3A3A3] hover:bg-white/10"
                    >
                      <ChevronDownIcon className={`transition-transform ${topCollapsed ? '-rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                <div
                  className={`grid grid-cols-6 gap-[18px] border-t border-white/10 px-6 transition-[grid-template-rows,opacity,padding] duration-300 ${
                    topCollapsed ? 'py-0 opacity-0' : 'py-4 opacity-100'
                  }`}
                  style={{
                    display: 'grid',
                    gridTemplateRows: topCollapsed ? '0fr' : '1fr',
                  }}
                >
                  <div className="col-span-6 grid grid-cols-6 gap-[18px] overflow-hidden">
                    <Stat label="Total distance" value={TRIP_DETAIL.stats.distance} />
                    <Stat label="Trip time" value={TRIP_DETAIL.stats.time} />
                    <Stat label="Maximum speed" value={TRIP_DETAIL.stats.maxSpeed} />
                    <Stat label="Fuel consumption" value={TRIP_DETAIL.stats.fuel} />
                    <Stat label="Passenger number" value={`${TRIP_DETAIL.stats.passengers} persons`} />
                    <Stat label="Road condition" value={TRIP_DETAIL.stats.road} accentClassName="text-[#34D399]" />
                  </div>
                </div>
              </div>

              {/* ── Remaining space below the top bar — timeline panel lives here ── */}
              <div className="flex min-h-0 flex-1 justify-end">
                <div
                  className={`pointer-events-auto flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl transition-[width] duration-300 ${
                    timelineCollapsed ? 'w-14' : 'w-[300px]'
                  }`}
                >
                  <div
                    className={`flex shrink-0 items-center ${
                      timelineCollapsed ? 'justify-center px-0 py-4' : 'justify-between px-5 pt-4'
                    }`}
                  >
                    {!timelineCollapsed && (
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#A3A3A3]">Route timeline</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setTimelineCollapsed((v) => !v)}
                      aria-label={timelineCollapsed ? 'Expand timeline' : 'Collapse timeline'}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#A3A3A3] hover:bg-white/10"
                    >
                      <ChevronRightIcon className={`transition-transform ${timelineCollapsed ? '-rotate-180' : ''}`} />
                    </button>
                  </div>

                  {!timelineCollapsed && (
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
                      <TimelineItem
                        marker="dot"
                        label={TRIP_DETAIL.route.start.label}
                        time={TRIP_DETAIL.route.start.time}
                        address={TRIP_DETAIL.route.start.address}
                      />
                      <TimelineItem
                        marker="ring"
                        label={TRIP_DETAIL.route.stop.label}
                        time={TRIP_DETAIL.route.stop.time}
                        address={TRIP_DETAIL.route.stop.address}
                      />
                      <TimelineItem
                        marker="square"
                        label={TRIP_DETAIL.route.finish.label}
                        time={TRIP_DETAIL.route.finish.time}
                        address={TRIP_DETAIL.route.finish.address}
                        isLast
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function Stat({
  label,
  value,
  accentClassName,
}: {
  label: string;
  value: string | number;
  accentClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 truncate text-[11.5px] uppercase tracking-wide text-[#6B6B6B]">{label}</div>
      <div className={`truncate text-[15px] font-bold ${accentClassName ?? 'text-[#F5F5F5]'}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: TripStatus }) {
  const isActive = status === 'Active';
  return (
    <span
      className={`rounded-full px-[11px] py-1 text-[11.5px] font-bold ${
        isActive ? 'bg-[#FBBF24]/[0.12] text-[#FBBF24]' : 'bg-[#34D399]/[0.12] text-[#34D399]'
      }`}
    >
      {status}
    </span>
  );
}

type MarkerKind = 'dot' | 'ring' | 'square';

interface TimelineItemProps {
  marker: MarkerKind;
  label: string;
  time: string;
  address: string;
  isLast?: boolean;
}

function TimelineItem({ marker, label, time, address, isLast }: TimelineItemProps) {
  return (
    <div className={`relative flex gap-3.5 ${isLast ? 'pb-0' : 'pb-[26px]'}`}>
      <div className="flex flex-col items-center">
        <MarkerGlyph type={marker} />
        {!isLast && <div className="mt-1 w-px flex-1 bg-white/10" />}
      </div>
      <div>
        <div className="mb-1 text-[11.5px] uppercase tracking-wide text-[#6B6B6B]">{label}</div>
        <div className="text-[13.5px] font-semibold leading-relaxed text-[#F5F5F5]">
          {time} {address}
        </div>
      </div>
    </div>
  );
}

function MarkerGlyph({ type }: { type: MarkerKind }) {
  if (type === 'dot') return <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#D4D4D4]" />;
  if (type === 'ring') return <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-[#D4D4D4]" />;
  return <div className="h-[9px] w-[9px] flex-shrink-0 rounded-sm bg-[#D4D4D4]" />;
}

function MapFallback({ text }: { text: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0D0D0D]">
      <span className="text-[13px] text-[#6B6B6B]">{text}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 20h20L12 2z" fill="white" />
    </svg>
  );
}
function PieIcon({ className }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" className={className} strokeWidth="2">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
function CarIcon({ className }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" className={className} strokeWidth="2">
      <path d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm14 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM3 17V9l2-5h14l2 5v8" />
    </svg>
  );
}
function UserIcon({ className }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" className={className} strokeWidth="2">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
function PinIcon({ className }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" className={className} strokeWidth="2">
      <path d="M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function ChatIcon({ className }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" className={className} strokeWidth="2">
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-4-1L3 20l1-4.5A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}
function CardIcon({ className }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" className={className} strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="stroke-[#6B6B6B]" strokeWidth="2">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="stroke-[#6B6B6B]" strokeWidth="2">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}
function DotsIcon({ className = 'fill-[#6B6B6B]' }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className={className}>
      <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}
function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}