// Museum layout. Two completely different floor plans depending on membership
// tier — General Admission gets the original 20x20 hall + four wings; Gold
// gets a single long promenade ending in a finale room. Walk rects are an
// allow-list of axis-aligned rectangles the player may occupy; block rects
// carve out furniture/fountains/columns. Doorways are narrow gaps in the
// walk rects, centered on each wall.

import { ARTISTS, type Artist } from './artworks'
import type { Membership } from '../store'

export type Rect = { x1: number; x2: number; z1: number; z2: number }

export const WALL_H = 5
export const EYE_H = 1.6

// =====================================================================
// General Admission — 20x20 central hall + four 10x14 wings (N/E/S/W)
// =====================================================================

const NORMAL_WALK_RECTS: Rect[] = [
  // main hall
  { x1: -9.5, x2: 9.5, z1: -9.5, z2: 9.5 },
  // north wing + door
  { x1: -4.5, x2: 4.5, z1: -23.5, z2: -10.5 },
  { x1: -1.7, x2: 1.7, z1: -11, z2: -9 },
  // south wing + door
  { x1: -4.5, x2: 4.5, z1: 10.5, z2: 23.5 },
  { x1: -1.7, x2: 1.7, z1: 9, z2: 11 },
  // east wing + door
  { x1: 10.5, x2: 23.5, z1: -4.5, z2: 4.5 },
  { x1: 9, x2: 11, z1: -1.7, z2: 1.7 },
  // west wing + door
  { x1: -23.5, x2: -10.5, z1: -4.5, z2: 4.5 },
  { x1: -11, x2: -9, z1: -1.7, z2: 1.7 },
]

const NORMAL_BLOCK_RECTS: Rect[] = [
  // central plinth
  { x1: -1.1, x2: 1.1, z1: -1.1, z2: 1.1 },
  // benches (hall corners)
  { x1: -8.3, x2: -5.7, z1: -7.9, z2: -6.1 },
  { x1: 5.7, x2: 8.3, z1: 6.1, z2: 7.9 },
]

function normalRoomAt(x: number, z: number): string {
  if (z < -10) return `Gallery I · ${ARTISTS[1].name}`
  if (x > 10) return `Gallery II · ${ARTISTS[2].name}`
  if (z > 10) return `Gallery III · ${ARTISTS[3].name}`
  if (x < -10) return `Gallery IV · ${ARTISTS[4].name}`
  return `Main Hall · ${ARTISTS[0].name}`
}

// =====================================================================
// Gold Membership — The Grand Salon: one long promenade running down -Z,
// one artist bay after another, ending in a finale room (fountain,
// chandelier, four columns, Elena's flagship collection on the walls).
// =====================================================================

export const BAY_LEN = 20
export const CORRIDOR_HALF_W = 6.5
export const PROMENADE_ENTRANCE_Z = 8
export const PROMENADE_CORRIDOR_END_Z = -80
export const FINALE_HALF = 10
export const FINALE_CENTER_Z = -90
export const FINALE_FOUNTAIN_R = 1.75
export const FINALE_COLUMN_OFFSET = 7.6

export const PROMENADE_BAYS: { z: number; artist: Artist }[] = [
  { z: -10, artist: ARTISTS[1] }, // Aurora — Gallery I
  { z: -30, artist: ARTISTS[2] }, // Marcus — Gallery II
  { z: -50, artist: ARTISTS[3] }, // Sofia — Gallery III
  { z: -70, artist: ARTISTS[4] }, // David — Gallery IV
]

// z of every section break (entrance→bay1, bay→bay, bay4→finale) — used to
// place the decorative arches that break the promenade into visible chapters.
export const PROMENADE_SECTION_BREAKS: number[] = [
  ...PROMENADE_BAYS.map((b) => b.z + BAY_LEN / 2),
  PROMENADE_CORRIDOR_END_Z,
]

