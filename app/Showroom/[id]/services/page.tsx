'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type { Map as LeafletMap } from 'leaflet';
import type { LatLng, TripRoute, SearchPoint, RouteInfo } from './Maps';
import { createRental, getRental } from '@/lib/api/rentals'; // TODO: adjust to your real import path
import type { CreateRentalData } from '@/lib/types';

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
 * DATA NOTES (read before wiring this into your real app)
 * ─────────────────────────────────────────────────────────────────────────
 * - There is no "list rentals" endpoint yet, only POST /api/rentals and
 *   GET /api/rentals/:id. So the left-hand Trips list below is still
 *   SAMPLE data (see SAMPLE_TRIPS) — clicking an item calls the real
 *   getRental(id) using that sample id as the rental_id. Swap SAMPLE_TRIPS
 *   for a real list once you have an endpoint for it.
 * - GET /api/rentals/:id returns the raw `rentals` row joined with
 *   make/model/year/registration_number from `cars`. It does NOT include
 *   customer name/avatar, car rating/mileage/gearbox, a mid-trip stop,
 *   max speed, fuel consumption, passenger count, or road condition — so
 *   those fields from the original mock UI have been removed rather than
 *   faked. Only real columns are rendered.
 * - Maps.tsx's TripRoute type (from your existing code) expects a
 *   start/stop/finish triple. Since the API only gives pickup/dropoff, the
 *   "stop" passed to the map is a computed midpoint used purely so the
 *   polyline draws sensibly — it is NOT shown in the on-screen timeline,
 *   which only lists the two real points (pickup + dropoff).
 * - POST /api/rentals requires customer_id and car_id, which this page has
 *   no picker for (no customer/car search endpoints were provided), so
 *   they're plain number inputs in the "Create new rental" form. Swap for
 *   real pickers once those endpoints exist.
 * ─────────────────────────────────────────────────────────────────────────
 */

// Leaflet touches `window`, so it's client-only.
const TripMap = dynamic(() => import('./Maps'), {
  ssr: false,
  loading: () => <MapFallback text="Loading map…" />,
});
// Same module as TripMap (it imports leaflet), so it also needs ssr:false.
const MapSearchBar = dynamic(() => import('./Maps').then((mod) => mod.SearchBar), { ssr: false });
const AmbientBackground3D = dynamic(() => import('./Ambientbackground3d'), { ssr: false });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Raw shape returned by GET /api/rentals/:id (rentals row + car join).
// Adjust field names here if your `rentals` table differs slightly.
interface RentalRecord {
  rental_id: number;
  customer_id: number;
  car_id: number;
  start_time: string;
  end_time: string;
  pickup_location: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_location: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  distance_km: number | null;
  estimated_duration: number | null;
  base_price: number | null;
  distance_charge: number | null;
  service_fee: number | null;
  total_amount: number | null;
  status: string;
  hold_expires_at: string | null;
  make: string;
  model: string;
  year: number;
  registration_number: string;
}

// Sample-only placeholder for the left list until a "list rentals" endpoint exists.
interface SampleTripSummary {
  id: string;
  name: string;
  date: string;
  status: string;
  earned: number;
  avatar: string;
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
// Sample list data — replace once a list endpoint is available. Ids are
// plain small integers so they plausibly match real serial rental_ids.
// ---------------------------------------------------------------------------
const SAMPLE_TRIPS: SampleTripSummary[] = [
  { id: '5', name: 'Rental #5', date: '—', status: 'active', earned: 26.44, avatar: 'https://i.pravatar.cc/80?img=13' },
  { id: '4', name: 'Rental #4', date: '—', status: 'confirmed', earned: 84.72, avatar: 'https://i.pravatar.cc/80?img=32' },
  { id: '3', name: 'Rental #3', date: '—', status: 'completed', earned: 124.68, avatar: 'https://i.pravatar.cc/80?img=51' },
  { id: '2', name: 'Rental #2', date: '—', status: 'completed', earned: 12.80, avatar: 'https://i.pravatar.cc/80?img=47' },
  { id: '1', name: 'Rental #1', date: '—', status: 'cancelled', earned: 58.10, avatar: 'https://i.pravatar.cc/80?img=15' },
];

const SIDEBAR_ICONS: SidebarIconDef[] = [
  { key: 'overview', icon: PieIcon },
  { key: 'fleet', icon: CarIcon },
  { key: 'customers', icon: UserIcon },
  { key: 'trips', icon: PinIcon, active: true },
  { key: 'chat', icon: ChatIcon, badge: true },
  { key: 'billing', icon: CardIcon },
];

// Default pricing assumptions used only to pre-fill the create-rental form;
// every figure stays freely editable before submit.
const BASE_PRICE_DEFAULT = 15;
const RATE_PER_KM = 1.35;
const SERVICE_FEE_RATE = 0.1;

export default function Services() {
  const [selectedTripId, setSelectedTripId] = useState<string>(SAMPLE_TRIPS[0].id);
  const [query, setQuery] = useState<string>('');
  const [topCollapsed, setTopCollapsed] = useState(false);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);

