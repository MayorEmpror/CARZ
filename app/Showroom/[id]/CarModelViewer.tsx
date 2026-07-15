"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Stage,
  useGLTF,
  MeshReflectorMaterial,
} from "@react-three/drei";

// Every model gets scaled so its largest bounding-box dimension
// equals this value (world units), then sits on y = 0.
const TARGET_SIZE = 40;

// Tiny gap between the model's true bottom and the reflective plane,
// so they don't z-fight but still read as "touching".
const GROUND_EPSILON = TARGET_SIZE * 0.004;

function CarModel({
  url,
  onGroundLevel,
}: {
  url?: string;
  onGroundLevel: (y: number) => void;
}) {
  const { scene } = useGLTF(url ?? "");

  const normalized = useMemo(() => {
    if (!url) return null;

    // Clone so we don't mutate the cached scene graph that useGLTF
    // reuses across renders / other instances of the same url.
    const cloned = scene.clone(true);

    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = TARGET_SIZE / maxDim;

    const center = new THREE.Vector3();
    box.getCenter(center);

    cloned.scale.setScalar(scale);
    cloned.position.set(
      -center.x * scale,
      -box.min.y * scale, // rest on the ground plane, don't vertically center
      -center.z * scale
    );

    return cloned;
  }, [scene, url]);

  // Report the model's true world-space bottom back up to the parent,
  // so the ground plane can position itself relative to it instead of
  // assuming it's always exactly 0.
  useEffect(() => {
    if (!normalized) return;

    const worldBox = new THREE.Box3().setFromObject(normalized);
    onGroundLevel(worldBox.min.y);
  }, [normalized, onGroundLevel]);

  if (!normalized) return null;

  return <primitive object={normalized} />;
}

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshBasicMaterial color="#d4d4d8" wireframe />
    </mesh>
  );
}

const FOG_COLOR = "#0a0a0a";

function ReflectiveGround({ y }: { y: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <planeGeometry args={[100, 100]} />
      <MeshReflectorMaterial
        blur={[400, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={40}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0a0a0a"
        metalness={0.6}
        mirror={0.5}
      />
    </mesh>
  );
}

export default function CarModelViewer({
  modelUrl = " ",
}: {
  modelUrl?: string;
}) {
  // Default to a sane fallback ground level before the first model
  // reports in, so nothing pops or clips on initial load.
  const [groundY, setGroundY] = useState(-GROUND_EPSILON);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-linear-to-b from-[#0a0a0a] to-[#0a0a0a]">
      <Canvas
        shadows
        camera={{ position: [4, 1.5, 5], fov: 40 }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <fog attach="fog" args={[FOG_COLOR, 30, 90]} />
        <ambientLight intensity={0.9} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={30}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <spotLight
          position={[-6, 5, -4]}
          angle={0.4}
          penumbra={0.6}
          intensity={0.5}
          color="#ffffff"
        />

        <Suspense fallback={<Loader />}>
          {/* adjustCamera off: with fixed model scale, we don't want
              Stage re-fitting the camera per-model on top of that */}
          <Stage environment="city" intensity={0.5} shadows={false} adjustCamera={false}>
            <CarModel
              url={modelUrl}
              onGroundLevel={(y) => setGroundY(y - GROUND_EPSILON)}
            />
          </Stage>
          <ReflectiveGround y={groundY} />
          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          maxDistance={50}
          minDistance={50}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate
          autoRotateSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}