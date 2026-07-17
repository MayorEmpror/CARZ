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

const TARGET_SIZE = 40;
const GROUND_EPSILON = TARGET_SIZE * 0.004;
const CAMERA_DISTANCE = 50;

// In renderer mode the car is scaled down relative to the viewer's
// TARGET_SIZE, so it sits comfortably inside frame at the fixed
// 50-unit camera distance instead of filling/overflowing the shot.
const RENDERER_SCALE_FACTOR = 0.6;

type Angle = "front" | "rear" | "left" | "right" | "three-quarter";

const ANGLE_DIRECTIONS: Record<Angle, [number, number, number]> = {
  front: [0, 1.2, 6],
  rear: [0, 1.2, -6],
  left: [-6, 1.2, 0],
  right: [6, 1.2, 0],
  "three-quarter": [4, 1.5, 5], // same as the default viewer camera position
};

function getCameraPosition(angle: Angle): [number, number, number] {
  const [x, y, z] = ANGLE_DIRECTIONS[angle];
  const length = Math.sqrt(x * x + y * y + z * z) || 1;
  const scale = CAMERA_DISTANCE / length;
  return [x * scale, y * scale, z * scale];
}

interface CarModelViewerProps {
  modelUrl: string;
  mode?: "viewer" | "renderer";
  angle?: Angle;
  onReady?: () => void;
}

function CarModel({
  url,
  targetSize,
  onGroundLevel,
}: {
  url?: string;
  targetSize: number;
  onGroundLevel: (y: number) => void;
}) {
  const { scene } = useGLTF(url ?? "");

  const normalized = useMemo(() => {
    if (!url) return null;
    const cloned = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = targetSize / maxDim;
    const center = new THREE.Vector3();
    box.getCenter(center);
    cloned.scale.setScalar(scale);
    cloned.position.set(
      -center.x * scale,
      -box.min.y * scale,
      -center.z * scale,
    );
    return cloned;
  }, [scene, url, targetSize]);

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

// Original fixed lighting rig — used for both viewer and renderer modes,
// completely unchanged from the very first version.
function SceneLighting() {
  return (
    <>
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
    </>
  );
}

export default function CarModelViewer({
  modelUrl = " ",
  mode = "viewer",
  angle = "three-quarter",
  onReady,
}: CarModelViewerProps) {
  const [groundY, setGroundY] = useState(-GROUND_EPSILON);
  const [modelLoaded, setModelLoaded] = useState(false);

  const targetSize =
    mode === "renderer" ? TARGET_SIZE * RENDERER_SCALE_FACTOR : TARGET_SIZE;

  // Wait for real rendered frames (not just a fixed timer) before
  // signaling ready, so reflections/shadows/env map have actually
  // been drawn before Puppeteer screenshots the canvas.
  useEffect(() => {
    if (!modelLoaded || mode !== "renderer") return;

    let frames = 0;
    let raf: number;

    const tick = () => {
      frames++;
      if (frames > 30) {
        onReady?.();
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [modelLoaded, mode, onReady]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-linear-to-b from-[#0a0a0a] to-[#0a0a0a]">
      <Canvas
        id="car-canvas"
        shadows
        camera={{ position: getCameraPosition(angle), fov: 40 }}
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <fog attach="fog" args={[FOG_COLOR, 30, 90]} />

        <SceneLighting />

        <Suspense fallback={<Loader />}>
          <Stage
            environment="city"
            intensity={0.5}
            shadows={false}
            adjustCamera={false}
          >
            <CarModel
              url={modelUrl}
              targetSize={targetSize}
              onGroundLevel={(y) => {
                setGroundY(y - GROUND_EPSILON);
                setModelLoaded(true);
              }}
            />
          </Stage>
          <ReflectiveGround y={groundY} />
          <Environment preset="city" />
        </Suspense>

        {mode === "viewer" && (
          <OrbitControls
            maxDistance={50}
            minDistance={50}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2.1}
            autoRotate
            autoRotateSpeed={0.8}
          />
        )}
      </Canvas>
    </div>
  );
}