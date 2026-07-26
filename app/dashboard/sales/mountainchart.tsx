"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

const VPIC_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";

const MAKES = [
  "Toyota", "Honda", "Ford", "Chevrolet", "BMW",
  "Mercedes-Benz", "Audi", "Volkswagen", "Hyundai", "Kia",
  "Nissan", "Tesla",
];

const VEHICLE_TYPES = ["car", "mpv", "truck"] as const;
const VEHICLE_TYPE_LABELS = ["Car", "SUV / MPV", "Truck"];

// ---------- pricing axis ----------
// vPIC has no price field anywhere (confirmed against its live API + docs —
// it's a VIN-decoding/regulatory dataset, not a marketplace dataset). Every
// free pricing API that exists (CarAPI, CarsXE, MarketCheck, VinAudit, etc.)
// requires a paid/keyed account and isn't reachable from a keyless browser
// fetch. So the price axis below is a small, static, transparently-labeled
// reference table of approximate 2025 US starting MSRP per make — NOT live
// data. Everything else (model counts -> height, category breadth -> color)
// is still real, live vPIC data.
const APPROX_STARTING_MSRP: Record<string, number> = {
  Toyota: 24000,
  Honda: 24000,
  Ford: 23000,
  Chevrolet: 22000,
  BMW: 38000,
  "Mercedes-Benz": 45000,
  Audi: 42000,
  Volkswagen: 24000,
  Hyundai: 21000,
  Kia: 20000,
  Nissan: 22000,
  Tesla: 40000,
};
const PRICE_TIER_LABELS = ["Budget", "Mid-range", "Premium"];
const PRICE_TIER_BOUNDS = [25000, 42000]; // < first = tier 0, < second = tier 1, else tier 2

function priceTierIndex(make: string): number {
  const price = APPROX_STARTING_MSRP[make] ?? 30000;
  if (price < PRICE_TIER_BOUNDS[0]) return 0;
  if (price < PRICE_TIER_BOUNDS[1]) return 1;
  return 2;
}

// The row axis is now body-type × price-tier (3 × 3 = 9 rows) instead of
// just body type (3 rows) — a real make only lands in one price tier, so
// each column's real model counts settle into 3 of the 9 rows, the rest
// stay at 0. This is what makes the terrain bigger/more varied.
type RowDef = { typeIdx: number; typeLabel: string; tierIdx: number; tierLabel: string };
const ROWS: RowDef[] = VEHICLE_TYPES.flatMap((_, typeIdx) =>
  PRICE_TIER_LABELS.map((tierLabel, tierIdx) => ({
    typeIdx,
    typeLabel: VEHICLE_TYPE_LABELS[typeIdx],
    tierIdx,
    tierLabel,
  }))
);

type VpicModel = { Make_Name: string; Model_ID: number; Model_Name: string };
type VpicModelResponse = { Count: number; Results: VpicModel[] };

type VpicVehicleType = { VehicleTypeId: number; VehicleTypeName: string };
type VpicTypeResponse = { Count: number; Results: VpicVehicleType[] };

type ModelCountGrid = number[][]; // [rowIdx][makeIdx] -> real model count (0 outside the make's price tier)

async function fetchModelCount(make: string, vehicleType: string): Promise<number> {
  const url = `${VPIC_BASE}/getmodelsformakeyear/make/${encodeURIComponent(
    make
  )}/vehicletype/${vehicleType}?format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return 0;
    const data: VpicModelResponse = await res.json();
    return new Set(data.Results.map((m) => m.Model_ID)).size;
  } catch {
    return 0;
  }
}

/** Real 4th-dimension metric: how many distinct vehicle categories
 *  (car, truck, MPV, motorcycle, bus, trailer, etc.) a manufacturer
 *  produces overall — a genuine "portfolio breadth" signal from vPIC. */
async function fetchVehicleTypeBreadth(make: string): Promise<number> {
  const url = `${VPIC_BASE}/getvehicletypesformake/${encodeURIComponent(make)}?format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return 0;
    const data: VpicTypeResponse = await res.json();
    return data.Results?.length ?? 0;
  } catch {
    return 0;
  }
}

