"use client";

import { useState, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  QuadraticBezierLine,
  MeshDistortMaterial,
  useGLTF,
  Stage,
} from "@react-three/drei";
import * as THREE from "three";
import { CarDetails } from "@/lib/types";

type Props = {
  user_id: number;
  carswithperf: CarDetails[];
};

// ---------- Central glowing node ----------
function CentralNode({ count }: { count: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.15;
  });
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[0.9, 64, 64]} />
        <MeshDistortMaterial
          color="#8b5cf6"
          emissive="#6d28d9"
          emissiveIntensity={0.6}
          distort={0.35}
          speed={2}
          roughness={0.2}
        />
      </mesh>
      <pointLight color="#8b5cf6" intensity={2} distance={6} />
      <Html position={[0, -1.4, 0]} center distanceFactor={10}>
        <div className="px-3 py-1 rounded-md bg-black/60 border border-purple-500/40 text-white text-xs whitespace-nowrap">
          {count} Cars in Fleet
        </div>
      </Html>
    </group>
  );
}

// ---------- One car endpoint ----------
function CarNode({
  car,
  position,
  selected,
  onSelect,
}: {
  car: CarDetails;
  position: [number, number, number];
  selected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = selected ? "#22c55e" : hovered ? "#f0876b" : "#7c7cf0";

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 1 : 0.4}
        />
      </mesh>
      <Html position={[0.4, 0, 0]} distanceFactor={10} occlude>
        <div
          onClick={onSelect}
          className={`cursor-pointer px-2 py-1 rounded-md border text-xs whitespace-nowrap transition-colors
            ${
              selected
                ? "bg-green-500/20 border-green-400 text-green-200"
                : hovered
                ? "bg-orange-500/20 border-orange-400 text-orange-200"
                : "bg-black/60 border-[#7c7cf0]/40 text-white"
            }`}
        >
          {car.make} {car.model}
          <span className="ml-2 text-[10px] opacity-60">
            {car.top_speed} km/h
          </span>
        </div>
      </Html>
    </group>
  );
}

// ---------- Curved connector line ----------
function Connector({
  end,
  active,
}: {
  end: [number, number, number];
  active: boolean;
}) {
  const mid: [number, number, number] = [end[0] * 0.55, end[1] * 0.15, 0];
  return (
    <QuadraticBezierLine
      start={[0, 0, 0]}
      end={end}
      mid={mid}
      color={active ? "#f0876b" : "#3a3a4a"}
      lineWidth={active ? 2 : 1}
      transparent
      opacity={active ? 1 : 0.5}
    />
  );
}

// ---------- Optional 3D preview of selected car's glb ----------
function CarModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1.2} />;
}



// ---------- Side performance panel ----------
function PerformancePanel({ car }: { car: CarDetails | null }) {
  if (!car) {
    return (
      <div className="w-[340px] shrink-0 rounded-2xl bg-[#141416]/90 border border-white/10 p-6 text-white/50 text-sm">
        Select a car node to view performance details.
      </div>
    );
  }

  const stat = (label: string, value: string | number) => (
    <div className="flex flex-col bg-black/30 rounded-lg p-3">
      <span className="text-[11px] text-white/40">{label}</span>
      <span className="text-lg font-semibold text-white">{value}</span>
    </div>
  );

  return (
    <div className="w-[340px] shrink-0 rounded-2xl bg-[#141416]/90 border border-white/10 p-5 text-white space-y-4">
      <div className="flex items-center gap-3">
        <img
          src={car.image_url}
          alt={car.model}
          className="w-16 h-16 rounded-lg object-cover border border-white/10"
        />
        <div>
          <div className="text-xl font-bold leading-tight">
            {car.make} {car.model}
          </div>
          <div className="text-xs text-white/40">
            {car.year} · {car.body_type}
          </div>
        </div>
        <span className="ml-auto px-2 py-1 rounded-full text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 capitalize">
          {car.status}
        </span>
      </div>

  

      <div className="grid grid-cols-2 gap-3">
        {stat("Top Speed", `${car.top_speed} km/h`)}
        {stat("0-100 km/h", `${car.acceleration_0_100}s`)}
        {stat("Torque", `${car.torque} Nm`)}
        {stat("Engine Power", `${car.engine_power} hp`)}
        {stat("Fuel Type", car.fuel_type)}
        {stat("Fuel Efficiency", `${car.fuel_efficiency} L/100km`)}
        {stat("Transmission", car.transmission)}
        {stat("Mileage", `${car.mileage} km`)}
      </div>

      <div className="flex items-center justify-between bg-[#7C7CF0]/10 border border-[#7C7CF0]/30 rounded-lg p-3">
        <div>
          <div className="text-[11px] text-white/40">Price</div>
          <div className="text-lg font-bold text-[#7C7CF0]">
            ${Number(car.price).toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-white/40">Rating</div>
          <div className="text-lg font-bold text-[#F0876B]">
            {car.rating} ★{" "}
            <span className="text-xs text-white/30">
              ({car.rating_count})
            </span>
          </div>
        </div>
      </div>

      {/* <div className="text-xs text-white/30">
        Owner: {car.} · {car.phone}
      </div> */}
    </div>
  );
}

// ---------- Scene ----------
function Scene({
  cars,
  selectedId,
  setSelectedId,
}: {
  cars: CarDetails[];
  selectedId: number | null;
  setSelectedId: (id: number) => void;
}) {
  const positions = useMemo(() => {
    const spacingY = 1.0;
    const radiusX = 6;
    const total = cars.length;
    return cars.map((_, i) => {
      const y = (i - (total - 1) / 2) * spacingY;
      const x = radiusX;
      return [x, y, 0] as [number, number, number];
    });
  }, [cars]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <CentralNode count={cars.length} />
      {cars.map((car, i) => (
        <Connector
          key={car.car_id}
          end={positions[i]}
          active={selectedId === car.car_id}
        />
      ))}
      {cars.map((car, i) => (
        <CarNode
          key={car.car_id}
          car={car}
          position={positions[i]}
          selected={selectedId === car.car_id}
          onSelect={() => setSelectedId(car.car_id)}
        />
      ))}
    </>
  );
}

// ---------- Main export ----------
export default function ManageCars({ user_id, carswithperf }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(
    carswithperf[0]?.car_id ?? null
  );

  const selectedCar =
    carswithperf.find((c) => c.car_id === selectedId) ?? null;

  return (
    <div className="w-full h-full bg-[#0b0b0d] rounded-2xl border border-white/10 flex overflow-hidden">
      <div className="flex-1 relative">
        <Canvas camera={{ position: [0, 0, 30], fov: 45 }}>
          <color attach="background" args={["#0b0b0d"]} />
          <Scene
            cars={carswithperf}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
        
        </Canvas>
      </div>
      <div className="p-4">
        <PerformancePanel car={selectedCar} />
      </div>
    </div>
  );
}