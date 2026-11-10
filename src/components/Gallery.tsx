import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import type { Mesh, Points } from 'three'
import { ARTISTS, byArtist, exclusiveFor, getArt, getArtist, priceFor, type Artist, type Artwork as ArtworkT } from '../data/artworks'
import {
  BAY_LEN,
  CORRIDOR_HALF_W,
  FINALE_CENTER_Z,
  FINALE_COLUMN_OFFSET,
  FINALE_HALF,
  NICHE_DEPTH,
  NICHE_HALF_MOUTH,
  PROMENADE_BAYS,
  PROMENADE_CORRIDOR_END_Z,
  PROMENADE_ENTRANCE_Z,
  PROMENADE_SECTION_BREAKS,
  WALL_H,
  WAYPOINTS,
} from '../data/layout'
import {
  getArtTexture,
  makeBannerTexture,
  makeCollectorPlaqueTexture,
  makeFloorNormalTexture,
  makeFloorTexture,
  makeMapTexture,
  makeMarbleFloorTexture,
  makeMarbleNormalTexture,
  makePlaqueTexture,
  makePortraitTexture,
  makeShadowTexture,
  makeWashTexture,
  makeWeaveNormalTexture,
} from '../textures/proceduralArt'
import { registry } from './registry'
import { useStore, type Membership } from '../store'

const WALL_COLOR = '#e9e4da'
const TRIM_DARK = '#3a3025'
const TRIM_LIGHT = '#d6d0c2'
const GOLD = '#8f7434'
// hall paneling palette — deep museum green (General Admission)
const HALL_WALL = '#31473a'
const HALL_PANEL = '#3a5344'
const HALL_WAINSCOT = '#27362d'
// hall paneling palette — black marble + crimson velvet (Gold Membership)
const RICH_GOLD = '#d4af37'
const GOLD_VENEER = '#191410'
const GOLD_PANEL = '#4a0e14'
const GOLD_WAINSCOT = '#0e0b09'
const H = WALL_H

// ---------------------------------------------------------------------------

/** Wall with automatic baseboard + crown molding. */
/** Ceiling spotlight that casts real shadows straight down. */
function SpotDown({
  pos,
  intensity,
  angle = 1.15,
  distance = 26,
  color = '#fff2dd',
}: {
  pos: [number, number, number]
  intensity: number
  angle?: number
  distance?: number
  color?: string
}) {
  const target = useMemo(() => new THREE.Object3D(), [])
  return (
    <>
      <spotLight
        position={pos}
        intensity={intensity}
        distance={distance}
        angle={angle}
        penumbra={0.6}
        decay={1.8}
        color={color}
        target={target}
      />
      <primitive object={target} position={[pos[0], 0, pos[2]]} />
    </>
  )
}

function Wall({
  pos,
  size,
  trim = true,
  gold,
}: {
  pos: [number, number, number]
  size: [number, number, number]
  trim?: boolean
  gold?: boolean
}) {
  const yBottom = pos[1] - size[1] / 2
  const yTop = pos[1] + size[1] / 2
  return (
    <group>
      <mesh position={pos} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.95} />
      </mesh>
      {trim && (
        <>
          <mesh position={[pos[0], yBottom + 0.09, pos[2]]}>
            <boxGeometry args={[size[0] + 0.04, 0.18, size[2] + 0.06]} />
            <meshStandardMaterial color={gold ? RICH_GOLD : TRIM_DARK} roughness={0.6} metalness={gold ? 0.6 : 0} />
          </mesh>
          <mesh position={[pos[0], yTop - 0.1, pos[2]]}>
            <boxGeometry args={[size[0] + 0.04, 0.2, size[2] + 0.05]} />
            <meshStandardMaterial color={gold ? RICH_GOLD : TRIM_LIGHT} roughness={0.8} metalness={gold ? 0.6 : 0} />
          </mesh>
        </>
      )}
    </group>
  )
}

function Banner({
  pos,
  w,
  h,
  text,
  sub,
  light,
}: {
  pos: [number, number, number]
  w: number
  h: number
  text: string
  sub?: string
  light?: boolean
}) {
  const tex = makeBannerTexture(text, sub, light)
  return (
    <mesh position={pos}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

/** Rectangular molding outline made of four slats. */
function TrimFrame({
  w,
  h,
  t = 0.06,
  d = 0.05,
  color = GOLD,
}: {
  w: number
  h: number
  t?: number
  d?: number
  color?: string
}) {
  const mat = <meshStandardMaterial color={color} metalness={0.55} roughness={0.4} />
  return (
    <group>
      <mesh position={[0, h / 2 + t / 2, 0]}>
        <boxGeometry args={[w + 2 * t, t, d]} />
        {mat}
      </mesh>
      <mesh position={[0, -h / 2 - t / 2, 0]}>
        <boxGeometry args={[w + 2 * t, t, d]} />
        {mat}
      </mesh>
      <mesh position={[-w / 2 - t / 2, 0, 0]}>
        <boxGeometry args={[t, h, d]} />
        {mat}
      </mesh>
      <mesh position={[w / 2 + t / 2, 0, 0]}>
        <boxGeometry args={[t, h, d]} />
        {mat}
      </mesh>
    </group>
  )
}

/** Classical pilaster column framing hall doorways and corners. */
function Pilaster({ x }: { x: number }) {
  return (
    <group position={[x, 0, -10]}>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.36, H, 0.5]} />
        <meshStandardMaterial color={TRIM_LIGHT} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.48, 0.24, 0.6]} />
        <meshStandardMaterial color={TRIM_DARK} roughness={0.6} />
      </mesh>
      <mesh position={[0, H - 0.1, 0]}>
        <boxGeometry args={[0.48, 0.2, 0.6]} />
        <meshStandardMaterial color={TRIM_LIGHT} roughness={0.8} />
      </mesh>
    </group>
  )
}

