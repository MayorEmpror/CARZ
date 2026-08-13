'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SETUP
 * ─────────────────────────────────────────────────────────────────────────
 * npm install three @react-three/fiber @react-three/drei
 *
 * This is a pure procedural model (boxes/cylinders) — no .gltf asset needed,
 * so there's nothing to host or load. Swap <ProceduralCar /> for a
 * useGLTF() model later if you want a real fleet vehicle mesh.
 *
 * Imported with next/dynamic + ssr:false from services.tsx, since the
 * WebGL canvas touches `window`.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, ContactShadows } from '@react-three/drei';
import type { Group } from 'three';

const ACCENT = '#6C5CE7';
const ACCENT2 = '#8C7CFF';
const GOLD = '#F5B92E';

function ProceduralCar() {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.35;
  });

  const wheelPositions: [number, number][] = [
    [-0.82, 0.56],
    [0.82, 0.56],
    [-0.82, -0.56],
    [0.82, -0.56],
  ];

  return (
    <group ref={group}>
      {/* Lower body */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.46, 1.1]} />
        <meshStandardMaterial color={ACCENT} metalness={0.65} roughness={0.22} />
      </mesh>

      {/* Cabin / greenhouse */}
      <mesh position={[-0.08, 0.66, 0]} castShadow>
        <boxGeometry args={[1.25, 0.36, 0.98]} />
        <meshStandardMaterial color={ACCENT2} metalness={0.35} roughness={0.15} transparent opacity={0.82} />
      </mesh>

      {/* Nose taper */}
      <mesh position={[1.15, 0.3, 0]} castShadow>
        <boxGeometry args={[0.18, 0.42, 1.0]} />
        <meshStandardMaterial color={ACCENT} metalness={0.65} roughness={0.22} />
      </mesh>

      {/* Wheels */}
      {wheelPositions.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.01, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.22, 20]} />
          <meshStandardMaterial color="#0d0e16" metalness={0.3} roughness={0.75} />
        </mesh>
      ))}

      {/* Headlights */}
      {[0.48, -0.48].map((z, i) => (
        <mesh key={i} position={[1.22, 0.32, z]}>
          <boxGeometry args={[0.03, 0.12, 0.16]} />
          <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={1.5} />
        </mesh>
      ))}

      {/* Taillights */}
      {[0.48, -0.48].map((z, i) => (
        <mesh key={i} position={[-1.22, 0.32, z]}>
          <boxGeometry args={[0.03, 0.1, 0.14]} />
          <meshStandardMaterial color="#EB5C57" emissive="#EB5C57" emissiveIntensity={1.1} />
        </mesh>
      ))}
    </group>
  );
}

export default function CarShowcase3D() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [2.7, 1.5, 2.7], fov: 38 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 2]} intensity={1.3} castShadow />
      <pointLight position={[-3, 2, -2]} intensity={0.6} color={ACCENT2} />

      <Suspense fallback={null}>
        <Float speed={1.3} rotationIntensity={0.12} floatIntensity={0.45}>
          <ProceduralCar />
        </Float>
        <ContactShadows position={[0, -0.02, 0]} opacity={0.55} scale={6} blur={2.4} far={2} />
        <Sparkles count={35} scale={4} size={2} speed={0.3} color={ACCENT2} opacity={0.5} />
      </Suspense>
    </Canvas>
  );
}