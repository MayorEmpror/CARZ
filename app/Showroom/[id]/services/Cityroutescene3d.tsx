'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SETUP
 * ─────────────────────────────────────────────────────────────────────────
 * npm install three @react-three/fiber @react-three/drei
 *
 * HONEST NOTE ON WHAT THIS IS:
 * There's no building-footprint / real street-geometry source wired into
 * this environment (no Mapbox GL 3D buildings, no OSM Overpass access), so
 * this does NOT render your actual city blocks. What it does do:
 *   1. Projects the trip's real lat/lng points (start/stop/finish, fuel
 *      stops) into local X/Z scene units around a shared center — so the
 *      ROUTE shape and its proportions are real.
 *   2. Generates a plausible street grid + building massing (avenues,
 *      cross streets, houses vs. towers) deterministically around that
 *      route, with a cleared corridor along the actual path.
 * Think "stylized 3D city render of the trip," not "satellite-accurate
 * extrusion." If you get access to a building-footprint API later, swap
 * generateCityBlocks() for real geometry and keep everything else as-is.
 *
 * Imported with next/dynamic + ssr:false — WebGL needs `window`.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { LatLng, TripRoute } from './Maps';

const ACCENT = '#6C5CE7';
const ACCENT2 = '#8C7CFF';
const GOLD = '#F5B92E';
const FUEL = '#EB5C7A';
const ASPHALT = '#0E0F17';
const PAD_HOUSE = '#232538';
const PAD_TOWER_A = '#2E2A55';
const PAD_TOWER_B = '#3A3568';
const PARK = '#1B2B22';
const PARK_EDGE = '#2F4A38';

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) — buildings stay put across re-renders,
// they aren't re-rolled randomly on every paint.
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let s = seed | 0;
  return function rand() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SCENE_SCALE = 1 / 6; // meters -> scene units compression

function project(point: LatLng, center: LatLng): THREE.Vector3 {
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((center.lat * Math.PI) / 180);
  const x = (point.lng - center.lng) * metersPerDegLng * SCENE_SCALE;
  const z = -(point.lat - center.lat) * metersPerDegLat * SCENE_SCALE; // north = -z
  return new THREE.Vector3(x, 0, z);
}

function distToSegment(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3) {
  const ab = new THREE.Vector3().subVectors(b, a);
  const t = THREE.MathUtils.clamp(new THREE.Vector3().subVectors(p, a).dot(ab) / ab.lengthSq(), 0, 1);
  const proj = new THREE.Vector3().copy(a).addScaledVector(ab, t);
  return p.distanceTo(proj);
}

// ---------------------------------------------------------------------------
// Procedural block generation
// ---------------------------------------------------------------------------
const GRID = 11; // cells per axis
const PAD = 6.4; // lot footprint budget
const STREET_GAP = 3.2;
const AVENUE_GAP = 5.6;
const AVENUE_EVERY = 3;
const CORRIDOR_CLEAR = 3.4; // keep this radius around the route free of buildings

interface Block {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  isPark: boolean;
}

function buildAxis(): number[] {
  const positions: number[] = [];
  let cursor = 0;
  for (let i = 0; i < GRID; i++) {
    const gap = i % AVENUE_EVERY === 0 ? AVENUE_GAP : STREET_GAP;
    cursor += gap + PAD / 2;
    positions.push(cursor);
    cursor += PAD / 2;
  }
  const offset = positions[Math.floor(positions.length / 2)];
  return positions.map((p) => p - offset);
}