/** Brass wall sconce with a warm uplight glow. */
function Sconce({ x }: { x: number }) {
  const wash = makeWashTexture()
  return (
    <group position={[x, 2.3, -9.85]}>
      <mesh position={[0, 1.0, 0.02]}>
        <planeGeometry args={[1.3, 2.0]} />
        <meshBasicMaterial map={wash} transparent opacity={0.85} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.14]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.12, 0.34, 12, 1, true]} />
        <meshStandardMaterial color="#5a4a2a" metalness={0.7} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.17, 0.14]}>
        <cylinderGeometry args={[0.115, 0.115, 0.02, 12]} />
        <meshBasicMaterial color={[1.9, 1.7, 1.25] as unknown as THREE.Color} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** One paneled hall-wall segment: veneer, wainscot, dado rail, raised panel.
 * `gold` swaps the palette to black marble + crimson velvet + rich gold trim
 * for the Gold membership hall; otherwise it's the deep museum-green finish. */
function HallPanelSegment({
  xc,
  panelX,
  panelW,
  sconces,
}: {
  xc: number
  panelX: number
  panelW: number
  sconces?: boolean
}) {
  const pl = panelW / 2
  const dadoW = 3.85 - pl
  return (
    <group>
      {/* veneer + wainscot tone */}
      <mesh position={[xc, H / 2, -9.842]}>
        <planeGeometry args={[8.3, H]} />
        <meshStandardMaterial color={HALL_WALL} roughness={0.95} />
      </mesh>
      <mesh position={[xc, 0.51, -9.838]}>
        <planeGeometry args={[8.3, 1.02]} />
        <meshStandardMaterial color={HALL_WAINSCOT} roughness={0.95} />
      </mesh>
      {/* dado rail pieces either side of the panel */}
      {dadoW > 0.3 && (
        <>
          <mesh position={[panelX - (3.85 + pl) / 2, 1.05, -9.83]}>
            <boxGeometry args={[dadoW, 0.09, 0.05]} />
            <meshStandardMaterial color={TRIM_LIGHT} roughness={0.8} />
          </mesh>
          <mesh position={[panelX + (3.85 + pl) / 2, 1.05, -9.83]}>
            <boxGeometry args={[dadoW, 0.09, 0.05]} />
            <meshStandardMaterial color={TRIM_LIGHT} roughness={0.8} />
          </mesh>
        </>
      )}
      {/* raised panel: lighter interior + gold molding */}
      <mesh position={[panelX, 2.5, -9.836]}>
        <planeGeometry args={[panelW - 0.12, 3.23]} />
        <meshStandardMaterial color={HALL_PANEL} roughness={0.95} />
      </mesh>
      <group position={[panelX, 2.5, -9.82]}>
        <TrimFrame w={panelW} h={3.35} />
      </group>
      {sconces && (
        <>
          <Sconce x={panelX - 2.85} />
          <Sconce x={panelX + 2.85} />
        </>
      )}
    </group>
  )
}

/** Row of gold-framed artist portrait medallions. */
function Medallions() {
  return (
    <group position={[6.1, 0, -9.78]}>
      <Banner pos={[0, 3.75, 0]} w={4.2} h={0.58} text="OUR ARTISTS" light />
      {ARTISTS.map((a, i) => {
        const x = (i - 2) * 1.38
        return (
          <group key={a.id} position={[x, 2.45, 0]}>
            <mesh>
              <torusGeometry args={[0.44, 0.04, 10, 32]} />
              <meshStandardMaterial color={GOLD} metalness={0.65} roughness={0.35} />
            </mesh>
            <mesh>
              <circleGeometry args={[0.42, 32]} />
              <meshBasicMaterial map={makePortraitTexture(a.id)} toneMapped={false} />
            </mesh>
            <Banner pos={[0, -0.68, 0]} w={1.32} h={0.24} text={a.name.toUpperCase()} light />
          </group>
        )
      })}
    </group>
  )
}

/** Gold-framed museum floor plan. */
function MapFrame() {
  return (
    <group position={[6.1, 2.5, -9.78]}>
      <mesh>
        <planeGeometry args={[2.5, 2.5]} />
        <meshBasicMaterial map={makeMapTexture()} toneMapped={false} />
      </mesh>
      <TrimFrame w={2.5} h={2.5} t={0.08} />
    </group>
  )
}

function ContactShadow({
  pos,
  size,
}: {
  pos: [number, number, number]
  size: [number, number]
}) {
  const tex = makeShadowTexture()
  return (
    <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} transparent opacity={0.55} depthWrite={false} />
    </mesh>
  )
}

// ---------------------------------------------------------------------------