// Waypoints: an actual oval recess carved into BOTH walls (a real corner
// you step into, not just a flat decoration), pillar-framed at the mouth,
// with a painting on the back wall of each. Placed in the clear gap
// between each bay's own artworks — not at the bay-to-bay seams, where the
// neighboring bay's regular pieces and, right at the seam, the entering
// artist's exclusive capstone leave no room to spare. The mouth width stays
// fixed (it's what's proven clear of the neighboring bay art); only the
// depth changes to make the oval rounder or shallower.
export const NICHE_DEPTH = 2.4
export const NICHE_HALF_MOUTH = 1.5
export const WAYPOINTS: { z: number; leftArtId: string; rightArtId: string }[] = [
  { z: -13, leftArtId: 'ac-niche', rightArtId: 'ac-niche2' },
  { z: -33, leftArtId: 'mw-niche', rightArtId: 'mw-niche2' },
  { z: -53, leftArtId: 'sr-niche', rightArtId: 'sr-niche2' },
]

// The recess sits at the wall's inner face (CORRIDOR_HALF_W - 0.15), same
// as the wall's own inner surface, so its floor picks up exactly where the
// corridor floor ends.
const NICHE_INNER = CORRIDOR_HALF_W - 0.15

const GOLD_WALK_RECTS: Rect[] = [
  { x1: -CORRIDOR_HALF_W, x2: CORRIDOR_HALF_W, z1: PROMENADE_CORRIDOR_END_Z, z2: PROMENADE_ENTRANCE_Z },
  { x1: -FINALE_HALF, x2: FINALE_HALF, z1: FINALE_CENTER_Z - FINALE_HALF, z2: FINALE_CENTER_Z + FINALE_HALF },
  ...WAYPOINTS.flatMap((w) => [
    { x1: NICHE_INNER, x2: NICHE_INNER + NICHE_DEPTH, z1: w.z - NICHE_HALF_MOUTH, z2: w.z + NICHE_HALF_MOUTH },
    { x1: -(NICHE_INNER + NICHE_DEPTH), x2: -NICHE_INNER, z1: w.z - NICHE_HALF_MOUTH, z2: w.z + NICHE_HALF_MOUTH },
  ]),
]

const GOLD_BLOCK_RECTS: Rect[] = [
  // fountain
  {
    x1: -FINALE_FOUNTAIN_R,
    x2: FINALE_FOUNTAIN_R,
    z1: FINALE_CENTER_Z - FINALE_FOUNTAIN_R,
    z2: FINALE_CENTER_Z + FINALE_FOUNTAIN_R,
  },
  // four corner columns
  ...[
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sz]) => ({
    x1: sx * FINALE_COLUMN_OFFSET - 0.4,
    x2: sx * FINALE_COLUMN_OFFSET + 0.4,
    z1: FINALE_CENTER_Z + sz * FINALE_COLUMN_OFFSET - 0.4,
    z2: FINALE_CENTER_Z + sz * FINALE_COLUMN_OFFSET + 0.4,
  })),
]

function goldRoomAt(z: number): string {
  if (z <= PROMENADE_CORRIDOR_END_Z) return `The Grand Salon · ${ARTISTS[0].name}`
  const bay = PROMENADE_BAYS.find((b) => z <= b.z + BAY_LEN / 2 && z > b.z - BAY_LEN / 2)
  return bay ? `${bay.artist.gallery} · ${bay.artist.name}` : 'The Grand Salon'
}

// =====================================================================

export function roomAt(x: number, z: number, membership: Membership | null): string {
  return membership === 'gold' ? goldRoomAt(z) : normalRoomAt(x, z)
}

export function canWalk(x: number, z: number, membership: Membership | null): boolean {
  const walk = membership === 'gold' ? GOLD_WALK_RECTS : NORMAL_WALK_RECTS
  const block = membership === 'gold' ? GOLD_BLOCK_RECTS : NORMAL_BLOCK_RECTS
  const inWalk = walk.some((r) => x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2)
  if (!inWalk) return false
  const inBlock = block.some((r) => x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2)
  return !inBlock
}