let cachedGrid: ModelCountGrid | null = null;
let cachedBreadth: number[] | null = null;

async function loadData(): Promise<{ grid: ModelCountGrid; breadth: number[] }> {
  if (cachedGrid && cachedBreadth) return { grid: cachedGrid, breadth: cachedBreadth };

  const grid: ModelCountGrid = ROWS.map(() => new Array(MAKES.length).fill(0));
  const breadth: number[] = new Array(MAKES.length).fill(0);

  await Promise.all([
    Promise.all(
      VEHICLE_TYPES.map((type, typeIdx) =>
        Promise.all(
          MAKES.map(async (make, colIdx) => {
            const count = await fetchModelCount(make, type);
            const tierIdx = priceTierIndex(make);
            const rowIdx = typeIdx * PRICE_TIER_LABELS.length + tierIdx;
            grid[rowIdx][colIdx] = count;
          })
        )
      )
    ),
    Promise.all(
      MAKES.map(async (make, idx) => {
        breadth[idx] = await fetchVehicleTypeBreadth(make);
      })
    ),
  ]);

  cachedGrid = grid;
  cachedBreadth = breadth;
  return { grid, breadth };
}

// ---------- noise ----------
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
function valueNoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash(xi, yi), b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  const ux = xf * xf * (3 - 2 * xf);
  const uy = yf * yf * (3 - 2 * yf);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, ux), THREE.MathUtils.lerp(c, d, ux), uy);
}
function fbm(x: number, y: number, octaves = 5) {
  let total = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    total += valueNoise(x * freq, y * freq) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2.02;
  }
  return total / max;
}
function ridgedFbm(x: number, y: number, octaves = 5) {
  let total = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(valueNoise(x * freq, y * freq) * 2 - 1);
    total += n * n * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2.08;
  }
  return total / max;
}
function warp(x: number, y: number) {
  const wx = fbm(x * 0.6 + 4.2, y * 0.6 - 1.7, 3);
  const wy = fbm(x * 0.6 - 2.3, y * 0.6 + 8.1, 3);
  return [x + (wx - 0.5) * 1.6, y + (wy - 0.5) * 1.6];
}

function sampleGrid(grid: number[][], u: number, v: number, cols: number, rows: number) {
  const gx = u * (cols - 1);
  const gy = v * (rows - 1);
  const x0 = Math.floor(gx), x1 = Math.min(x0 + 1, cols - 1);
  const y0 = Math.floor(gy), y1 = Math.min(y0 + 1, rows - 1);
  const fx = gx - x0, fy = gy - y0;
  const v00 = grid[y0][x0], v10 = grid[y0][x1];
  const v01 = grid[y1][x0], v11 = grid[y1][x1];
  const top = THREE.MathUtils.lerp(v00, v10, fx);
  const bot = THREE.MathUtils.lerp(v01, v11, fx);
  return THREE.MathUtils.lerp(top, bot, fy);
}
function sample1D(arr: number[], u: number) {
  const gx = u * (arr.length - 1);
  const x0 = Math.floor(gx), x1 = Math.min(x0 + 1, arr.length - 1);
  return THREE.MathUtils.lerp(arr[x0], arr[x1], gx - x0);
}

