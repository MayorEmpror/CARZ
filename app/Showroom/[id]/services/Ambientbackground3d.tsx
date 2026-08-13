'use client';

/**
 * Fixed, full-viewport, pointer-events-none ambient particle field sitting
 * behind the whole dashboard. Purely decorative — no data, no interaction.
 * Depends on the same three / @react-three/fiber / @react-three/drei
 * install as CarShowcase3D.tsx.
 */

import { Canvas } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';

export default function AmbientBackground3D() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} gl={{ alpha: true }} dpr={[1, 1.5]}>
        <Sparkles count={110} scale={[22, 13, 10]} size={1.6} speed={0.15} color="#6C5CE7" opacity={0.22} />
        <Sparkles count={55} scale={[22, 13, 10]} size={1} speed={0.08} color="#8C7CFF" opacity={0.14} />
      </Canvas>
    </div>
  );
}