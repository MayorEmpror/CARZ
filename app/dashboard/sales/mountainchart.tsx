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
const PRICE_TIER_BOUNDS = [25000, 42000];

function priceTierIndex(make: string): number {
  const price = APPROX_STARTING_MSRP[make] ?? 30000;
  if (price < PRICE_TIER_BOUNDS[0]) return 0;
  if (price < PRICE_TIER_BOUNDS[1]) return 1;
  return 2;
}

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

type ModelCountGrid = number[][];

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

// ---------- caching ----------
// Two layers:
// 1. In-memory module cache — instant reuse across remounts within the
//    same JS context (e.g. React StrictMode double-invoke, tab switching
//    within the SPA without a full reload).
// 2. sessionStorage — survives a hard page refresh but is automatically
//    cleared the moment the tab/browser window is closed, which is exactly
//    "cache for this tab session, wipe on close" with zero manual cleanup.
const SESSION_CACHE_KEY = "sales-mountain-vpic-cache-v1";

type CachedPayload = { grid: ModelCountGrid; breadth: number[] };

let cachedGrid: ModelCountGrid | null = null;
let cachedBreadth: number[] | null = null;

function readSessionCache(): CachedPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    if (!parsed?.grid || !parsed?.breadth) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(payload: CachedPayload) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage can throw in private-browsing/quota edge cases —
    // safe to ignore, in-memory cache still works for this session.
  }
}

async function loadData(): Promise<{ grid: ModelCountGrid; breadth: number[] }> {
  // fastest path: already loaded in this JS context
  if (cachedGrid && cachedBreadth) {
    return { grid: cachedGrid, breadth: cachedBreadth };
  }

  // next fastest: survived a page refresh within this tab session
  const fromSession = readSessionCache();
  if (fromSession) {
    cachedGrid = fromSession.grid;
    cachedBreadth = fromSession.breadth;
    return fromSession;
  }

  // slow path: actually hit the NHTSA API
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
  writeSessionCache({ grid, breadth });
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

const WORLD_W = 44;
const WORLD_D = 40;
const MAX_HEIGHT = 9;
const DATA_BAND_D = 35;
const RES_X = 300;
const RES_Z = 280;

function baseHeight(x: number, z: number) {
  const detail = fbm(x * 0.5, z * 0.5, 4);
  let h = detail * MAX_HEIGHT * 0.1;
  const edgeFadeX = 1 - Math.pow(Math.abs(x) / (WORLD_W / 2), 4);
  const edgeFadeZ = 1 - Math.pow(Math.abs(z) / (WORLD_D / 2), 4);
  h *= Math.max(edgeFadeX, 0) * Math.max(edgeFadeZ, 0);
  return Math.max(h, 0.02);
}

const terrainVertexShader = /* glsl */ `
  attribute float aValue;
  attribute float aBreadth;
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

  vec3 dataTint(float t) {
    vec3 low  = vec3(0.10, 0.30, 0.36);
    vec3 mid  = vec3(0.55, 0.42, 0.20);
    vec3 high = vec3(0.92, 0.46, 0.16);
    if (t < 0.5) return mix(low, mid, smoothstep(0.0, 0.5, t));
    return mix(mid, high, smoothstep(0.5, 1.0, t));
  }

  vec3 breadthTint(float t) {
    vec3 low  = vec3(0.08, 0.10, 0.24);
    vec3 high = vec3(0.66, 0.22, 0.58);
    return mix(low, high, smoothstep(0.0, 1.0, t));
  }

  void main() {
    float hNorm = clamp(vHeight / ${MAX_HEIGHT.toFixed(1)}, 0.0, 1.0);
    float grain = hash13(floor(vPosW * 6.0));
    float fineGrain = hash13(floor(vPosW * 22.0));
    vec3 base = rockTone(hNorm, grain * 0.6 + fineGrain * 0.4);

    vec3 t1 = dataTint(vValue);
    base = mix(base, t1, 0.46 * vValue);

    vec3 t2 = breadthTint(vBreadth);
    base = mix(base, t2, 0.20);

    vec3 n = normalize(vNormalW);
    float warmDiffuse = max(dot(n, normalize(uLightDirWarm)), 0.0);
    float coolDiffuse = max(dot(n, normalize(uLightDirCool)), 0.0);

    vec3 warmLight = vec3(1.0, 0.62, 0.35) * warmDiffuse * 0.85;
    vec3 coolLight = vec3(0.45, 0.75, 0.85) * coolDiffuse * 0.55;

    float ao = mix(0.72, 1.0, smoothstep(0.0, 0.35, hNorm));

    vec3 ambient = base * 0.26 * ao;
    vec3 lit = ambient + base * (warmLight + coolLight) * ao;

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

  const makeLabels = useMemo(() => {
    const labelZ = WORLD_D / 2 + 2.4;
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

      <gridHelper
        args={[Math.max(WORLD_W, DATA_BAND_D), cols, "#3a4a52", "#233038"]}
        position={[0, 0.03, 0]}
        scale={[1, 1, DATA_BAND_D / Math.max(WORLD_W, DATA_BAND_D)]}
      />

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
          <mesh position={[x, tickY, tickZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.04, 0.5]} />
            <meshBasicMaterial color="#5fb0c9" toneMapped={false} />
          </mesh>
        </group>
      ))}

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
          <directionalLight position={[24, 18, -10]} intensity={0.55} />

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