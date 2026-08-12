'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SETUP (no API key, no billing card required)
 * ─────────────────────────────────────────────────────────────────────────
 * 1. npm install leaflet react-leaflet
 *    npm install -D @types/leaflet
 * 2. This file is imported with next/dynamic + ssr:false from services.tsx
 *    (Leaflet touches `window`, so it can't run during server rendering.)
 *
 * Tiles are served free by CARTO (dark basemap, no key needed):
 *   https://carto.com/basemaps  — just keep the attribution line, it's
 *   part of their free-usage terms.
 * ─────────────────────────────────────────────────────────────────────────
 */

const ACCENT = '#8C7CFF';

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

interface TripMapProps {
  route: TripRoute;
  fuelStops?: LatLng[];
}

// Build a small colored SVG marker as a data URI — no external icon assets.
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

// Fits the map view to the route bounds once, on load.
function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  const didFit = useRef(false);

  useEffect(() => {
    if (didFit.current || !points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48] });
    didFit.current = true;
  }, [map, points]);

  return null;
}

export default function TripMap({ route, fuelStops = [] }: TripMapProps) {
  const routePoints: LatLng[] = [route.start, route.stop, route.finish];
  const polylinePath: [number, number][] = routePoints.map((p) => [p.lat, p.lng]);
  const center: [number, number] = [route.stop.lat, route.stop.lng];

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ width: '100%', height: '100%', background: '#151622' }}
      zoomControl={true}
      attributionControl={true}
    >
      {/* Free dark basemap tiles from CARTO — no API key required */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />

      <FitBounds points={routePoints} />

      <Polyline
        positions={polylinePath}
        pathOptions={{ color: ACCENT, weight: 3, opacity: 0.9 }}
      />

      <Marker position={[route.start.lat, route.start.lng]} icon={dotIcon} />
      <Marker position={[route.stop.lat, route.stop.lng]} icon={ringIcon} />
      <Marker position={[route.finish.lat, route.finish.lng]} icon={squareIcon} />

      {fuelStops.map((stop, i) => (
        <Marker key={i} position={[stop.lat, stop.lng]} icon={fuelIcon} />
      ))}
    </MapContainer>
  );
}