function smoothGrid(grid: number[][], passes = 2): number[][] {
  let g = grid.map((row) => [...row]);
  const rows = g.length;
  const cols = g[0]?.length ?? 0;
  if (!rows || !cols) return g;
  for (let p = 0; p < passes; p++) {
    const next = g.map((row) => [...row]);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const l = g[r][Math.max(c - 1, 0)];
        const rr = g[r][Math.min(c + 1, cols - 1)];
        const u = g[Math.max(r - 1, 0)][c];
        const d = g[Math.min(r + 1, rows - 1)][c];
        next[r][c] = (g[r][c] * 2 + l + rr + u + d) / 6;
      }
    }
    g = next;
  }
  return g;
}
function smooth1D(arr: number[], passes = 2): number[] {
  let a = [...arr];
  for (let p = 0; p < passes; p++) {
    const next = [...a];
    for (let i = 0; i < a.length; i++) {
      const l = a[Math.max(i - 1, 0)];
      const r = a[Math.min(i + 1, a.length - 1)];
      next[i] = (a[i] * 2 + l + r) / 4;
    }
    a = next;
  }
  return a;
}

// ---------- world scale ----------
// WORLD_W carries the 12-make axis, so it stays wide. WORLD_D now needs to
// hold 9 rows (3 body types × 3 price tiers) instead of 3, so it's grown
// back up — this is the "bigger terrain" the price axis buys us. DATA_BAND_D
// covers nearly all of that depth, so real vPIC data — not decorative
// noise — is still what shapes the terrain.
const WORLD_W = 44;
const WORLD_D = 40;
const MAX_HEIGHT = 9;
const DATA_BAND_D = 35;
const RES_X = 300;
const RES_Z = 280;

/** Base terrain height: gentle rolling texture only, NOT a competing
 *  mountain range. This used to be a full ridged-fbm range at 70% of
 *  MAX_HEIGHT, which dwarfed the real data band. Now it's a soft fbm
 *  backdrop at ~10% weight — present for atmosphere, never dominant.
 *  Shared by the geometry generator AND label placement so labels always
 *  know exactly how tall the ground is beneath them. */
function baseHeight(x: number, z: number) {
  const detail = fbm(x * 0.5, z * 0.5, 4);
  let h = detail * MAX_HEIGHT * 0.1;
  const edgeFadeX = 1 - Math.pow(Math.abs(x) / (WORLD_W / 2), 4);
  const edgeFadeZ = 1 - Math.pow(Math.abs(z) / (WORLD_D / 2), 4);
  h *= Math.max(edgeFadeX, 0) * Math.max(edgeFadeZ, 0);
  return Math.max(h, 0.02);
}