function Artwork({
  art,
  position,
  rotY,
  exclusive,
}: {
  art: ArtworkT
  position: [number, number, number]
  rotY: number
  exclusive?: boolean
}) {
  const tex = getArtTexture(art)
  const wash = makeWashTexture()
  const [w, h] = art.dims
  const artist = getArtist(art.artistId)
  const hovered = useStore((s) => s.hoveredId === art.id)
  const collector = useStore((s) => s.collectors[art.id])
  const plaque = makePlaqueTexture(art.title, `${artist.name} · ${art.year}`, `Prints from $${priceFor(art, 'sm')}`)
  const collectorPlaque = collector ? makeCollectorPlaqueTexture(collector) : null
  const ribbon = exclusive ? makeBannerTexture('GOLD EXCLUSIVE', 'One of a kind — not sold elsewhere', true) : null
  const fixtureY = H - position[1] - 0.12 // local offset up to just below the ceiling

  useEffect(() => () => void registry.delete(art.id), [art.id])

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* warm spotlight wash on the wall */}
      <mesh position={[0, 0.25, 0.012]}>
        <planeGeometry args={[w + 1.9, h + 1.8]} />
        <meshBasicMaterial
          map={wash}
          color={exclusive ? ([1.3, 1.05, 0.6] as unknown as THREE.Color) : undefined}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* hover glow rim */}
      {hovered && (
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[w + 0.5, h + 0.5]} />
          <meshBasicMaterial color={[1.6, 1.25, 0.5] as unknown as THREE.Color} toneMapped={false} />
        </mesh>
      )}
      {/* frame + liner — exclusive pieces get a thicker, brighter gold treatment */}
      <mesh position={[0, 0, 0.045]} castShadow>
        <boxGeometry args={[w + (exclusive ? 0.42 : 0.34), h + (exclusive ? 0.42 : 0.34), 0.09]} />
        <meshStandardMaterial color={exclusive ? '#120d08' : '#241a12'} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[w + (exclusive ? 0.2 : 0.14), h + (exclusive ? 0.2 : 0.14), 0.1]} />
        <meshStandardMaterial color={exclusive ? RICH_GOLD : '#8f7434'} metalness={exclusive ? 0.9 : 0.65} roughness={exclusive ? 0.2 : 0.35} />
      </mesh>
      {exclusive && (
        <>
          {/* ribbon banner above the piece */}
          <mesh position={[0, h / 2 + 0.42, 0.03]}>
            <planeGeometry args={[Math.max(w + 0.5, 1.8), 0.34]} />
            <meshBasicMaterial map={ribbon!} transparent toneMapped={false} />
          </mesh>
          {/* dedicated warm spotlight glow for the museum's rarest piece */}
          <pointLight position={[0, 0.2, 0.9]} intensity={0.9} distance={5} color="#ffdca0" />
        </>
      )}
      {/* canvas — the clickable mesh; lit like a real painting, with weave */}
      <mesh
        position={[0, 0, 0.102]}
        ref={(m: Mesh | null) => {
          if (m) {
            m.userData.artId = art.id
            registry.set(art.id, m)
          }
        }}
      >
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          map={tex}
          normalMap={makeWeaveNormalTexture()}
          normalScale={new THREE.Vector2(0.35, 0.35)}
          roughness={0.85}
        />
      </mesh>
      {/* wall plaque */}
      <mesh position={[0, -h / 2 - 0.42, 0.03]}>
        <planeGeometry args={[1.15, 0.4]} />
        <meshBasicMaterial map={plaque} toneMapped={false} />
      </mesh>
      {/* collector credit — appears once someone's bought a print of this piece;
          sized to match the plaque above and sit right against it */}
      {collectorPlaque && (
        <mesh position={[0, -h / 2 - 0.8, 0.03]}>
          <planeGeometry args={[1.15, 0.32]} />
          <meshBasicMaterial map={collectorPlaque} toneMapped={false} />
        </mesh>
      )}
      {/* track-light fixture near the ceiling */}
      <group position={[0, fixtureY, 1.05]}>
        <mesh rotation={[-2.8, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.08, 0.3, 12]} />
          <meshStandardMaterial color="#1d1b22" roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.14, 0.02]}>
          <boxGeometry args={[0.06, 0.1, 0.06]} />
          <meshStandardMaterial color="#1d1b22" />
        </mesh>
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// One wing, built pointing north (-z); rotated into place for E/S/W.

function Wing({ angle, artist }: { angle: number; artist: Artist }) {
  const arts = byArtist(artist.id)
  return (
    <group rotation={[0, angle, 0]}>
      <Wall pos={[-5.15, H / 2, -17.15]} size={[0.3, H, 14.3]} />
      <Wall pos={[5.15, H / 2, -17.15]} size={[0.3, H, 14.3]} />
      <Wall pos={[0, H / 2, -24.15]} size={[10.6, H, 0.3]} />
      {/* artist name on the far wall */}
      <Banner pos={[0, 4.35, -23.98]} w={7.5} h={1.1} text={artist.name.toUpperCase()} sub={artist.tagline} />
      <SpotDown pos={[0, 4.55, -17]} intensity={52} />
      {/* ceiling light strip */}
      <mesh position={[0, 4.96, -17]}>
        <boxGeometry args={[0.35, 0.06, 11]} />
        <meshBasicMaterial color={[1.7, 1.6, 1.35] as unknown as THREE.Color} toneMapped={false} />
      </mesh>
      {/* ceiling coffer beams */}
      {[-13, -17, -21].map((z) => (
        <mesh key={z} position={[0, 4.87, z]}>
          <boxGeometry args={[10.3, 0.26, 0.22]} />
          <meshStandardMaterial color="#33313d" roughness={0.9} />
        </mesh>
      ))}
      {/* two artworks per side wall + centerpiece on the far wall */}
      {arts[0] && <Artwork art={arts[0]} position={[-5, 2.1, -13.5]} rotY={Math.PI / 2} />}
      {arts[1] && <Artwork art={arts[1]} position={[-5, 2.1, -19.5]} rotY={Math.PI / 2} />}
      {arts[2] && <Artwork art={arts[2]} position={[5, 2.1, -13.5]} rotY={-Math.PI / 2} />}
      {arts[3] && <Artwork art={arts[3]} position={[5, 2.1, -19.5]} rotY={-Math.PI / 2} />}
      {arts[4] && <Artwork art={arts[4]} position={[0, 2.2, -24]} rotY={0} />}
      {arts[5] && <Artwork art={arts[5]} position={[-3.2, 2.1, -24]} rotY={0} />}
    </group>
  )
}

// One hall wall (built as the north wall; rotated for the others).

