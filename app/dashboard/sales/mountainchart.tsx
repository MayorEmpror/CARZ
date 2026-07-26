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

type VpicModel = { Make_Name: string; Model_ID: number; Model_Name: string };
type VpicModelResponse = { Count: number; Results: VpicModel[] };

type VpicVehicleType = { VehicleTypeId: number; VehicleTypeName: string };
type VpicTypeResponse = { Count: number; Results: VpicVehicleType[] };

type ModelCountGrid = number[][]; // [vehicleTypeIdx][makeIdx] -> real model count

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

  const grid: ModelCountGrid = VEHICLE_TYPES.map(() => new Array(MAKES.length).fill(0));
  const breadth: number[] = new Array(MAKES.length).fill(0);

  await Promise.all([
    Promise.all(
      VEHICLE_TYPES.map((type, rowIdx) =>
        Promise.all(
          MAKES.map(async (make, colIdx) => {
            grid[rowIdx][colIdx] = await fetchModelCount(make, type);
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

const WORLD_W = 32;
const WORLD_D = 30;
const MAX_HEIGHT = 9;
const DATA_BAND_D = 8;
const RES_X = 260;
const RES_Z = 240;

const terrainVertexShader = /* glsl */ `
  attribute float aValue;   // height-band data signal (0..1)
  attribute float aBreadth; // 4th axis: manufacturer breadth (0..1), spans whole plane
  varying float vHeight;
  varying float vValue;
  varying float vBreadth;
  varying vec3 vNormalW;
  void main() {
    vHeight = position.y;
    vValue = aValue;
    vBreadth = aBreadth;
    vNormalW = normalize(mat3(modelMatrix) * normal);
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

  vec3 rockTone(float h) {
    vec3 scree = vec3(0.09, 0.08, 0.08);
    vec3 rock  = vec3(0.30, 0.27, 0.25);
    vec3 alpine= vec3(0.54, 0.51, 0.47);
    vec3 snow  = vec3(0.93, 0.91, 0.87);
    if (h < 0.32) return mix(scree, rock, h / 0.32);
    if (h < 0.72) return mix(rock, alpine, (h - 0.32) / 0.4);
    return mix(alpine, snow, (h - 0.72) / 0.28);
  }

  // data-band tint: low model count -> teal, high -> ember
  vec3 dataTint(float t) {
    vec3 low  = vec3(0.09, 0.26, 0.32);
    vec3 high = vec3(0.85, 0.42, 0.18);
    return mix(low, high, clamp(t, 0.0, 1.0));
  }

  // 4th axis tint: manufacturer breadth -> violet/magenta hue, spans the
  // WHOLE terrain (not just the data band), independent of height/count
  vec3 breadthTint(float t) {
    vec3 low  = vec3(0.08, 0.10, 0.22); // narrow portfolio -> deep indigo
    vec3 high = vec3(0.62, 0.20, 0.55); // broad portfolio -> magenta
    return mix(low, high, clamp(t, 0.0, 1.0));
  }

  void main() {
    float hNorm = clamp(vHeight / ${MAX_HEIGHT.toFixed(1)}, 0.0, 1.0);
    vec3 base = rockTone(hNorm);

    // layer 1: real model-count tint, confined to the data band (vValue > 0 there)
    vec3 t1 = dataTint(vValue);
    base = mix(base, t1, 0.4 * vValue);

    // layer 2: real manufacturer-breadth tint, washes across the ENTIRE
    // terrain at low opacity so it reads as an atmospheric/ambient signal
    vec3 t2 = breadthTint(vBreadth);
    base = mix(base, t2, 0.22);

    vec3 n = normalize(vNormalW);
    float warmDiffuse = max(dot(n, normalize(uLightDirWarm)), 0.0);
    float coolDiffuse = max(dot(n, normalize(uLightDirCool)), 0.0);

    vec3 warmLight = vec3(1.0, 0.62, 0.35) * warmDiffuse * 0.8;
    vec3 coolLight = vec3(0.45, 0.75, 0.85) * coolDiffuse * 0.55;

    vec3 ambient = base * 0.26;
    vec3 lit = ambient + base * (warmLight + coolLight);

    gl_FragColor = vec4(lit, 1.0);
  }
`;

function Terrain({ grid, breadth }: { grid: ModelCountGrid; breadth: number[] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hoverInfo, setHoverInfo] = useState<{ label: string; pos: [number, number, number] } | null>(null);

  const rows = VEHICLE_TYPES.length;
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

      const [wx, wz] = warp(x * 0.14, z * 0.14);
      const baseRidge = ridgedFbm(wx, wz, 5);
      const baseDetail = fbm(x * 0.9, z * 0.9, 3) - 0.5;
      let h = baseRidge * MAX_HEIGHT * 0.7 + baseDetail * 0.6;

      const edgeFadeX = 1 - Math.pow(Math.abs(x) / (WORLD_W / 2), 4);
      const edgeFadeZ = 1 - Math.pow(Math.abs(z) / (WORLD_D / 2), 4);
      h *= Math.max(edgeFadeX, 0) * Math.max(edgeFadeZ, 0);

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

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const p = e.point;
    const bandHalf = DATA_BAND_D / 2;
    if (p.z < -bandHalf || p.z > bandHalf) {
      setHoverInfo(null);
      return;
    }
    const u = (p.x + WORLD_W / 2) / WORLD_W;
    const v = (p.z + bandHalf) / DATA_BAND_D;
    if (u < 0 || u > 1 || v < 0 || v > 1) return;
    const makeIdx = Math.round(u * (cols - 1));
    const typeIdx = Math.round(v * (rows - 1));
    const count = grid[typeIdx]?.[makeIdx] ?? 0;
    const b = breadth[makeIdx] ?? 0;
    setHoverInfo({
      label: `${MAKES[makeIdx]} · ${VEHICLE_TYPE_LABELS[typeIdx]} — ${count} model${count === 1 ? "" : "s"} on file · ${b} vehicle categories overall`,
      pos: [p.x, p.y + 0.7, p.z],
    });
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={terrainMaterial}
        onPointerMove={handleMove}
        onPointerOut={() => setHoverInfo(null)}
        receiveShadow
        castShadow
      />

      {/* -------- grid overlay on the data band floor -------- */}
      <gridHelper
        args={[Math.max(WORLD_W, DATA_BAND_D), cols, "#3a4a52", "#233038"]}
        position={[0, 0.03, 0]}
        scale={[1, 1,  DATA_BAND_D / Math.max(WORLD_W, DATA_BAND_D)]}
      />

      {/* -------- axis labels, enlarged -------- */}
      {MAKES.map((make, i) => (
        <group key={make}>
          <Text
            position={[(i / (cols - 1)) * WORLD_W - WORLD_W / 2, 0.06, DATA_BAND_D / 2 + 1.3]}
            fontSize={0.5}
            color="#e5e7eb"
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
            outlineWidth={0.008}
            outlineColor="#000000"
          >
            {make}
          </Text>
          {/* tick mark */}
          <mesh
            position={[(i / (cols - 1)) * WORLD_W - WORLD_W / 2, 0.04, DATA_BAND_D / 2 + 0.55]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.04, 0.5]} />
            <meshBasicMaterial color="#5fb0c9" />
          </mesh>
        </group>
      ))}

      {VEHICLE_TYPE_LABELS.map((label, i) => (
        <group key={label}>
          <Text
            position={[-WORLD_W / 2 - 1.6, 0.06, (i / (rows - 1)) * DATA_BAND_D - DATA_BAND_D / 2]}
            fontSize={0.48}
            color="#e5e7eb"
            anchorX="right"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
            outlineWidth={0.008}
            outlineColor="#000000"
          >
            {label}
          </Text>
          <mesh
            position={[-WORLD_W / 2 - 0.55, 0.04, (i / (rows - 1)) * DATA_BAND_D - DATA_BAND_D / 2]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.5, 0.04]} />
            <meshBasicMaterial color="#5fb0c9" />
          </mesh>
        </group>
      ))}

      {/* -------- 4th axis label -------- */}
      <Text
        position={[0, 0.06, -WORLD_D / 2 + 1.6]}
        fontSize={0.55}
        color="#d9a8e0"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        color wash = manufacturer category breadth
      </Text>

      {hoverInfo && (
        <Text
          position={hoverInfo.pos}
          fontSize={0.44}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.018}
          outlineColor="#000000"
        >
          {hoverInfo.label}
        </Text>
      )}
    </group>
  );
}

function GroundPlane() {
  return (
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[WORLD_W + 30, WORLD_D + 30]} />
      <meshStandardMaterial color="#050506" roughness={1} />
    </mesh>
  );
}

export default function SalesMountainChart() {
  const [grid, setGrid] = useState<ModelCountGrid | null>(null);
  const [breadth, setBreadth] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

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

  const ready = grid && breadth;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: "radial-gradient(120% 100% at 25% 15%, #1a2a33 0%, #0d1013 45%, #050506 100%)",
      }}
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
        <Canvas shadows camera={{ position: [22, 13, 20], fov: 42 }} gl={{ antialias: true }}>
          <fog attach="fog" args={["#0a0d10", 20, 55]} />

          <ambientLight intensity={0.16} />
          <directionalLight
            position={[-18, 20, 8]}
            intensity={1.0}
            color="#ffb37a"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-25}
            shadow-camera-right={25}
            shadow-camera-top={25}
            shadow-camera-bottom={-25}
          />
          <directionalLight position={[18, 14, -8]} intensity={0.55} color="#5fb0c9" />

          <GroundPlane />
          <Terrain grid={grid} breadth={breadth} />

          <OrbitControls
            enablePan={false}
            minDistance={12}
            maxDistance={42}
            minPolarAngle={Math.PI / 7}
            maxPolarAngle={Math.PI / 2.15}
            autoRotate={autoRotate}
            autoRotateSpeed={0.45}
            target={[0, 1.5, 0]}
          />

          <EffectComposer>
            <Bloom intensity={0.15} luminanceThreshold={0.65} luminanceSmoothing={0.25} mipmapBlur />
            <Vignette eskil={false} offset={0.2} darkness={0.65} />
          </EffectComposer>
        </Canvas>
      )}

      <div className="pointer-events-none absolute bottom-3 left-4 text-xs text-zinc-500">
        drag to rotate · scroll to zoom · height/teal-ember = models on file · indigo-magenta wash = category breadth
      </div>
    </div>
  );
}