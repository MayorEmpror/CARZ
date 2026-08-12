'use client';

import { useMemo, useState, type ReactNode, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type { LatLng, TripRoute } from './Maps';

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SETUP (no API key, no billing card required)
 * ─────────────────────────────────────────────────────────────────────────
 * 1. npm install leaflet react-leaflet
 *    npm install -D @types/leaflet
 * 2. Place TripMap.tsx next to this file (same folder).
 * 3. That's it — map tiles are free CARTO dark tiles, no key needed.
 * ─────────────────────────────────────────────────────────────────────────
 */

// Leaflet touches `window`, so it must load client-side only.
const TripMap = dynamic(() => import('./Maps'), {
  ssr: false,
  loading: () => <MapFallback text="Loading map…" />,
});

// ---------------------------------------------------------------------------
// Design tokens (dark, indigo-glass theme)
// ---------------------------------------------------------------------------
const T = {
  bg: '#0A0B12',
  surface: '#12131D',
  surfaceAlt: '#181A26',
  border: '#242637',
  borderSoft: '#1D1F2C',
  text: '#F2F2F6',
  textDim: '#8A8C9E',
  textFaint: '#5C5E70',
  accent: '#6C5CE7',
  accentSoft: 'rgba(108, 92, 231, 0.16)',
  accent2: '#8C7CFF',
  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.12)',
  warn: '#FBBF24',
  warnSoft: 'rgba(251, 191, 36, 0.12)',
  gold: '#F5B92E',
} as const;

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
  car: { name: string; rating: number; mileage: string; gearbox: string; image: string };
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
  color?: string;
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
  car: { name: 'Toyota Rav-4 2018', rating: 5, mileage: '56,245 km', gearbox: 'Auto', image: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?q=80&w=800&auto=format&fit=crop' },
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

  const filteredTrips = useMemo(
    () => TRIPS.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()) || t.id.includes(query)),
    [query]
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '28px', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '84px 340px 1fr',
          gap: '20px',
          height: 'calc(100vh - 56px)',
        }}
      >
        {/* ───────────────────────── Sidebar ───────────────────────── */}
        <aside
          style={{
            background: `linear-gradient(180deg, ${T.accent} 0%, #4A3FC4 100%)`,
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '22px 0',
          }}
        >
          <div
            style={{
              width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.16)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40,
            }}
          >
            <LogoIcon />
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {SIDEBAR_ICONS.map(({ key, icon: Icon, active, badge }) => (
              <button
                key={key}
                style={{
                  position: 'relative',
                  width: 44, height: 44, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(255,255,255,0.94)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s ease',
                }}
              >
                <Icon color={active ? T.accent : 'rgba(255,255,255,0.72)'} />
                {badge && (
                  <span style={{ position: 'absolute', top: 8, right: 10, width: 7, height: 7, borderRadius: '50%', background: '#FF5C7A', border: `2px solid ${active ? '#fff' : T.accent}` }} />
                )}
              </button>
            ))}
          </nav>

          <img
            src="https://i.pravatar.cc/80?img=68"
            alt="Account"
            style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', objectFit: 'cover' }}
          />
        </aside>

        {/* ───────────────────────── Trips list ───────────────────────── */}
        <section
          style={{
            background: T.surface, borderRadius: 24, border: `1px solid ${T.borderSoft}`,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          <div style={{ padding: '24px 22px 16px' }}>
            <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Trips</h1>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10, background: T.surfaceAlt,
                border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 14px',
              }}
            >
              <SearchIcon />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                style={{ background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 14, flex: 1 }}
              />
              <FilterIcon />
            </div>
          </div>

          <div style={{ overflowY: 'auto', padding: '4px 16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredTrips.map((trip) => {
              const isSelected = trip.id === selectedTripId;
              return (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTripId(trip.id)}
                  style={{
                    textAlign: 'left', cursor: 'pointer', width: '100%',
                    background: isSelected ? T.accentSoft : T.surfaceAlt,
                    border: `1px solid ${isSelected ? T.accent : T.border}`,
                    borderRadius: 16, padding: '16px 16px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span style={{ color: T.textFaint, fontSize: 12, fontWeight: 600, letterSpacing: '0.02em' }}>#{trip.id}</span>
                    <DotsIcon />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <img src={trip.avatar} alt={trip.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ color: T.text, fontSize: 14.5, fontWeight: 600 }}>{trip.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: T.textDim, fontSize: 12.5 }}>{trip.date}</span>
                    <StatusPill status={trip.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                    <span style={{ color: T.textFaint, fontSize: 12 }}>Earned</span>
                    <span style={{ color: T.text, fontSize: 15, fontWeight: 700 }}>${trip.earned.toFixed(2)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ───────────────────────── Trip detail ───────────────────────── */}
        <section
          style={{
            background: T.surface, borderRadius: 24, border: `1px solid ${T.borderSoft}`,
            padding: '24px 28px 28px', overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>#{TRIP_DETAIL.id}</h2>
            <span style={{ color: T.textDim, background: T.surfaceAlt, border: `1px solid ${T.border}`, fontSize: 12.5, padding: '5px 12px', borderRadius: 999 }}>
              {TRIP_DETAIL.date}
            </span>
            <StatusPill status={TRIP_DETAIL.status} />
            <div style={{ marginLeft: 'auto' }}>
              <DotsIcon color={T.textDim} />
            </div>
          </div>

          {/* Top cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 18, marginBottom: 24 }}>
            {/* Customer info */}
            <Card title="Customer info">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6 }}>
                <img src={TRIP_DETAIL.customer.avatar} alt={TRIP_DETAIL.customer.name} style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', marginBottom: 14, border: `1px solid ${T.border}` }} />
                <span style={{ color: T.text, fontSize: 15.5, fontWeight: 600 }}>{TRIP_DETAIL.customer.name}</span>
                <span style={{ color: T.textFaint, fontSize: 12.5, marginTop: 4, marginBottom: 18 }}>{TRIP_DETAIL.customer.dob}</span>
                <button
                  style={{
                    width: '100%', background: T.accentSoft, color: T.accent2, border: `1px solid ${T.accent}44`,
                    borderRadius: 11, padding: '11px 0', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Start a chat
                </button>
              </div>
            </Card>

            {/* Car card */}
            <div
              style={{
                background: `linear-gradient(135deg, ${T.accent} 0%, #4A3FC4 100%)`,
                borderRadius: 20, padding: '20px 22px', position: 'relative', overflow: 'hidden',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13.5, fontWeight: 600, position: 'relative', zIndex: 1 }}>Vehicle</span>
              <img
                src={TRIP_DETAIL.car.image}
                alt={TRIP_DETAIL.car.name}
                style={{ width: '100%', height: 110, objectFit: 'contain', margin: '4px 0 10px', position: 'relative', zIndex: 1 }}
              />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{TRIP_DETAIL.car.name}</span>
                <div style={{ margin: '4px 0 16px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} filled={i < TRIP_DETAIL.car.rating} />
                  ))}
                </div>
                <Row label="Mileage" value={TRIP_DETAIL.car.mileage} light />
                <Row label="Gearbox" value={TRIP_DETAIL.car.gearbox} light />
              </div>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.14), transparent 55%)' }} />
            </div>

            {/* Payment info */}
            <Card title="Payment info">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
                <Row label="Rent" value={`$${TRIP_DETAIL.payment.rent.toFixed(2)}`} />
                <Row label="Fines" value={`$${TRIP_DETAIL.payment.fines}`} />
                <Row label="Deposit" value={TRIP_DETAIL.payment.deposit} />
                <div
                  style={{
                    marginTop: 8, background: '#151622', borderRadius: 12, padding: '13px 14px',
                    display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${T.border}`,
                  }}
                >
                  <div style={{ width: 38, height: 26, borderRadius: 6, background: 'linear-gradient(135deg,#1f2233,#0d0e16)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 9, color: '#EB5C57', fontWeight: 800 }}>●●</span>
                  </div>
                  <div>
                    <div style={{ color: T.text, fontSize: 13.5, fontWeight: 600 }}>{TRIP_DETAIL.payment.bank}</div>
                    <div style={{ color: T.textFaint, fontSize: 12 }}>**** {TRIP_DETAIL.payment.last4}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 18,
              padding: '18px 22px', background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 16, marginBottom: 22,
            }}
          >
            <Stat label="Total distance" value={TRIP_DETAIL.stats.distance} />
            <Stat label="Trip time" value={TRIP_DETAIL.stats.time} />
            <Stat label="Maximum speed" value={TRIP_DETAIL.stats.maxSpeed} />
            <Stat label="Fuel consumption" value={TRIP_DETAIL.stats.fuel} />
            <Stat label="Passenger number" value={`${TRIP_DETAIL.stats.passengers} persons`} />
            <Stat label="Road condition" value={TRIP_DETAIL.stats.road} accent={T.success} />
          </div>

          {/* Map + timeline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
            <div style={{ height: 360, borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}` }}>
              <TripMap route={TRIP_DETAIL.route} fuelStops={TRIP_DETAIL.fuelStops} />
            </div>

            {/* Timeline */}
            <div
              style={{
                background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 16,
                padding: '22px 22px', position: 'relative',
              }}
            >
              <TimelineItem
                marker="dot"
                color={T.accent2}
                label={TRIP_DETAIL.route.start.label}
                time={TRIP_DETAIL.route.start.time}
                address={TRIP_DETAIL.route.start.address}
              />
              <TimelineItem
                marker="ring"
                color={T.accent2}
                label={TRIP_DETAIL.route.stop.label}
                time={TRIP_DETAIL.route.stop.time}
                address={TRIP_DETAIL.route.stop.address}
              />
              <TimelineItem
                marker="square"
                color={T.accent2}
                label={TRIP_DETAIL.route.finish.label}
                time={TRIP_DETAIL.route.finish.time}
                address={TRIP_DETAIL.route.finish.address}
                isLast
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 20, padding: '18px 20px' }}>
      <span style={{ color: T.text, fontSize: 14.5, fontWeight: 600 }}>{title}</span>
      {children}
    </div>
  );
}