function HallWall({
  angle,
  label,
  arts,
  banner,
  feature,
}: {
  angle: number
  label: string
  arts?: [ArtworkT | undefined, ArtworkT | undefined]
  banner?: { text: string; sub?: string }
  feature?: 'medallions' | 'map'
}) {
  return (
    <group rotation={[0, angle, 0]}>
      <Wall pos={[-6.15, H / 2, -10]} size={[8.3, H, 0.3]} />
      <Wall pos={[6.15, H / 2, -10]} size={[8.3, H, 0.3]} />
      {/* lintel above the doorway — its lower trim reads as a door header */}
      <Wall pos={[0, 4.1, -10]} size={[4, 1.8, 0.3]} />
      <Banner pos={[0, 4.15, -9.83]} w={3.7} h={0.65} text={label} />
      {/* paneling over both segments */}
      <HallPanelSegment xc={-6.15} panelX={-6.1} panelW={arts ? 3.6 : 7.6} sconces={!!arts} />
      <HallPanelSegment xc={6.15} panelX={6.1} panelW={arts ? 3.6 : 7.2} sconces={!!arts} />
      {/* pilasters at doorway edges and corners */}
      {[-9.95, -2.2, 2.2, 9.95].map((x) => (
        <Pilaster key={x} x={x} />
      ))}
      {arts?.[0] && <Artwork art={arts[0]} position={[-6.1, 2.5, -9.83]} rotY={0} />}
      {arts?.[1] && <Artwork art={arts[1]} position={[6.1, 2.5, -9.83]} rotY={0} />}
      {banner && <Banner pos={[-6.1, 2.6, -9.79]} w={7.2} h={1.05} text={banner.text} sub={banner.sub} light />}
      {feature === 'medallions' && <Medallions />}
      {feature === 'map' && <MapFrame />}
    </group>
  )
}

// ---------------------------------------------------------------------------

function Bench({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <ContactShadow pos={[0, 0.012, 0]} size={[3.2, 2.2]} />
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.12, 1.4]} />
        <meshStandardMaterial color="#4a3826" roughness={0.7} />
      </mesh>
      <mesh position={[-0.9, 0.18, 0]} castShadow>
        <boxGeometry args={[0.15, 0.36, 1.2]} />
        <meshStandardMaterial color="#382a1c" />
      </mesh>
      <mesh position={[0.9, 0.18, 0]} castShadow>
        <boxGeometry args={[0.15, 0.36, 1.2]} />
        <meshStandardMaterial color="#382a1c" />
      </mesh>
    </group>
  )
}

/** Slow-drifting dust motes in the hall — sells the skylight. */
function Dust() {
  const ref = useRef<Points>(null)
  const positions = useMemo(() => {
    const a = new Float32Array(280 * 3)
    for (let i = 0; i < 280; i++) {
      a[i * 3] = (Math.random() - 0.5) * 16
      a[i * 3 + 1] = 0.4 + Math.random() * 4.3
      a[i * 3 + 2] = (Math.random() - 0.5) * 16
    }
    return a
  }, [])
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.012
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.18) * 0.12
    }
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ffe9b0"
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

// ---------------------------------------------------------------------------
// General Admission — the hall as it's always been: wood floor, green
// paneling, plinth + sculpture, skylight overhead.

function NormalHallCore({
  aurora,
  marcus,
  sofia,
  david,
  hallArts,
}: {
  aurora: Artist
  marcus: Artist
  sofia: Artist
  david: Artist
  hallArts: ArtworkT[]
}) {
  const floor = makeFloorTexture()
  const floorNormal = makeFloorNormalTexture()
  return (
    <>
      {/* polished reflective wood floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[49, 49]} />
        <MeshReflectorMaterial
          map={floor}
          normalMap={floorNormal}
          normalScale={new THREE.Vector2(0.55, 0.55)}
          resolution={512}
          mirror={0.4}
          mixStrength={0.85}
          mixBlur={1}
          blur={[300, 100]}
          roughness={0.55}
          depthScale={0.6}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
        />
      </mesh>

      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[49, 49]} />
        <meshStandardMaterial color="#282631" roughness={1} />
      </mesh>
      {/* hall coffer beams */}
      {[-6.5, 6.5].map((v) => (
        <group key={v}>
          <mesh position={[v, 4.87, 0]}>
            <boxGeometry args={[0.3, 0.26, 20]} />
            <meshStandardMaterial color="#33313d" roughness={0.9} />
          </mesh>
          <mesh position={[0, 4.87, v]}>
            <boxGeometry args={[20, 0.26, 0.3]} />
            <meshStandardMaterial color="#33313d" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* skylight over the hall */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H - 0.02, 0]}>
        <planeGeometry args={[7.6, 7.6]} />
        <meshBasicMaterial color={[1.65, 1.55, 1.35] as unknown as THREE.Color} toneMapped={false} />
      </mesh>
      {[
        [0, -3.9, 8.4, 0.24],
        [0, 3.9, 8.4, 0.24],
        [-3.9, 0, 0.24, 8.4],
        [3.9, 0, 0.24, 8.4],
      ].map(([x, z, sx, sz], i) => (
        <mesh key={i} position={[x, H - 0.06, z]}>
          <boxGeometry args={[sx, 0.14, sz]} />
          <meshStandardMaterial color="#2c2a33" roughness={0.5} />
        </mesh>
      ))}

      {/* hall walls — labels face into the hall */}
      <HallWall angle={0} label={`GALLERY I — ${aurora.name.toUpperCase()}`} arts={[hallArts[0], hallArts[1]]} />
      <HallWall angle={Math.PI} label={`GALLERY III — ${sofia.name.toUpperCase()}`} arts={[hallArts[2], hallArts[3]]} />
      <HallWall
        angle={-Math.PI / 2}
        label={`GALLERY II — ${marcus.name.toUpperCase()}`}
        banner={{ text: 'THE LIVING ARTISTS MUSEUM', sub: 'Supporting working artists since 2026' }}
        feature="medallions"
      />
      <HallWall
        angle={Math.PI / 2}
        label={`GALLERY IV — ${david.name.toUpperCase()}`}
        banner={{ text: 'EVERY PRINT SUPPORTS AN ARTIST', sub: '50% of each sale goes directly to the artist' }}
        feature="map"
      />

      {/* central plinth + sculpture */}
      <ContactShadow pos={[0, 0.012, 0]} size={[2.6, 2.6]} />
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.65, 1, 24]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.55, 0]} rotation={[0.4, 0, 0.2]} castShadow>
        <torusKnotGeometry args={[0.32, 0.1, 128, 24]} />
        <meshStandardMaterial color="#c9a227" metalness={0.85} roughness={0.25} />
      </mesh>

      <Bench pos={[-7, 0, -7]} />
      <Bench pos={[7, 0, 7]} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Gold Membership — The Grand Salon: black-and-gold marble, crimson velvet,