const terrainVertexShader = /* glsl */ `
  attribute float aValue;   // height-band data signal (0..1)
  attribute float aBreadth; // 4th axis: manufacturer breadth (0..1), spans whole plane
  varying float vHeight;
  varying float vValue;
  varying float vBreadth;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vHeight = position.y;
    vValue = aValue;
    vBreadth = aBreadth;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPosW = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const terrainFragmentShader = /* glsl */ `
  uniform vec3 uLightDirWarm;
  uniform vec3 uLightDirCool;
  varying float vHeight;
  varying float vValue;
  varying float vBreadth;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec3 rockTone(float h, float grain) {
    vec3 scree = vec3(0.075, 0.070, 0.070);
    vec3 dirt  = vec3(0.165, 0.130, 0.105);
    vec3 rock  = vec3(0.320, 0.285, 0.260);
    vec3 alpine= vec3(0.560, 0.530, 0.485);
    vec3 snow  = vec3(0.960, 0.945, 0.915);
    vec3 col;
    if (h < 0.16) col = mix(scree, dirt, smoothstep(0.0, 0.16, h));
    else if (h < 0.40) col = mix(dirt, rock, smoothstep(0.16, 0.40, h));
    else if (h < 0.72) col = mix(rock, alpine, smoothstep(0.40, 0.72, h));
    else col = mix(alpine, snow, smoothstep(0.72, 0.92, h));
    col *= 0.92 + grain * 0.16;
    return col;
  }

  // data-band tint: low model count -> teal, high -> ember
  vec3 dataTint(float t) {
    vec3 low  = vec3(0.10, 0.30, 0.36);
    vec3 mid  = vec3(0.55, 0.42, 0.20);
    vec3 high = vec3(0.92, 0.46, 0.16);
    if (t < 0.5) return mix(low, mid, smoothstep(0.0, 0.5, t));
    return mix(mid, high, smoothstep(0.5, 1.0, t));
  }

  // 4th axis tint: manufacturer breadth -> violet/magenta hue, spans the
  // WHOLE terrain (not just the data band), independent of height/count
  vec3 breadthTint(float t) {
    vec3 low  = vec3(0.08, 0.10, 0.24); // narrow portfolio -> deep indigo
    vec3 high = vec3(0.66, 0.22, 0.58); // broad portfolio -> magenta
    return mix(low, high, smoothstep(0.0, 1.0, t));
  }

  void main() {
    float hNorm = clamp(vHeight / ${MAX_HEIGHT.toFixed(1)}, 0.0, 1.0);
    float grain = hash13(floor(vPosW * 6.0));
    float fineGrain = hash13(floor(vPosW * 22.0));
    vec3 base = rockTone(hNorm, grain * 0.6 + fineGrain * 0.4);

    // layer 1: real model-count tint, confined to the data band (vValue > 0 there)
    vec3 t1 = dataTint(vValue);
    base = mix(base, t1, 0.46 * vValue);

    // layer 2: real manufacturer-breadth tint, washes across the ENTIRE
    // terrain at low opacity so it reads as an atmospheric/ambient signal
    vec3 t2 = breadthTint(vBreadth);
    base = mix(base, t2, 0.20);

    vec3 n = normalize(vNormalW);
    float warmDiffuse = max(dot(n, normalize(uLightDirWarm)), 0.0);
    float coolDiffuse = max(dot(n, normalize(uLightDirCool)), 0.0);

    vec3 warmLight = vec3(1.0, 0.62, 0.35) * warmDiffuse * 0.85;
    vec3 coolLight = vec3(0.45, 0.75, 0.85) * coolDiffuse * 0.55;

    // fake ambient occlusion in low, flat, dark crevices
    float ao = mix(0.72, 1.0, smoothstep(0.0, 0.35, hNorm));

    vec3 ambient = base * 0.26 * ao;
    vec3 lit = ambient + base * (warmLight + coolLight) * ao;

    // subtle snow-glint specular, view dependent
    vec3 viewDir = normalize(cameraPosition - vPosW);
    vec3 halfDir = normalize(normalize(uLightDirWarm) + viewDir);
    float specPower = mix(6.0, 46.0, smoothstep(0.7, 1.0, hNorm));
    float spec = pow(max(dot(n, halfDir), 0.0), specPower);
    lit += vec3(1.0, 0.98, 0.95) * spec * smoothstep(0.70, 0.92, hNorm) * 0.55;

    gl_FragColor = vec4(lit, 1.0);
  }
