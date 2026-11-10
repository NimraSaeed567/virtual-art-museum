import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing'
import Gallery from './Gallery'
import Player from './Player'
import UI from './UI'
import MembershipGate from './MembershipGate'
import { useStore } from '../store'

/** Image-based lighting: soft studio reflections on every material. */
function Env() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.35
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

export default function Museum3D() {
  // Adaptive resolution: drop render scale on weak GPUs, raise it on strong ones.
  const [dpr, setDpr] = useState(1.25)
  const membership = useStore((s) => s.membership)

  // The heavy WebGL canvas waits for a membership choice — same "defer the
  // expensive thing" philosophy as waiting for "Enter the Museum" itself.
  if (!membership) {
    return (
      <div className="app">
        <MembershipGate />
      </div>
    )
  }

  const gold = membership === 'gold'
  const bg = gold ? '#160d08' : '#0b0b0e'

  return (
    <div className="app">
      <Canvas
        camera={{ position: [0, 1.6, 5], fov: 70, near: 0.1, far: 80 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        dpr={dpr}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = gold ? 1.2 : 1.1
        }}
      >
        <color attach="background" args={[bg]} />
        <fog attach="fog" args={[bg, 14, 55]} />
        <Env />
        <PerformanceMonitor
          onIncline={() => setDpr(1.5)}
          onDecline={() => setDpr(1)}
          flipflops={3}
          onFallback={() => setDpr(0.9)}
        />
        <Suspense fallback={null}>
          <Gallery membership={membership} />
          <EffectComposer multisampling={0}>
            <Bloom luminanceThreshold={gold ? 0.75 : 1} intensity={gold ? 0.85 : 0.5} mipmapBlur />
            <SMAA />
          </EffectComposer>
        </Suspense>
        <Player />
      </Canvas>
      <UI />
    </div>
  )
}