  // Loaded rental (GET /api/rentals/:id)
  const [rental, setRental] = useState<RentalRecord | null>(null);
  const [rentalLoading, setRentalLoading] = useState(false);
  const [rentalError, setRentalError] = useState<string | null>(null);

  // Leaflet map instance (handed up from TripMap via onMapReady).
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);

  // Route search for a NEW rental: From / To, plus the calculated route.
  const [fromPoint, setFromPoint] = useState<SearchPoint | null>(null);
  const [toPoint, setToPoint] = useState<SearchPoint | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Create-rental form fields.
  const [customerId, setCustomerId] = useState('');
  const [carId, setCarId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [endTimeTouched, setEndTimeTouched] = useState(false);
  const [distanceKm, setDistanceKm] = useState('');
  const [distanceTouched, setDistanceTouched] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [durationTouched, setDurationTouched] = useState(false);
  const [basePrice, setBasePrice] = useState(BASE_PRICE_DEFAULT.toFixed(2));
  const [distanceCharge, setDistanceCharge] = useState('');
  const [distanceChargeTouched, setDistanceChargeTouched] = useState(false);
  const [serviceFee, setServiceFee] = useState('');
  const [serviceFeeTouched, setServiceFeeTouched] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdRental, setCreatedRental] = useState<RentalRecord | null>(null);

  // ── Fetch the selected rental whenever the selection changes ──────────
  useEffect(() => {
    let cancelled = false;
    const id = Number(selectedTripId);
    if (!Number.isFinite(id)) return;

    setRentalLoading(true);
    setRentalError(null);
    setRental(null);

    getRental(id)
      .then((data: RentalRecord) => {
        if (!cancelled) setRental(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setRentalError(err.message || 'Failed to load rental');
      })
      .finally(() => {
        if (!cancelled) setRentalLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTripId]);

  // ── Auto-fill distance / duration once a route is calculated ──────────
  useEffect(() => {
    if (!routeInfo) return;
    if (!distanceTouched) setDistanceKm(routeInfo.distanceKm.toFixed(1));
    if (!durationTouched) setEstimatedDuration(Math.round(routeInfo.durationMin).toString());
  }, [routeInfo, distanceTouched, durationTouched]);

  // ── Auto-fill end time = start time + estimated duration ──────────────
  useEffect(() => {
    if (!startTime || !estimatedDuration || endTimeTouched) return;
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) return;
    const mins = Number(estimatedDuration);
    if (!Number.isFinite(mins)) return;
    const end = new Date(start.getTime() + mins * 60_000);
    setEndTime(toDatetimeLocalValue(end));
  }, [startTime, estimatedDuration, endTimeTouched]);

  // ── Auto-fill distance charge / service fee from distance & base price ─
  useEffect(() => {
    const km = Number(distanceKm);
    if (!Number.isFinite(km)) return;
    if (!distanceChargeTouched) setDistanceCharge((km * RATE_PER_KM).toFixed(2));
  }, [distanceKm, distanceChargeTouched]);

  useEffect(() => {
    const base = Number(basePrice) || 0;
    const dist = Number(distanceCharge) || 0;
    if (!serviceFeeTouched) setServiceFee(((base + dist) * SERVICE_FEE_RATE).toFixed(2));
  }, [basePrice, distanceCharge, serviceFeeTouched]);

  const totalAmount = useMemo(() => {
    const base = Number(basePrice) || 0;
    const dist = Number(distanceCharge) || 0;
    const fee = Number(serviceFee) || 0;
    return (base + dist + fee).toFixed(2);
  }, [basePrice, distanceCharge, serviceFee]);

  const filteredTrips = useMemo(
    () => SAMPLE_TRIPS.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()) || t.id.includes(query)),
    [query]
  );

  const handleSwap = () => {
    const nextFrom = toPoint;
    const nextTo = fromPoint;
    setFromPoint(nextFrom);
    setToPoint(nextTo);
  };

  const handleCreateRental = async () => {
    setCreateError(null);
    setCreatedRental(null);

    if (!fromPoint || !toPoint) {
      setCreateError('Pick a From and To location first.');
      return;
    }
    if (!customerId || !carId) {
      setCreateError('Customer ID and Car ID are required.');
      return;
    }
    if (!startTime || !endTime) {
      setCreateError('Start and end time are required.');
      return;
    }

    const payload: CreateRentalData = {
      customer_id: Number(customerId),
      car_id: Number(carId),
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      pickup_location: fromPoint.label,
      pickup_latitude: fromPoint.point.lat,
      pickup_longitude: fromPoint.point.lng,
      dropoff_location: toPoint.label,
      dropoff_latitude: toPoint.point.lat,
      dropoff_longitude: toPoint.point.lng,
      distance_km: Number(distanceKm) || 0,
      estimated_duration: Number(estimatedDuration) || 0,
      base_price: Number(basePrice) || 0,
      distance_charge: Number(distanceCharge) || 0,
      service_fee: Number(serviceFee) || 0,
      total_amount: Number(totalAmount) || 0,
    };

    setCreating(true);
    try {
      const created = await createRental(payload);
      setCreatedRental(created);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create rental');
    } finally {
      setCreating(false);
    }
  };

  // ── Derive map props from whichever rental is currently loaded ────────
  const mapRoute: TripRoute | null = rental
    ? buildMapRoute(rental)
    : null;

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
              {mapRoute ? (
                <TripMap
                  route={mapRoute}
                  fuelStops={[]}
                  fromPoint={fromPoint}
                  toPoint={toPoint}
                  onRouteInfo={setRouteInfo}
                  onRouteLoadingChange={setRouteLoading}
                  onMapReady={setMapInstance}
                />
              ) : (
                <MapFallback text={rentalLoading ? 'Loading rental…' : rentalError ?? 'No rental selected'} />
              )}
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
              {/* ── Top bar: header + route search + stats, collapsible, glass blur ── */}
              <div className="pointer-events-auto shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-3.5 px-6 py-4">
                  <h2 className="text-[22px] font-bold tracking-tight text-[#F5F5F5]">
                    {rental ? `#${rental.rental_id}` : rentalLoading ? 'Loading…' : '—'}
                  </h2>
                  {rental && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12.5px] text-[#A3A3A3]">
                      {formatDateTime(rental.start_time)}
                    </span>
                  )}
                  {rental && <StatusPill status={rental.status} />}
                  {rentalError && (
                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[12.5px] text-red-400">
                      {rentalError}
                    </span>
                  )}

                  <div className="ml-auto flex items-center gap-1">
                    {routeLoading && (
                      <span className="mr-1 text-[11.5px] text-[#A3A3A3]">Calculating route…</span>
                    )}
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

                {/* Route search — From / To, for planning a NEW rental */}
                <div className="flex items-center gap-2 border-t border-white/10 px-6 py-3.5">
                  <div className="min-w-0 flex-1">
                    <MapSearchBar
                      map={mapInstance}
                      value={fromPoint?.label}
                      onSelect={(point, label) => setFromPoint({ point, label })}
                      onClear={() => setFromPoint(null)}
                      placeholder="From…"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSwap}
                    aria-label="Swap from and to"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#A3A3A3] hover:bg-white/10"
                  >
                    <SwapIcon />
                  </button>

                  <div className="min-w-0 flex-1">
                    <MapSearchBar
                      map={mapInstance}
                      value={toPoint?.label}
                      onSelect={(point, label) => setToPoint({ point, label })}
                      onClear={() => setToPoint(null)}
                      placeholder="To…"
                    />
                  </div>
                </div>

                {/* Stats — only fields the API actually returns */}
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
                    <Stat label="Distance" value={rental?.distance_km != null ? `${rental.distance_km} km` : '—'} />
                    <Stat
                      label="Duration"
                      value={rental?.estimated_duration != null ? formatMinutes(rental.estimated_duration) : '—'}
                    />
                    <Stat label="Vehicle" value={rental ? `${rental.make} ${rental.model} '${rental.year}` : '—'} />
                    <Stat label="Base price" value={rental?.base_price != null ? `$${rental.base_price}` : '—'} />
                    <Stat label="Distance charge" value={rental?.distance_charge != null ? `$${rental.distance_charge}` : '—'} />
                    <Stat
                      label="Total amount"
                      value={rental?.total_amount != null ? `$${rental.total_amount}` : '—'}
                      accentClassName="text-[#34D399]"
                    />
                  </div>
                </div>
              </div>

              {/* ── Remaining space below the top bar — timeline panel lives here ── */}
              <div className="flex min-h-0 flex-1 justify-end">
                <div
                  className={`pointer-events-auto flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl transition-[width] duration-300 ${
                    timelineCollapsed ? 'w-14' : 'w-[340px]'
                  }`}
                >
                  <div
                    className={`flex shrink-0 items-center ${
                      timelineCollapsed ? 'justify-center px-0 py-4' : 'justify-between px-5 pt-4'
                    }`}
                  >
                    {!timelineCollapsed && (
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#A3A3A3]">Rental</span>
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
                      {/* ── Loaded rental: real pickup/dropoff timeline ── */}
                      <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[#A3A3A3]">
                        Route
                      </span>
                      {rental ? (
                        <>
                          <TimelineItem
                            marker="dot"
                            label="Pickup"
                            time={formatDateTime(rental.start_time)}
                            address={rental.pickup_location}
                          />
                          <TimelineItem
                            marker="square"
                            label="Drop-off"
                            time={formatDateTime(rental.end_time)}
                            address={rental.dropoff_location}
                            isLast
                          />
                        </>
                      ) : (
                        <p className="pb-2 text-[13px] text-[#6B6B6B]">
                          {rentalLoading ? 'Loading…' : rentalError ?? 'Select a trip to see its route.'}
                        </p>
                      )}

                      <div className="my-5 h-px bg-white/10" />

                      {/* ── Create a new rental (POST /api/rentals) ── */}
                      <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[#A3A3A3]">
                        Create new rental
                      </span>

                      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="flex flex-col gap-1.5">
                            <FieldLabel>Customer ID</FieldLabel>
                            <input
                              value={customerId}
                              onChange={(e) => setCustomerId(e.target.value)}
                              inputMode="numeric"
                              placeholder="e.g. 12"
                              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-[#F5F5F5] outline-none placeholder:text-[#6B6B6B] focus:border-[#8C7CFF]"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <FieldLabel>Car ID</FieldLabel>
                            <input
                              value={carId}
                              onChange={(e) => setCarId(e.target.value)}
                              inputMode="numeric"
                              placeholder="e.g. 7"
                              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-[#F5F5F5] outline-none placeholder:text-[#6B6B6B] focus:border-[#8C7CFF]"
                            />
                          </div>
                        </div>

                        <FieldLabel>Pickup (search "From" above)</FieldLabel>
                        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-[#F5F5F5]">
                          {fromPoint?.label ?? <span className="text-[#6B6B6B]">Not set</span>}
                        </div>

                        <FieldLabel>Drop-off (search "To" above)</FieldLabel>
                        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-[#F5F5F5]">
                          {toPoint?.label ?? <span className="text-[#6B6B6B]">Not set</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="flex flex-col gap-1.5">
                            <FieldLabel>Start time</FieldLabel>
                            <input
                              type="datetime-local"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-[12.5px] text-[#F5F5F5] outline-none focus:border-[#8C7CFF]"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <FieldLabel>End time</FieldLabel>
                            <input
                              type="datetime-local"
                              value={endTime}
                              onChange={(e) => {
                                setEndTime(e.target.value);
                                setEndTimeTouched(true);
                              }}
                              className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-[12.5px] text-[#F5F5F5] outline-none focus:border-[#8C7CFF]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="flex flex-col gap-1.5">
                            <FieldLabel>Distance (km)</FieldLabel>
                            <input
                              value={distanceKm}
                              onChange={(e) => {
                                setDistanceKm(e.target.value);
                                setDistanceTouched(true);
                              }}
                              inputMode="decimal"
                              placeholder={routeLoading ? 'Calculating…' : 'Auto from route'}
                              className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-[12.5px] text-[#F5F5F5] outline-none placeholder:text-[#6B6B6B] focus:border-[#8C7CFF]"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <FieldLabel>Duration (min)</FieldLabel>
                            <input
                              value={estimatedDuration}
                              onChange={(e) => {
                                setEstimatedDuration(e.target.value);
                                setDurationTouched(true);
                              }}
                              inputMode="numeric"
                              placeholder={routeLoading ? 'Calculating…' : 'Auto from route'}
                              className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-[12.5px] text-[#F5F5F5] outline-none placeholder:text-[#6B6B6B] focus:border-[#8C7CFF]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="flex flex-col gap-1.5">
                            <FieldLabel>Base price</FieldLabel>
                            <MoneyInput value={basePrice} onChange={setBasePrice} />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <FieldLabel>Distance charge</FieldLabel>
                            <MoneyInput
                              value={distanceCharge}
                              onChange={(v) => {
                                setDistanceCharge(v);
                                setDistanceChargeTouched(true);
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="flex flex-col gap-1.5">
                            <FieldLabel>Service fee</FieldLabel>
                            <MoneyInput
                              value={serviceFee}
                              onChange={(v) => {
                                setServiceFee(v);
                                setServiceFeeTouched(true);
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <FieldLabel>Total</FieldLabel>
                            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                              <span className="text-[13px] text-[#6B6B6B]">$</span>
                              <span className="text-[13px] font-semibold text-[#F5F5F5]">{totalAmount}</span>
                            </div>
                          </div>
                        </div>

                        {createError && <p className="text-[12px] text-red-400">{createError}</p>}
                        {createdRental && (
                          <p className="text-[12px] text-[#34D399]">
                            Created rental #{createdRental.rental_id} — status: {createdRental.status}
                            {createdRental.hold_expires_at
                              ? ` (hold expires ${formatDateTime(createdRental.hold_expires_at)})`
                              : ''}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={handleCreateRental}
                          disabled={creating}
                          className="mt-1 rounded-lg bg-[#8C7CFF] px-3 py-2.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {creating ? 'Creating…' : 'Create rental'}
                        </button>
                      </div>
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
// Helpers
// ---------------------------------------------------------------------------
function buildMapRoute(rental: RentalRecord): TripRoute | null {
  // pg returns `numeric`/`decimal` columns as strings (not JS numbers) to
  // avoid float precision loss, so coerce every coordinate explicitly —
  // otherwise `pickupLat + dropoffLat` silently string-concatenates instead
  // of adding, producing NaN that crashes Leaflet deep in its internals.
  const pickupLat = Number(rental.pickup_latitude);
  const pickupLng = Number(rental.pickup_longitude);
  const dropoffLat = Number(rental.dropoff_latitude);
  const dropoffLng = Number(rental.dropoff_longitude);

  if (![pickupLat, pickupLng, dropoffLat, dropoffLng].every(Number.isFinite)) {
    console.error('buildMapRoute: non-numeric coordinates on rental', rental);
    return null;
  }

  // Maps.tsx expects start/stop/finish. We only have two real points, so
  // "stop" is a computed midpoint used purely to make the polyline draw —
  // it carries no real timestamp/address and is never shown in the UI list.
  const midLat = (pickupLat + dropoffLat) / 2;
  const midLng = (pickupLng + dropoffLng) / 2;

  return {
    start: {
      label: 'Pickup',
      time: formatDateTime(rental.start_time),
      address: rental.pickup_location,
      lat: pickupLat,
      lng: pickupLng,
    },
    stop: {
      label: '',
      time: '',
      address: '',
      lat: midLat,
      lng: midLng,
    },
    finish: {
      label: 'Drop-off',
      time: formatDateTime(rental.end_time),
      address: rental.dropoff_location,
      lat: dropoffLat,
      lng: dropoffLng,
    },
  };
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatMinutes(mins: number) {
  const hrs = Math.floor(mins / 60);
  const rem = Math.round(mins % 60);
  return hrs > 0 ? `${hrs}h ${rem}m` : `${rem}m`;
}

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B]">{children}</span>;
}

function MoneyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-3 py-2 focus-within:border-[#8C7CFF]">
      <span className="text-[13px] text-[#6B6B6B]">$</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        inputMode="decimal"
        className="min-w-0 flex-1 bg-transparent text-[13px] text-[#F5F5F5] outline-none placeholder:text-[#6B6B6B]"
      />
    </div>
  );
}

// Status can be any of: pending, confirmed, payment_pending, paid, active,
// completed, cancelled — whatever your `rentals.status` column allows.
function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-[#FBBF24]/[0.12] text-[#FBBF24]',
    payment_pending: 'bg-[#FBBF24]/[0.12] text-[#FBBF24]',
    confirmed: 'bg-[#60A5FA]/[0.12] text-[#60A5FA]',
    paid: 'bg-[#818CF8]/[0.12] text-[#818CF8]',
    active: 'bg-[#FBBF24]/[0.12] text-[#FBBF24]',
    completed: 'bg-[#34D399]/[0.12] text-[#34D399]',
    cancelled: 'bg-[#F87171]/[0.12] text-[#F87171]',
  };
  const style = styles[status] ?? 'bg-white/[0.08] text-[#A3A3A3]';
  return (
    <span className={`rounded-full px-[11px] py-1 text-[11.5px] font-bold capitalize ${style}`}>
      {status.replace('_', ' ')}
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
        <div className="text-[13.5px] font-semibold leading-relaxed text-[#F5F5F5]">{time}</div>
        <div className="text-[12.5px] leading-relaxed text-[#A3A3A3]">{address}</div>
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
function SwapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 4v13M7 17l-3-3M7 17l3-3M17 20V7M17 7l3 3M17 7l-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}