// a crystal chandelier, a marble fountain, and four freestanding columns.
// Same footprint and doorways as the normal hall, so the wings and player
// movement code need no changes at all.

/** Tiered crystal chandelier — bulbs are bright unlit meshes (the post-
 * processing Bloom pass makes them glow) rather than real lights, so the
 * fixture stays purely decorative and cheap to render. */
function Chandelier({ pos = [0, H - 0.55, 0] as [number, number, number] }) {
  const bulb = [2.4, 2.0, 1.3] as unknown as THREE.Color
  return (
    <group position={pos}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.1, 8]} />
        <meshStandardMaterial color={RICH_GOLD} metalness={0.85} roughness={0.25} />
      </mesh>
      {[0.85, 0.5, 0.15].map((ringY, i) => {
        const r = 0.95 - i * 0.24
        const bulbs = 9 - i * 2
        return (
          <group key={i} position={[0, ringY, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[r, 0.032, 8, 32]} />
              <meshStandardMaterial color={RICH_GOLD} metalness={0.9} roughness={0.2} />
            </mesh>
            {Array.from({ length: bulbs }).map((_, b) => {
              const a = (b / bulbs) * Math.PI * 2
              return (
                <group key={b} position={[Math.cos(a) * r, -0.04, Math.sin(a) * r]}>
                  <mesh>
                    <sphereGeometry args={[0.042, 10, 10]} />
                    <meshBasicMaterial color={bulb} toneMapped={false} />
                  </mesh>
                  <mesh position={[0, -0.15, 0]}>
                    <coneGeometry args={[0.04, 0.2, 6]} />
                    <meshStandardMaterial color="#eaf4ff" transparent opacity={0.5} roughness={0.05} metalness={0.15} />
                  </mesh>
                </group>
              )
            })}
          </group>
        )
      })}
      <mesh position={[0, 0.02, 0]}>
        <coneGeometry args={[0.13, 0.46, 8]} />
        <meshStandardMaterial color="#eaf4ff" transparent opacity={0.55} roughness={0.05} metalness={0.15} />
      </mesh>
      <pointLight position={[0, 0.3, 0]} intensity={1.4} distance={9} color="#ffd9a0" />
    </group>
  )
}

/** Tall marble column with a gilded capital and base, for the four hall corners. */
function GrandColumn({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.36, H, 20]} />
        <meshStandardMaterial color="#efe8da" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.46, 0.5, 0.24, 20]} />
        <meshStandardMaterial color={RICH_GOLD} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, H - 0.14, 0]}>
        <cylinderGeometry args={[0.5, 0.42, 0.28, 20]} />
        <meshStandardMaterial color={RICH_GOLD} metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  )
}

/** Marble fountain centerpiece — replaces the plinth for the Gold hall. */
function GrandFountain() {
  return (
    <group>
      <ContactShadow pos={[0, 0.012, 0]} size={[4.2, 4.2]} />
      {/* basin */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.6, 0.48, 40]} />
        <meshStandardMaterial color="#efe6d8" roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.49, 0]}>
        <cylinderGeometry args={[1.38, 1.38, 0.02, 40]} />
        <meshStandardMaterial color="#2a5a6b" metalness={0.3} roughness={0.1} transparent opacity={0.85} />
      </mesh>
      {/* raised gold rim */}
      <mesh position={[0, 0.49, 0]}>
        <torusGeometry args={[1.5, 0.05, 12, 48]} />
        <meshStandardMaterial color={RICH_GOLD} metalness={0.85} roughness={0.2} />
      </mesh>
      {/* pedestal */}
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.72, 24]} />
        <meshStandardMaterial color="#efe6d8" roughness={0.25} />
      </mesh>
      {/* gold sculpture */}
      <mesh position={[0, 1.75, 0]} rotation={[0.3, 0, 0.15]} castShadow>
        <torusKnotGeometry args={[0.4, 0.13, 150, 28]} />
        <meshStandardMaterial color={RICH_GOLD} metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color={[2, 1.7, 1] as unknown as THREE.Color} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Gold Membership — The Grand Salon: a single long promenade replaces the
// hub-and-spoke hall entirely. Marble + crimson velvet + gold the whole way,
// one artist bay after another, ending in a finale room built around the
// fountain, the chandelier, and Elena's flagship collection.

const PROMENADE_LEN = PROMENADE_ENTRANCE_Z - PROMENADE_CORRIDOR_END_Z
const PROMENADE_CENTER_Z = (PROMENADE_ENTRANCE_Z + PROMENADE_CORRIDOR_END_Z) / 2

/** A gold archway spanning the corridor — marks the transition from one
 * artist's bay into the next, breaking the promenade into visible chapters
 * instead of one continuous tunnel. Purely decorative, no collision. */
function SectionArch({ z }: { z: number }) {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, H - 0.35, 0]}>
        <boxGeometry args={[CORRIDOR_HALF_W * 2 + 0.4, 0.55, 0.4]} />
        <meshStandardMaterial color={RICH_GOLD} metalness={0.75} roughness={0.3} />
      </mesh>
      {[-CORRIDOR_HALF_W + 0.35, CORRIDOR_HALF_W - 0.35].map((x) => (
        <mesh key={x} position={[x, H / 2 - 0.3, 0]} castShadow>
          <boxGeometry args={[0.5, H - 0.6, 0.5]} />
          <meshStandardMaterial color="#efe6d8" roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

const WAYPOINT_GLOWS = ['#ffb870', '#8fd0ff', '#ff9ad0']

/** A slim red-marble column flush against the corridor wall, gold-capped
 * with a small glowing finial — purely decorative, no floor footprint. */
function Pillar({ x, z, glow }: { x: number; z: number; glow: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.2, H, 16]} />
        <meshStandardMaterial color={GOLD_PANEL} roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.26, 0.28, 0.2, 16]} />
        <meshStandardMaterial color={RICH_GOLD} metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, H - 0.12, 0]}>
        <cylinderGeometry args={[0.28, 0.24, 0.24, 16]} />
        <meshStandardMaterial color={RICH_GOLD} metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, H - 0.02, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshBasicMaterial color={glow} toneMapped={false} />
      </mesh>
      <pointLight position={[0, H - 0.3, 0]} intensity={0.6} distance={3.5} color={glow} />
    </group>
  )
}

