"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Stage,
  useGLTF,
  MeshReflectorMaterial,
} from "@react-three/drei";

function CarModel({ url }: { url?: string }) {
  if (!url) {
    return null;
  }

  const { scene } = useGLTF(url);

  return <primitive object={scene} />;
}

// useGLTF.preload("/models/bmw_7-series_m_short.glb");

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshBasicMaterial color="#d4d4d8" wireframe />
    </mesh>
  );
}

const FOG_COLOR = "#0a0a0a";

function ReflectiveGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.3, 0]}>
    <planeGeometry args={[100, 100]} />
    <MeshReflectorMaterial
      blur={[400, 100]}          // softens the reflection (x, y blur)
      resolution={1024}          // reflection texture resolution
      mixBlur={1}
      mixStrength={40}           // reflection intensity
      roughness={1}
      depthScale={1.2}
      minDepthThreshold={0.4}
      maxDepthThreshold={1.4}
      color="#0a0a0a"            // base floor color (dark, so reflection reads)
      metalness={0.6}
      mirror={0.5}               // 0 = no mirror, 1 = full mirror
    />
  </mesh>
  );
}


export default function CarModelViewer({
  modelUrl = " "
}: {
  modelUrl?: string;
}) {
  return (
    <div className="fixed inset-0 w-screen h-screen bg-linear-to-b from-[#0a0a0a]  to-[#0a0a0a]">
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
          <Stage environment="city" intensity={0.5} shadows={false} adjustCamera={1.2}>
            <CarModel url={modelUrl} />
          </Stage>
          <ReflectiveGround />
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