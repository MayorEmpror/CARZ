"use client";
import { useMemo, useRef, useState } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { Sales } from "@/lib/types";
import { getMonthStatusGrid, MonthStatusCell } from "./Salesaggregations";

type Props = {
  sales: Sales[];
};

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const WORLD_W = 20;
const WORLD_D = 10;
const MAX_HEIGHT = 6;
const RES_X = 180;
const RES_Z = 110;

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
function fbm(x: number, y: number, octaves = 4) {
  let total = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    total += valueNoise(x * freq, y * freq) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return total / max;
}

// ---------- grid helpers ----------
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

/** Blurs a grid so hard drop-to-zero regions taper into rolling slopes
 *  instead of cliffs — real terrain never has a literal wall. */
function smoothGrid(grid: number[][], passes = 3): number[][] {
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

// ---------- shader ----------
const terrainVertexShader = /* glsl */ `
  attribute float aValue; // normalized avg-price, independent of height
  varying float vHeight;
  varying float vValue;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  void main() {
    vHeight = position.y;
    vValue = aValue;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * worldPos;
  }
`;

const terrainFragmentShader = /* glsl */ `
  uniform vec3 uLightDirWarm;
  uniform vec3 uLightDirCool;
  uniform float uWorldExtentX;
  uniform float uMaxHeight;
  varying float vHeight;
  varying float vValue;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;

  // rock base tone by elevation: dark scree -> grey rock -> pale snow cap
  vec3 rockTone(float h) {
    vec3 scree = vec3(0.10, 0.09, 0.09);
    vec3 rock  = vec3(0.32, 0.29, 0.27);
    vec3 alpine= vec3(0.55, 0.52, 0.48);
    vec3 snow  = vec3(0.92, 0.90, 0.86);
    if (h < 0.35) return mix(scree, rock, h / 0.35);
    if (h < 0.75) return mix(rock, alpine, (h - 0.35) / 0.4);
    return mix(alpine, snow, (h - 0.75) / 0.25);
  }

  // data-driven tint: low avg price -> cool teal, high -> warm ember
  vec3 dataTint(float t) {
    vec3 low  = vec3(0.10, 0.28, 0.34);
    vec3 high = vec3(0.85, 0.42, 0.18);
    return mix(low, high, clamp(t, 0.0, 1.0));
  }

  void main() {
    float hNorm = clamp(vHeight / uMaxHeight, 0.0, 1.0);
    vec3 base = rockTone(hNorm);

    // position-based warm/cool wash across X, like light raking across two flanks
    float side = clamp((vWorldPos.x / uWorldExtentX) + 0.5, 0.0, 1.0);
    vec3 tint = dataTint(vValue);
    base = mix(base, mix(base, tint, 0.55), 0.6);

    vec3 n = normalize(vNormalW);
    float warmDiffuse = max(dot(n, normalize(uLightDirWarm)), 0.0);
    float coolDiffuse = max(dot(n, normalize(uLightDirCool)), 0.0);

    vec3 warmLight = vec3(1.0, 0.62, 0.35) * warmDiffuse * (1.0 - side * 0.4);
    vec3 coolLight = vec3(0.45, 0.75, 0.85) * coolDiffuse * (0.4 + side * 0.6);

    vec3 ambient = base * 0.28;
    vec3 lit = ambient + base * (warmLight * 0.75 + coolLight * 0.6);

    // rim highlight only right at true peaks, subtle
    float peakGlow = smoothstep(0.88, 1.0, hNorm);
    lit += vec3(1.0, 0.85, 0.65) * peakGlow * 0.15;

    gl_FragColor = vec4(lit, 1.0);
  }
`;

function Terrain({
  statuses,
  grid,
}: {
  statuses: string[];
  grid: MonthStatusCell[][];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hoverInfo, setHoverInfo] = useState<{ label: string; pos: [number, number, number] } | null>(null);

  const rows = statuses.length || 1;
  const cols = 12;

  const { maxCount, maxPrice, countGrid, priceGrid } = useMemo(() => {
    const rawCount: number[][] = grid.map((row) => row.map((c) => c.count));
    const rawPrice: number[][] = grid.map((row) => row.map((c) => c.avgPrice));

    const smoothedCount = smoothGrid(rawCount, 3);
    const smoothedPrice = smoothGrid(rawPrice, 2);

    let maxC = 0, maxP = 0;
    for (const row of smoothedCount) for (const v of row) maxC = Math.max(maxC, v);
    for (const row of smoothedPrice) for (const v of row) maxP = Math.max(maxP, v);

    return {
      maxCount: maxC || 1,
      maxPrice: maxP || 1,
      countGrid: smoothedCount,
      priceGrid: smoothedPrice,
    };
  }, [grid]);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WORLD_W, WORLD_D, RES_X, RES_Z);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const aValue = new Float32Array(pos.count);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const u = (x + WORLD_W / 2) / WORLD_W;
      const v = (z + WORLD_D / 2) / WORLD_D;

      const countVal = sampleGrid(countGrid, u, v, cols, rows) / maxCount;
      const priceVal = sampleGrid(priceGrid, u, v, cols, rows) / maxPrice;

      const shaped = Math.pow(Math.max(countVal, 0), 1.3);

      // layered noise: broad ridges + fine rock detail
      const ridge = fbm(u * 8, v * 5, 4) - 0.5;
      const fine = fbm(u * 45, v * 28, 3) - 0.5;
      const noiseAmt = ridge * 0.55 * (0.3 + shaped) + fine * 0.14 * (0.4 + shaped);

      const h = Math.max(shaped * MAX_HEIGHT + noiseAmt, 0.03);
      pos.setY(i, h);
      aValue[i] = priceVal;
    }

    geo.setAttribute("aValue", new THREE.BufferAttribute(aValue, 1));
    geo.computeVertexNormals();
    return geo;
  }, [countGrid, priceGrid, maxCount, maxPrice, rows]);

  const terrainMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uLightDirWarm: { value: new THREE.Vector3(-1, 1, 0.4).normalize() },
        uLightDirCool: { value: new THREE.Vector3(1, 0.8, -0.3).normalize() },
        uWorldExtentX: { value: WORLD_W },
        uMaxHeight: { value: MAX_HEIGHT },
      },
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
    });
  }, []);

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (rows < 1) return;
    const p = e.point;
    const u = (p.x + WORLD_W / 2) / WORLD_W;
    const v = (p.z + WORLD_D / 2) / WORLD_D;
    if (u < 0 || u > 1 || v < 0 || v > 1) return;
    const month = Math.round(u * 11);
    const statusIdx = Math.round(v * (rows - 1));
    const cell = grid[statusIdx]?.[month];
    if (!cell) return;
    setHoverInfo({
      label: `${statuses[statusIdx]} · ${MONTH_LABELS[month]} — ${cell.count} order${cell.count === 1 ? "" : "s"}, avg $${cell.avgPrice.toFixed(0)}`,
      pos: [p.x, p.y + 0.6, p.z],
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

      {MONTH_LABELS.map((label, i) => (
        <Text
          key={label}
          position={[(i / 11) * WORLD_W - WORLD_W / 2, 0.05, WORLD_D / 2 + 0.8]}
          fontSize={0.3}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {label}
        </Text>
      ))}

      {statuses.map((label, i) => (
        <Text
          key={label}
          position={[-WORLD_W / 2 - 0.8, 0.05, rows > 1 ? (i / (rows - 1)) * WORLD_D - WORLD_D / 2 : 0]}
          fontSize={0.3}
          color="#9ca3af"
          anchorX="right"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {label}
        </Text>
      ))}

      {hoverInfo && (
        <Text
          position={hoverInfo.pos}
          fontSize={0.38}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.015}
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
    <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[WORLD_W + 10, WORLD_D + 16]} />
      <meshStandardMaterial color="#050506" roughness={1} />
    </mesh>
  );
}