/** An oval recess carved into the wall — a real corner you step into —
 * pillar-framed at the mouth with a painting on its curved back wall.
 * The shell (walls/floor/ceiling/pillars — all solid colors or a
 * non-directional marble tile, so mirroring is harmless) is built bulging
 * toward +x and mirrored via a negative scale for the left-side one. The
 * painting is NOT inside that mirrored group — a negative x-scale flips a
 * textured plane's UVs too, which rendered every left-side title backwards.
 * Its position/rotation are computed directly from `side` instead. */
function Niche({ z, side, artId, glow }: { z: number; side: 1 | -1; artId: string; glow: string }) {
  const marble = makeMarbleFloorTexture()
  const art = getArt(artId)
  const D = NICHE_DEPTH
  const M = NICHE_HALF_MOUTH
  const wallX = side * (CORRIDOR_HALF_W - 0.15)
  return (
    <>
      <group position={[wallX, 0, z]} scale={[side, 1, 1]}>
        {/* curved back wall — a unit half-cylinder stretched into an ellipse */}
        <mesh position={[0, H / 2, 0]} scale={[D, 1, M]} castShadow receiveShadow>
          <cylinderGeometry args={[1, 1, H, 32, 1, true, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color={GOLD_PANEL} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* floor + ceiling filling the oval */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} scale={[D, M, 1]} receiveShadow>
          <circleGeometry args={[1, 32, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial map={marble} roughness={0.3} metalness={0.05} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H - 0.01, 0]} scale={[D, M, 1]}>
          <circleGeometry args={[1, 32, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color="#241a10" roughness={0.7} metalness={0.15} side={THREE.DoubleSide} />
        </mesh>
        {/* pillars marking the two corners where the recess opens off the corridor */}
        <Pillar x={0.15} z={M} glow={glow} />
        <Pillar x={0.15} z={-M} glow={glow} />
      </group>
      {/* painting at the oval's deepest point, positioned in world space
          directly so its text always reads the right way round */}
      <Artwork art={art} position={[wallX + side * (D - 0.17), 2.1, z]} rotY={side > 0 ? -Math.PI / 2 : Math.PI / 2} />
    </>
  )
}

/** A waypoint inside a bay — a real recessed corner on BOTH walls, mirrored,
 * sitting in the clear gap between that artist's own pieces so nothing
 * overlaps with the regular bay artworks or exclusive capstones. */
function Waypoint({
  z,
  leftArtId,
  rightArtId,
  variant,
}: {
  z: number
  leftArtId: string
  rightArtId: string
  variant: number
}) {
  const glow = WAYPOINT_GLOWS[variant % WAYPOINT_GLOWS.length]
  return (
    <group>
      <Niche z={z} side={-1} artId={leftArtId} glow={glow} />
      <Niche z={z} side={1} artId={rightArtId} glow={glow} />
    </group>
  )
}

/** Splits a straight run [zStart, zEnd] (zStart > zEnd) into wall segments,
 * leaving a gap around each entry in `gaps` — used to cut the niche mouths
 * into the corridor walls without hand-tuning segment lengths. */
function wallSegments(zStart: number, zEnd: number, gaps: { z: number; half: number }[]) {
  const sorted = [...gaps].sort((a, b) => b.z - a.z)
  const segments: { z: number; len: number }[] = []
  let cursor = zStart
  for (const g of sorted) {
    const gapTop = g.z + g.half
    const gapBot = g.z - g.half
    if (cursor > gapTop) segments.push({ z: (cursor + gapTop) / 2, len: cursor - gapTop })
    cursor = Math.min(cursor, gapBot)
  }
  if (cursor > zEnd) segments.push({ z: (cursor + zEnd) / 2, len: cursor - zEnd })
  return segments
}

/** A small brass wall sconce mounted high on the corridor wall, facing
 * inward — glow-only (no real light, like the chandelier bulbs), so adding
 * a whole run of them along the corridor costs nothing at render time. */
function CorridorSconce({ x, z, side }: { x: number; z: number; side: 1 | -1 }) {
  const wash = makeWashTexture()
  const rotY = side > 0 ? -Math.PI / 2 : Math.PI / 2
  return (
    <group position={[x, 3.85, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.5, 0.02]}>
        <planeGeometry args={[1.0, 1.5]} />
        <meshBasicMaterial
          map={wash}
          color={[1.3, 1.0, 0.6] as unknown as THREE.Color}
          transparent
          opacity={0.75}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, 0.14]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.1, 0.28, 12, 1, true]} />
        <meshStandardMaterial color={RICH_GOLD} metalness={0.8} roughness={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.14, 0.14]}>
        <cylinderGeometry args={[0.095, 0.095, 0.02, 12]} />
        <meshBasicMaterial color={[1.9, 1.6, 1.1] as unknown as THREE.Color} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** A gilded rosette set flush into the ceiling above each chandelier. */
function CeilingMedallion({ z }: { z: number }) {
  return (
    <group position={[0, H - 0.02, z]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[0.3, 1.25, 40]} />
        <meshStandardMaterial color={RICH_GOLD} metalness={0.8} roughness={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[1.35, 1.5, 40]} />
        <meshStandardMaterial color={RICH_GOLD} metalness={0.8} roughness={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/** Floor, walls, ceiling and chandeliers for the corridor itself. */
function PromenadeShell() {
  const marble = makeMarbleFloorTexture()
  const marbleNormal = makeMarbleNormalTexture()
  const reflectorProps = {
    map: marble,
    normalMap: marbleNormal,
    normalScale: new THREE.Vector2(0.3, 0.3),
    resolution: 512,
    mirror: 0.65,
    mixStrength: 1.1,
    mixBlur: 0.6,
    blur: [200, 80] as [number, number],
    roughness: 0.2,
    depthScale: 0.6,
    minDepthThreshold: 0.4,
    maxDepthThreshold: 1.4,
  }
  const coffers = []
  for (let z = PROMENADE_ENTRANCE_Z; z > PROMENADE_CORRIDOR_END_Z; z -= 8) coffers.push(z)

  const nicheGaps = WAYPOINTS.map((w) => ({ z: w.z, half: NICHE_HALF_MOUTH }))
  const wallSegs = wallSegments(PROMENADE_ENTRANCE_Z, PROMENADE_CORRIDOR_END_Z, nicheGaps)
  const sconceZs = coffers
    .map((z) => z - 4)
    .filter((z) => !nicheGaps.some((g) => Math.abs(z - g.z) < g.half + 0.5))

  return (
    <>
      {/* marble floor down the whole corridor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, PROMENADE_CENTER_Z]} receiveShadow>
        <planeGeometry args={[CORRIDOR_HALF_W * 2, PROMENADE_LEN]} />
        <MeshReflectorMaterial {...reflectorProps} />
      </mesh>
      {/* red carpet the whole way, piped in gold along both edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, PROMENADE_CENTER_Z]}>
        <planeGeometry args={[2.4, PROMENADE_LEN]} />
        <meshStandardMaterial color="#6e0f1a" roughness={0.85} />
      </mesh>
      {[-1.24, 1.24].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.012, PROMENADE_CENTER_Z]}>
          <planeGeometry args={[0.06, PROMENADE_LEN]} />
          <meshStandardMaterial color={RICH_GOLD} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* crimson velvet + gold-trimmed walls — segmented to leave a mouth
          open on both sides wherever a niche recess cuts into the wall */}
      {wallSegs.map((s) => (
        <Wall key={`l${s.z}`} pos={[-CORRIDOR_HALF_W, H / 2, s.z]} size={[0.3, H, s.len]} gold />
      ))}
      {wallSegs.map((s) => (
        <Wall key={`r${s.z}`} pos={[CORRIDOR_HALF_W, H / 2, s.z]} size={[0.3, H, s.len]} gold />
      ))}
      {/* a second, mid-height gold picture-rail line — segmented the same
          way as the walls so it never floats across a niche mouth */}
      {wallSegs.map((s) => (
        <mesh key={`dl${s.z}`} position={[-CORRIDOR_HALF_W + 0.16, 1.05, s.z]}>
          <boxGeometry args={[0.05, 0.05, s.len]} />
          <meshStandardMaterial color={RICH_GOLD} metalness={0.75} roughness={0.3} />
        </mesh>
      ))}
      {wallSegs.map((s) => (
        <mesh key={`dr${s.z}`} position={[CORRIDOR_HALF_W - 0.16, 1.05, s.z]}>
          <boxGeometry args={[0.05, 0.05, s.len]} />
          <meshStandardMaterial color={RICH_GOLD} metalness={0.75} roughness={0.3} />
        </mesh>
      ))}
      {/* wall sconces between the ceiling coffers, glow-only like the
          chandelier bulbs — pure visual richness at no lighting cost */}
      {sconceZs.map((z) => (
        <group key={`sc${z}`}>
          <CorridorSconce x={-CORRIDOR_HALF_W + 0.17} z={z} side={-1} />
          <CorridorSconce x={CORRIDOR_HALF_W - 0.17} z={z} side={1} />
        </group>
      ))}
      {WAYPOINTS.map((w, i) => (
        <Waypoint key={w.z} z={w.z} leftArtId={w.leftArtId} rightArtId={w.rightArtId} variant={i} />
      ))}

      {/* gilded ceiling + coffer beams every 8 units */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, PROMENADE_CENTER_Z]}>
        <planeGeometry args={[CORRIDOR_HALF_W * 2 + 0.6, PROMENADE_LEN]} />
        <meshStandardMaterial color="#241a10" roughness={0.7} metalness={0.15} />
      </mesh>
      {coffers.map((z) => (
        <mesh key={z} position={[0, 4.9, z]}>
          <boxGeometry args={[CORRIDOR_HALF_W * 2 + 0.3, 0.22, 0.3]} />
          <meshStandardMaterial color={RICH_GOLD} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {[-CORRIDOR_HALF_W + 0.2, CORRIDOR_HALF_W - 0.2].map((x) => (
        <mesh key={x} position={[x, 4.9, PROMENADE_CENTER_Z]}>
          <boxGeometry args={[0.16, 0.16, PROMENADE_LEN]} />
          <meshStandardMaterial color={RICH_GOLD} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* welcome sign at the entrance */}
      <Banner pos={[0, 4.3, PROMENADE_ENTRANCE_Z - 1.4]} w={6.2} h={1.1} text="THE GRAND SALON" sub="Gold Membership" light />

      {/* an archway at every bay-to-bay transition */}
      {PROMENADE_SECTION_BREAKS.map((z) => (
        <SectionArch key={z} z={z} />
      ))}

      {/* one chandelier per artist bay, each set in a gilded ceiling rosette */}
      {PROMENADE_BAYS.map((b) => (
        <group key={b.z}>
          <Chandelier pos={[0, H - 0.55, b.z]} />
          <CeilingMedallion z={b.z} />
        </group>
      ))}
    </>
  )
}

/** One artist's stretch of the promenade — art on both walls, exclusive
 * piece as the capstone at the far end. */
function PromenadeBay({ artist, centerZ }: { artist: Artist; centerZ: number }) {
  const arts = byArtist(artist.id)
  const exclusive = exclusiveFor(artist.id)
  const leftArts = arts.slice(0, 3)
  const rightArts = arts.slice(3, 6)
  const offsets = [-6, 0, 6]
  return (
    <group>
      <Banner
        pos={[0, 4.3, centerZ - BAY_LEN / 2 + 0.6]}
        w={4.6}
        h={0.95}
        text={artist.name.toUpperCase()}
        sub={artist.tagline}
        light
      />
      <SpotDown pos={[0, 4.55, centerZ]} intensity={62} color="#ffdca0" />
      {leftArts.map((a, i) => (
        <Artwork key={a.id} art={a} position={[-CORRIDOR_HALF_W + 0.17, 2.1, centerZ + offsets[i]]} rotY={Math.PI / 2} />
      ))}
      {rightArts.map((a, i) => (
        <Artwork key={a.id} art={a} position={[CORRIDOR_HALF_W - 0.17, 2.1, centerZ + offsets[i]]} rotY={-Math.PI / 2} />
      ))}
      {exclusive && (
        <Artwork
          art={exclusive}
          position={[CORRIDOR_HALF_W - 0.17, 2.1, centerZ + BAY_LEN / 2 - 1]}
          rotY={-Math.PI / 2}
          exclusive
        />
      )}
    </group>
  )
}

/** The finale: fountain, chandelier, four columns, and Elena's flagship
 * collection (including her one exclusive) on the surrounding walls. */
function FinaleRoom({ elena }: { elena: Artist }) {
  const arts = byArtist(elena.id)
  const exclusive = exclusiveFor(elena.id)
  const cz = FINALE_CENTER_Z
  const half = FINALE_HALF
  const stubW = half - CORRIDOR_HALF_W
  return (
    <group>
      <Wall pos={[0, H / 2, cz - half]} size={[half * 2, H, 0.3]} gold />
      <Wall pos={[-half, H / 2, cz]} size={[0.3, H, half * 2]} gold />
      <Wall pos={[half, H / 2, cz]} size={[0.3, H, half * 2]} gold />
      {/* short stub walls where the corridor mouth meets the wider room */}
      <Wall pos={[-(CORRIDOR_HALF_W + stubW / 2), H / 2, cz + half]} size={[stubW, H, 0.3]} gold />
      <Wall pos={[CORRIDOR_HALF_W + stubW / 2, H / 2, cz + half]} size={[stubW, H, 0.3]} gold />

      <Banner
        pos={[0, 4.3, cz - half + 0.17]}
        w={9}
        h={1.1}
        text="THE LIVING ARTISTS MUSEUM"
        sub="Gold Membership · The Grand Salon"
        light
      />

      {arts[0] && <Artwork art={arts[0]} position={[-5.2, 2.1, cz - half + 0.17]} rotY={0} />}
      {arts[1] && <Artwork art={arts[1]} position={[5.2, 2.1, cz - half + 0.17]} rotY={0} />}
      {arts[2] && <Artwork art={arts[2]} position={[-half + 0.17, 2.1, cz]} rotY={Math.PI / 2} />}
      {arts[3] && <Artwork art={arts[3]} position={[half - 0.17, 2.1, cz]} rotY={-Math.PI / 2} />}
      {exclusive && <Artwork art={exclusive} position={[0, 2.3, cz - half + 0.17]} rotY={0} exclusive />}

      {/* gilded ceiling + oculus over the finale room */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, cz]}>
        <planeGeometry args={[half * 2, half * 2]} />
        <meshStandardMaterial color="#241a10" roughness={0.7} metalness={0.15} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H - 0.03, cz]}>
        <ringGeometry args={[0.2, 2.1, 40]} />
        <meshBasicMaterial color={[1.7, 1.45, 0.95] as unknown as THREE.Color} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H - 0.05, cz]}>
        <torusGeometry args={[2.1, 0.06, 10, 48]} />
        <meshStandardMaterial color={RICH_GOLD} metalness={0.85} roughness={0.2} />
      </mesh>

      <Chandelier pos={[0, H - 0.55, cz]} />
      <GrandColumn pos={[-FINALE_COLUMN_OFFSET, 0, cz - FINALE_COLUMN_OFFSET]} />
      <GrandColumn pos={[FINALE_COLUMN_OFFSET, 0, cz - FINALE_COLUMN_OFFSET]} />
      <GrandColumn pos={[FINALE_COLUMN_OFFSET, 0, cz + FINALE_COLUMN_OFFSET]} />
      <GrandColumn pos={[-FINALE_COLUMN_OFFSET, 0, cz + FINALE_COLUMN_OFFSET]} />
      <group position={[0, 0, cz]}>
        <GrandFountain />
      </group>
    </group>
  )
}

function GoldPromenade({ elena }: { elena: Artist }) {
  return (
    <>
      <PromenadeShell />
      {PROMENADE_BAYS.map((b) => (
        <PromenadeBay key={b.artist.id} artist={b.artist} centerZ={b.z} />
      ))}
      <FinaleRoom elena={elena} />
    </>
  )
}

// ---------------------------------------------------------------------------

export default function Gallery({ membership }: { membership: Membership }) {
  const [elena, aurora, marcus, sofia, david] = ARTISTS
  const hallArts = byArtist(elena.id)
  const gold = membership === 'gold'

  return (
    <group>
      {/* lights */}
      <ambientLight intensity={gold ? 0.4 : 0.45} />
      <hemisphereLight args={gold ? ['#ffe9c2', '#3a1418', 0.38] : ['#fff6e8', '#5a4a3a', 0.4]} />

      <Dust />

      {gold ? (
        <GoldPromenade elena={elena} />
      ) : (
        <>
          <SpotDown pos={[0, 4.55, 0]} intensity={78} angle={1.25} />
          <NormalHallCore aurora={aurora} marcus={marcus} sofia={sofia} david={david} hallArts={hallArts} />
          <Wing angle={0} artist={aurora} />
          <Wing angle={-Math.PI / 2} artist={marcus} />
          <Wing angle={Math.PI} artist={sofia} />
          <Wing angle={Math.PI / 2} artist={david} />
        </>
      )}
    </group>
  )
}