function Row({ label, value, light }: { label: string; value: string | number; light?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 2 }}>
      <span style={{ color: light ? 'rgba(255,255,255,0.72)' : T.textDim }}>{label}</span>
      <span style={{ color: light ? '#fff' : T.text, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div>
      <div style={{ color: T.textFaint, fontSize: 11.5, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ color: accent || T.text, fontSize: 15, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: TripStatus }) {
  const isActive = status === 'Active';
  const bg = isActive ? T.warnSoft : T.successSoft;
  const color = isActive ? T.warn : T.success;
  return (
    <span style={{ background: bg, color, fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 999 }}>
      {status}
    </span>
  );
}

type MarkerKind = 'dot' | 'ring' | 'square';

interface TimelineItemProps {
  marker: MarkerKind;
  color: string;
  label: string;
  time: string;
  address: string;
  isLast?: boolean;
}

function TimelineItem({ marker, color, label, time, address, isLast }: TimelineItemProps) {
  return (
    <div style={{ display: 'flex', gap: 14, paddingBottom: isLast ? 0 : 26, position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <MarkerGlyph type={marker} color={color} />
        {!isLast && <div style={{ width: 1, flex: 1, background: T.border, marginTop: 4 }} />}
      </div>
      <div>
        <div style={{ color: T.textFaint, fontSize: 11.5, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
        <div style={{ color: T.text, fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 }}>
          {time} {address}
        </div>
      </div>
    </div>
  );
}

function MarkerGlyph({ type, color }: { type: MarkerKind; color: string }) {
  if (type === 'dot') return <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />;
  if (type === 'ring') return <div style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${color}`, background: 'transparent', flexShrink: 0 }} />;
  return <div style={{ width: 9, height: 9, background: color, flexShrink: 0, borderRadius: 2 }} />;
}

function MapFallback({ text }: { text: string }) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#151622', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: T.textFaint, fontSize: 13 }}>{text}</span>
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
function PieIcon({ color }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
function CarIcon({ color }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm14 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM3 17V9l2-5h14l2 5v8" />
    </svg>
  );
}
function UserIcon({ color }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
function PinIcon({ color }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function ChatIcon({ color }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-4-1L3 20l1-4.5A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}
function CardIcon({ color }: IconProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}
function DotsIcon({ color = T.textFaint }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
      <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? T.gold : 'none'} stroke={T.gold} strokeWidth="1.5" style={{ marginRight: 2 }}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}