export default function SalesMountainChart({ sales }: Props) {
  const [autoRotate, setAutoRotate] = useState(true);
  const { statuses, grid } = useMemo(() => getMonthStatusGrid(sales), [sales]);

  return (
  // change the wrapper div's className and drop the rounded corners/gradient since it's now edge-to-edge:
<div
  className="absolute inset-0 h-full w-full"
  style={{
    background: "radial-gradient(120% 100% at 25% 15%, #1a2a33 0%, #0d1013 45%, #050506 100%)",
  }}
  onPointerDown={() => setAutoRotate(false)}
>
      {process.env.NODE_ENV !== "production" && (
        <div className="pointer-events-none absolute top-2 right-2 z-10 rounded bg-black/60 px-2 py-1 text-[10px] text-zinc-400">
          {sales.length} records · {statuses.length} statuses
        </div>
      )}

      <Canvas shadows camera={{ position: [16, 9, 16], fov: 38 }} gl={{ antialias: true }}>
        <fog attach="fog" args={["#0a0d10", 14, 38]} />

        <ambientLight intensity={0.18} />
        <directionalLight
          position={[-12, 14, 6]}
          intensity={0.9}
          color="#ffb37a"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />
        <directionalLight position={[12, 10, -6]} intensity={0.5} color="#5fb0c9" />

        <GroundPlane />
        <Terrain statuses={statuses} grid={grid} />

        <OrbitControls
          enablePan={false}
          minDistance={10}
          maxDistance={28}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.15}
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
          target={[0, 1, 0]}
        />

        <EffectComposer>
          <Bloom intensity={0.15} luminanceThreshold={0.65} luminanceSmoothing={0.25} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.65} />
        </EffectComposer>
      </Canvas>

      <div className="pointer-events-none absolute bottom-3 left-4 text-xs text-zinc-500">
        drag to rotate · scroll to zoom · warm = high avg order value
      </div>
    </div>
  );
}