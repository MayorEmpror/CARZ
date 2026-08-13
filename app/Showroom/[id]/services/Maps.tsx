'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ACCENT = '#8C7CFF';
const MIN_ZOOM = 3;
const WORLD_BOUNDS = L.latLngBounds([-85, -180], [85, 180]);

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoutePoint extends LatLng {
  label: string;
  time: string;
  address: string;
}

export interface TripRoute {
  start: RoutePoint;
  stop: RoutePoint;
  finish: RoutePoint;
}

export interface SearchPoint {
  point: LatLng;
  label: string;
}

interface TripMapProps {
  route: TripRoute;
  fuelStops?: LatLng[];
  searchPoint?: SearchPoint | null;
  onMapReady?: (map: L.Map) => void;
}

interface GeocodeResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

function svgIcon(svg: string, size: [number, number]): L.Icon {
  return L.icon({
    iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
  });
}

const dotIcon = svgIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="8" fill="${ACCENT}" stroke="white" stroke-width="2"/></svg>`,
  [20, 20]
);

const ringIcon = svgIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><circle cx="11" cy="11" r="7" fill="white" stroke="${ACCENT}" stroke-width="3"/></svg>`,
  [22, 22]
);

const squareIcon = svgIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><rect x="2" y="2" width="14" height="14" rx="3" fill="${ACCENT}" stroke="white" stroke-width="2"/></svg>`,
  [18, 18]
);

const fuelIcon = svgIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#EB5C7A" stroke="#151622" stroke-width="2"/><path d="M8 7h6v10H8z" fill="none" stroke="white" stroke-width="1.4"/><path d="M8 11h6" stroke="white" stroke-width="1.4"/></svg>`,
  [24, 24]
);

const searchPinIcon = svgIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42"><path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="#EB5C7A" stroke="#151622" stroke-width="1.5"/><circle cx="15" cy="15" r="6" fill="white"/></svg>`,
  [30, 42]
);

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  const didFit = useRef(false);

  useEffect(() => {
    if (didFit.current || !points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [56, 56] });
    didFit.current = true;
  }, [map, points]);

  return null;
}

// Hands the Leaflet map instance up to whoever rendered <TripMap onMapReady={...} />
function MapInstanceGrabber({ onReady }: { onReady?: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady?.(map);
  }, [map, onReady]);
  return null;
}

// ---------------------------------------------------------------------------
// SearchBar — exported so it can be rendered wherever it fits in your layout
// (e.g. inside a dashboard's glass top bar) instead of floating over the map.
// Give the map instance via the `map` prop; call flyTo + fills its own input.
// ---------------------------------------------------------------------------
interface SearchBarProps {
  map: L.Map | null;
  onSelect: (point: LatLng, label: string) => void;
  placeholder?: string;
}

export function SearchBar({ map, onSelect, placeholder = 'Search for a location' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          { headers: { Accept: 'application/json' } }
        );
        const data: GeocodeResult[] = await res.json();
        setResults(data);
        setOpen(true);
      } catch (err) {
        console.error('Geocoding error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = useCallback(
    (result: GeocodeResult) => {
      const point: LatLng = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
      setQuery(result.display_name);
      setResults([]);
      setOpen(false);
      onSelect(point, result.display_name);
      if (map) {
        map.flyTo([point.lat, point.lng], 14, { duration: 1.1 });
      }
    },
    [map, onSelect]
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${open && results.length ? ACCENT : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 10,
          padding: '8px 12px',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginRight: 8 }}>
          <circle cx="11" cy="11" r="7" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: 13.5 }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setOpen(false);
            }}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, padding: 0, marginLeft: 6 }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {open && (loading || results.length > 0) && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#1b1c29',
            border: `1px solid ${ACCENT}`,
            borderRadius: 10,
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            maxHeight: 260,
            overflowY: 'auto',
            zIndex: 50,
          }}
        >
          {loading && (
            <div style={{ padding: '10px 12px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Searching…</div>
          )}
          {!loading &&
            results.map((r) => (
              <div
                key={r.place_id}
                onClick={() => handleSelect(r)}
                style={{ padding: '10px 12px', fontSize: 13, color: 'white', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(140,124,255,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {r.display_name}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default function TripMap({ route, fuelStops = [], searchPoint = null, onMapReady }: TripMapProps) {
  const routePoints: LatLng[] = [route.start, route.stop, route.finish];
  const polylinePath: [number, number][] = routePoints.map((p) => [p.lat, p.lng]);
  const center: [number, number] = [route.stop.lat, route.stop.lng];

  return (
    <MapContainer
      center={center}
      zoom={15}
      minZoom={MIN_ZOOM}
      maxBounds={WORLD_BOUNDS}
      maxBoundsViscosity={1.0}
      worldCopyJump={false}
       keyboard={false}          
      style={{ width: '100%', height: '100%', background: '#151622', top:"160px", left:"10px"}}
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
        noWrap={true}
      />

      <FitBounds points={routePoints} />
      <MapInstanceGrabber onReady={onMapReady} />

      <Polyline positions={polylinePath} pathOptions={{ color: ACCENT, weight: 3, opacity: 0.9 }} />

      <Marker position={[route.start.lat, route.start.lng]} icon={dotIcon} />
      <Marker position={[route.stop.lat, route.stop.lng]} icon={ringIcon} />
      <Marker position={[route.finish.lat, route.finish.lng]} icon={squareIcon} />

      {fuelStops.map((stop, i) => (
        <Marker key={i} position={[stop.lat, stop.lng]} icon={fuelIcon} />
      ))}

      {searchPoint && <Marker position={[searchPoint.point.lat, searchPoint.point.lng]} icon={searchPinIcon} />}
    </MapContainer>
  );
}