function generateCityBlocks(routeSegments: [THREE.Vector3, THREE.Vector3][], seed: number): Block[] {
  const rand = mulberry32(seed);
  const xs = buildAxis();
  const zs = buildAxis();
  const blocks: Block[] = [];

  for (const x of xs) {
    for (const z of zs) {
      const center = new THREE.Vector3(x, 0, z);
      const minDist = Math.min(...routeSegments.map(([a, b]) => distToSegment(center, a, b)));
      if (minDist < CORRIDOR_CLEAR) continue; // keep the road corridor clear

      const roll = rand();
      if (roll < 0.14) {
        // park / plaza block
        blocks.push({ x, z, w: PAD * (0.7 + rand() * 0.25), d: PAD * (0.7 + rand() * 0.25), h: 0.15, color: PARK, isPark: true });
        continue;
      }

      const isTower = roll > 0.62;
      const w = PAD * (isTower ? 0.5 + rand() * 0.2 : 0.6 + rand() * 0.3);
      const d = PAD * (isTower ? 0.5 + rand() * 0.2 : 0.6 + rand() * 0.3);
      const h = isTower ? 6 + rand() * 13 : 1.4 + rand() * 3.2;
      const color = isTower ? (rand() > 0.5 ? PAD_TOWER_A : PAD_TOWER_B) : PAD_HOUSE;

      blocks.push({ x, z, w, d, h, color, isPark: false });
    }
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Scene pieces
// ---------------------------------------------------------------------------
function Building({ block }: { block: Block }) {
  if (block.isPark) {
    return (
      <group position={[block.x, 0, block.z]}>
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <boxGeometry args={[block.w, 0.16, block.d]} />
          <meshStandardMaterial color={PARK} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <boxGeometry args={[block.w * 0.92, 0.02, block.d * 0.92]} />
          <meshStandardMaterial color={PARK_EDGE} roughness={0.85} />
        </mesh>
      </group>
    );
  }
  return (
    <group position={[block.x, 0, block.z]}>
      {/* lot pad */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[block.w + 0.6, 0.12, block.d + 0.6]} />
        <meshStandardMaterial color={ASPHALT} roughness={0.95} />
      </mesh>
      {/* building mass */}
      <mesh position={[0, block.h / 2 + 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[block.w, block.h, block.d]} />
        <meshStandardMaterial
          color={block.color}
          roughness={0.55}
          metalness={0.15}
          emissive={block.color}
          emissiveIntensity={0.12}
        />
      </mesh>
      {/* roof cap accent */}
      <mesh position={[0, block.h + 0.14, 0]}>
        <boxGeometry args={[block.w * 0.98, 0.06, block.d * 0.98]} />
        <meshStandardMaterial color={ACCENT2} emissive={ACCENT2} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function RouteMarker({ position, kind, color }: { position: THREE.Vector3; kind: 'dot' | 'ring' | 'square'; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.08;
    ref.current.scale.setScalar(s);
  });
  return (
    <group ref={ref} position={[position.x, 1.1, position.z]}>
      {kind === 'dot' && (
        <mesh castShadow>
          <sphereGeometry args={[0.5, 20, 20]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
        </mesh>
      )}
      {kind === 'ring' && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.12, 12, 28]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
        </mesh>
      )}
      {kind === 'square' && (
        <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
          <boxGeometry args={[0.75, 0.75, 0.75]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
        </mesh>
      )}
      <pointLight color={color} intensity={1.2} distance={6} />
    </group>
  );
}

function FuelMarker({ position }: { position: THREE.Vector3 }) {
  return (
    <mesh position={[position.x, 0.5, position.z]} castShadow>
      <coneGeometry args={[0.32, 0.7, 6]} />
      <meshStandardMaterial color={FUEL} emissive={FUEL} emissiveIntensity={0.7} />
    </mesh>
  );
}

function MovingVehicle({ curve, duration }: { curve: THREE.CatmullRomCurve3; duration: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime % duration) / duration;
    const pos = curve.getPointAt(t);
    const lookAhead = curve.getPointAt(Math.min(t + 0.01, 1));
    ref.current.position.set(pos.x, 0.55, pos.z);
    ref.current.lookAt(lookAhead.x, 0.55, lookAhead.z);
  });
  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[0.9, 0.4, 0.5]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={1.1} />
      </mesh>
      <pointLight color={GOLD} intensity={1.6} distance={5} />
    </group>
  );
}

function RoutePath({ points }: { points: THREE.Vector3[] }) {
  const elevated = points.map((p) => new THREE.Vector3(p.x, 0.28, p.z));
  return (
    <>
      {/* soft glow underlay */}
      <Line points={elevated} color={ACCENT2} lineWidth={9} transparent opacity={0.25} />
      {/* crisp core line */}
      <Line points={elevated} color={ACCENT2} lineWidth={3.2} />
    </>
  );
}

function Scene({ route, fuelStops }: { route: TripRoute; fuelStops: LatLng[] }) {
  const center = useMemo<LatLng>(
    () => ({
      lat: (route.start.lat + route.stop.lat + route.finish.lat) / 3,
      lng: (route.start.lng + route.stop.lng + route.finish.lng) / 3,
    }),
    [route]
  );

  const pStart = useMemo(() => project(route.start, center), [route, center]);
  const pStop = useMemo(() => project(route.stop, center), [route, center]);
  const pFinish = useMemo(() => project(route.finish, center), [route, center]);
  const pFuel = useMemo(() => fuelStops.map((f) => project(f, center)), [fuelStops, center]);

  const curve = useMemo(() => new THREE.CatmullRomCurve3([pStart, pStop, pFinish], false, 'catmullrom', 0.2), [pStart, pStop, pFinish]);
  const curvePoints = useMemo(() => curve.getPoints(48), [curve]);
  const routeSegments = useMemo<[THREE.Vector3, THREE.Vector3][]>(
    () => curvePoints.slice(0, -1).map((p, i) => [p, curvePoints[i + 1]] as [THREE.Vector3, THREE.Vector3]),
    [curvePoints]
  );

  const blocks = useMemo(() => generateCityBlocks(routeSegments, 1337), [routeSegments]);

  const boundsSize = GRID * (PAD + AVENUE_GAP);

  return (
    <>
      <fog attach="fog" args={['#0A0B12', boundsSize * 0.55, boundsSize * 1.4]} />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[boundsSize * 0.3, boundsSize * 0.5, boundsSize * 0.2]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-boundsSize / 1.5}
        shadow-camera-right={boundsSize / 1.5}
        shadow-camera-top={boundsSize / 1.5}
        shadow-camera-bottom={-boundsSize / 1.5}
      />
      <pointLight position={[0, 12, 0]} intensity={0.3} color={ACCENT2} />

      {/* ground / street bed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[boundsSize * 1.15, boundsSize * 1.15]} />
        <meshStandardMaterial color={ASPHALT} roughness={1} />
      </mesh>

      {blocks.map((b, i) => (
        <Building key={i} block={b} />
      ))}

      <RoutePath points={curvePoints} />
      <RouteMarker position={pStart} kind="dot" color={ACCENT2} />
      <RouteMarker position={pStop} kind="ring" color={ACCENT2} />
      <RouteMarker position={pFinish} kind="square" color={ACCENT2} />
      {pFuel.map((p, i) => (
        <FuelMarker key={i} position={p} />
      ))}
      <MovingVehicle curve={curve} duration={9} />

      <Sparkles count={70} scale={[boundsSize, 6, boundsSize]} size={1.4} speed={0.15} color={ACCENT2} opacity={0.35} />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={boundsSize * 0.18}
        maxDistance={boundsSize * 0.95}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 0.5, 0]}
      />
    </>
  );
}

export interface CityRouteScene3DProps {
  route: TripRoute;
  fuelStops?: LatLng[];
}

export default function CityRouteScene3D({ route, fuelStops = [] }: CityRouteScene3DProps) {
  const boundsSize = GRID * (PAD + AVENUE_GAP);
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [boundsSize * 0.5, boundsSize * 0.55, boundsSize * 0.6], fov: 42 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#0A0B12']} />
      <Suspense fallback={null}>
        <Scene route={route} fuelStops={fuelStops} />
      </Suspense>
    </Canvas>
  );
}