`;

function Terrain({
  grid,
  breadth,
  onHover,
}: {
  grid: ModelCountGrid;
  breadth: number[];
  onHover: (label: string | null, clientX?: number, clientY?: number) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hoverPoint, setHoverPoint] = useState<[number, number, number] | null>(null);

  const rows = ROWS.length;
  const cols = MAKES.length;

  const { maxCount, smoothed, maxBreadth, smoothedBreadth } = useMemo(() => {
    const s = smoothGrid(grid, 2);
    let m = 0;
    for (const row of s) for (const v of row) m = Math.max(m, v);
    const sb = smooth1D(breadth, 1);
    const mb = Math.max(...sb, 1);
    return { maxCount: m || 1, smoothed: s, maxBreadth: mb, smoothedBreadth: sb };
  }, [grid, breadth]);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WORLD_W, WORLD_D, RES_X, RES_Z);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const aValue = new Float32Array(pos.count);
    const aBreadth = new Float32Array(pos.count);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      let h = baseHeight(x, z);

      let dataVal = 0;
      const bandHalf = DATA_BAND_D / 2;
      if (z > -bandHalf && z < bandHalf) {
        const u = (x + WORLD_W / 2) / WORLD_W;
        const v = (z + bandHalf) / DATA_BAND_D;
        dataVal = sampleGrid(smoothed, THREE.MathUtils.clamp(u, 0, 1), THREE.MathUtils.clamp(v, 0, 1), cols, rows) / maxCount;

        const bandFade = 1 - Math.pow(Math.abs(z) / bandHalf, 2);
        const shaped = Math.pow(Math.max(dataVal, 0), 1.25) * bandFade;

        const fineDetail = fbm(x * 3.5, z * 3.5, 3) - 0.5;
        const dataHeight = shaped * MAX_HEIGHT * 1.15 + fineDetail * 0.3 * (0.3 + shaped);

        h = Math.max(h, h * 0.4 + dataHeight);
        dataVal = shaped;
      }

      // 4th axis: breadth is sampled purely along X (per-make), spans full Z
      const uFull = THREE.MathUtils.clamp((x + WORLD_W / 2) / WORLD_W, 0, 1);
      const breadthVal = sample1D(smoothedBreadth, uFull) / maxBreadth;

      pos.setY(i, Math.max(h, 0.02));
      aValue[i] = dataVal;
      aBreadth[i] = breadthVal;
    }

    geo.setAttribute("aValue", new THREE.BufferAttribute(aValue, 1));
    geo.setAttribute("aBreadth", new THREE.BufferAttribute(aBreadth, 1));
    geo.computeVertexNormals();
    return geo;
  }, [smoothed, maxCount, smoothedBreadth, maxBreadth, rows, cols]);

  const terrainMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uLightDirWarm: { value: new THREE.Vector3(-1, 1, 0.4).normalize() },
        uLightDirCool: { value: new THREE.Vector3(1, 0.8, -0.3).normalize() },
      },
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
    });
  }, []);

  // Precompute label + tick positions once, always resting ON TOP of the
  // real terrain surface beneath them (fixes labels being buried under
  // the mesh) instead of at a flat, arbitrary y.
  const makeLabels = useMemo(() => {
    const labelZ = WORLD_D / 2 + 2.4; // outside the terrain footprint -> guaranteed flat ground
    const tickZ = DATA_BAND_D / 2 + 0.5;
    return MAKES.map((make, i) => {
      const x = (i / (cols - 1)) * WORLD_W - WORLD_W / 2;
      return {
        make,
        x,
        labelY: baseHeight(x, labelZ) + 0.45,
        labelZ,
        tickY: baseHeight(x, tickZ) + 0.06,
        tickZ,
      };
    });
  }, [cols]);

  // Two label tiers for the 9-row axis: an outer group label per body type
  // (Car / SUV-MPV / Truck) and an inner label per price tier row, so the
  // combined axis reads clearly instead of cramming 9 long strings together.
  const tierRowLabels = useMemo(() => {
    const labelX = -WORLD_W / 2 - 1.7;
    const tickX = -WORLD_W / 2 - 0.5;
    return ROWS.map((r, i) => {
      const z = (i / (rows - 1)) * DATA_BAND_D - DATA_BAND_D / 2;
      return {
        key: `${r.typeLabel}-${r.tierLabel}`,
        tierLabel: r.tierLabel,
        z,
        labelY: baseHeight(labelX, z) + 0.4,
        labelX,
        tickY: baseHeight(tickX, z) + 0.06,
        tickX,
      };
    });
  }, [rows]);

  const typeGroupLabels = useMemo(() => {
    const labelX = -WORLD_W / 2 - 3.9;
    const tiersPerType = PRICE_TIER_LABELS.length;
    return VEHICLE_TYPE_LABELS.map((label, typeIdx) => {
      const centerRow = typeIdx * tiersPerType + (tiersPerType - 1) / 2;
      const z = (centerRow / (rows - 1)) * DATA_BAND_D - DATA_BAND_D / 2;
      return { label, z, labelY: baseHeight(labelX, z) + 0.55, labelX };
    });
  }, [rows]);

  const axisTitleY = useMemo(() => baseHeight(0, -WORLD_D / 2 + 2.0) + 0.55, []);

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const p = e.point;
    const bandHalf = DATA_BAND_D / 2;
    if (p.z < -bandHalf || p.z > bandHalf) {
      onHover(null);
      setHoverPoint(null);
      return;
    }
    const u = (p.x + WORLD_W / 2) / WORLD_W;
    const v = (p.z + bandHalf) / DATA_BAND_D;
    if (u < 0 || u > 1 || v < 0 || v > 1) {
      onHover(null);
      setHoverPoint(null);
      return;
    }
    const makeIdx = Math.round(u * (cols - 1));
    const rowIdx = Math.round(v * (rows - 1));
    const row = ROWS[rowIdx];
    const count = grid[rowIdx]?.[makeIdx] ?? 0;
    const b = breadth[makeIdx] ?? 0;
    const price = APPROX_STARTING_MSRP[MAKES[makeIdx]];
    const priceStr = price ? `~$${Math.round(price / 1000)}k starting (est.)` : "price n/a";
    const label = `${MAKES[makeIdx]} — ${row.typeLabel} · ${row.tierLabel}\n${count} model${count === 1 ? "" : "s"} on file · ${priceStr}\n${b} vehicle categories overall`;
    onHover(label, e.nativeEvent.clientX, e.nativeEvent.clientY);
    setHoverPoint([p.x, p.y, p.z]);
  };

  const handleOut = () => {
    onHover(null);
    setHoverPoint(null);
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={terrainMaterial}
        onPointerMove={handleMove}
        onPointerOut={handleOut}
        receiveShadow
        castShadow
      />

      {/* -------- hover marker: a small ring that sits exactly on the peak under the cursor -------- */}
      {hoverPoint && (
        <group position={[hoverPoint[0], hoverPoint[1] + 0.03, hoverPoint[2]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.16, 0.24, 40]} />
            <meshBasicMaterial color="#8fe3f5" transparent opacity={0.95} toneMapped={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.28, 0.32, 40]} />
            <meshBasicMaterial color="#8fe3f5" transparent opacity={0.35} toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* -------- grid overlay on the data band floor -------- */}
      <gridHelper
        args={[Math.max(WORLD_W, DATA_BAND_D), cols, "#3a4a52", "#233038"]}
        position={[0, 0.03, 0]}
        scale={[1, 1, DATA_BAND_D / Math.max(WORLD_W, DATA_BAND_D)]}
      />

      {/* -------- make (column) axis labels — rest on real ground beyond the terrain edge -------- */}
      {makeLabels.map(({ make, x, labelY, labelZ, tickY, tickZ }) => (
        <group key={make}>
          <Text
            position={[x, labelY, labelZ]}
            fontSize={0.52}
            color="#eef1f4"
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
            outlineWidth={0.02}
            outlineColor="#000000"
            renderOrder={10}
          >
            {make}
          </Text>
          {/* leader tick, sitting on the actual terrain surface at the band edge */}
          <mesh position={[x, tickY, tickZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.04, 0.5]} />
            <meshBasicMaterial color="#5fb0c9" toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* -------- price-tier (row) axis labels — small, one per row -------- */}
      {tierRowLabels.map(({ key, tierLabel, z, labelY, labelX, tickY, tickX }) => (
        <group key={key}>
          <Text
            position={[labelX, labelY, z]}
            fontSize={0.36}
            color="#cfe8ef"
            anchorX="right"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
            outlineWidth={0.015}
            outlineColor="#000000"
            renderOrder={10}
          >
            {tierLabel}
          </Text>
          <mesh position={[tickX, tickY, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.4, 0.03]} />
            <meshBasicMaterial color="#5fb0c9" toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* -------- body-type (row group) axis labels — bold, one per 3-row group -------- */}
      {typeGroupLabels.map(({ label, z, labelY, labelX }) => (
        <Text
          key={label}
          position={[labelX, labelY, z]}
          fontSize={0.56}
          color="#eef1f4"
          anchorX="right"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
          outlineWidth={0.022}
          outlineColor="#000000"
          renderOrder={10}
        >
          {label}
        </Text>
      ))}

      {/* -------- 4th axis label -------- */}
      <Text
        position={[0, axisTitleY, -WORLD_D / 2 + 2.0]}
        fontSize={0.55}
        color="#e6c1ee"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
        outlineWidth={0.02}
        outlineColor="#000000"
        renderOrder={10}
      >
        color wash = manufacturer category breadth
      </Text>

      {/* -------- price-axis disclosure -------- */}
      <Text
        position={[0, axisTitleY - 0.02, -WORLD_D / 2 + 3.1]}
        fontSize={0.32}
        color="#9fb3ba"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
        outlineWidth={0.012}
        outlineColor="#000000"
        renderOrder={10}
      >
        rows = body type × approx. starting-price tier (static reference, not live pricing)
      </Text>
    </group>
  );
}

function GroundPlane() {
  return (
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[WORLD_W + 40, WORLD_D + 40]} />
      <meshStandardMaterial color="#050506" roughness={1} />
    </mesh>
  );
}

export default function SalesMountainChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState<ModelCountGrid | null>(null);
  const [breadth, setBreadth] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadData()
      .then(({ grid, breadth }) => {
        if (!cancelled) {
          setGrid(grid);
          setBreadth(breadth);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't reach the NHTSA vPIC API.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleHover = (label: string | null, clientX?: number, clientY?: number) => {
    if (!label || clientX == null || clientY == null) {
      setTooltip(null);
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? clientX - rect.left : clientX;
    const y = rect ? clientY - rect.top : clientY;
    setTooltip({ x, y, label });
  };

  const ready = grid && breadth;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
     
      onPointerDown={() => setAutoRotate(false)}
    >
      {!ready && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-zinc-400">
          Fetching live vehicle data from NHTSA vPIC…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-rose-400">
          {error}
        </div>
      )}

      {ready && (
        <Canvas shadows camera={{ position: [34, 22, 32], fov: 45 }} gl={{ antialias: true }}>
          <fog attach="fog" args={["#0a0d10", 28, 86]} />

          <ambientLight intensity={0.16} />
          <directionalLight
            position={[-24, 26, 10]}
            intensity={1.0}
           
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-32}
            shadow-camera-right={32}
            shadow-camera-top={32}
            shadow-camera-bottom={-32}
          />
          <directionalLight position={[24, 18, -10]} intensity={0.55}  />

          <GroundPlane />
          <Terrain grid={grid} breadth={breadth} onHover={handleHover} />

          <OrbitControls
            enablePan={false}
            minDistance={18}
            maxDistance={62}
            minPolarAngle={Math.PI / 7}
            maxPolarAngle={Math.PI / 2.15}
            autoRotate={autoRotate}
            autoRotateSpeed={0.4}
            target={[0, 1.5, 0]}
          />

          <EffectComposer>
            <Bloom intensity={0.15} luminanceThreshold={0.65} luminanceSmoothing={0.25} mipmapBlur />
            <Vignette eskil={false} offset={0.2} darkness={0.65} />
          </EffectComposer>
        </Canvas>
      )}

      {/* Cursor-following tooltip, rendered in screen space so it's never
          occluded by the terrain and always reads clearly over the mouse. */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 max-w-[16rem] whitespace-pre-line rounded-lg border border-white/10 bg-black/85 px-3 py-2 text-xs leading-snug text-zinc-100 shadow-lg backdrop-blur-sm"
          style={{ left: tooltip.x + 16, top: tooltip.y + 16 }}
        >
          {tooltip.label}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-4 text-xs text-zinc-500">
        drag to rotate · scroll to zoom · height/teal-ember = models on file · rows = body type × price tier (est.) · indigo-magenta wash = category breadth
      </div>
    </div>
  );
}