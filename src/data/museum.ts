// ===================================================================
// The Atelier Museum of Emerging Art — domain model (information architecture)
//
// Hierarchy:  Museum → Theme → Hall → Room → Exhibition → Artwork
//   • An Exhibition is an artist's showing placed in a Room for a period.
//     Rooms are NOT permanently tied to an artist — rotate by pointing a
//     room at a different exhibition (Room.currentExhibitionId).
//   • Access levels (public / member / premium / private) attach at Hall,
//     Exhibition, and Artwork level; the effective requirement is the most
//     restrictive along the chain. A whole Hall can be premium-members-only.
//   • Commerce (prints/originals/gift shop/donations/memberships) is modeled
//     now but implemented in a later phase — adding it needs no redesign.
//
// This model supersedes the flat artworks.ts. Real content is mapped in
// during the rebrand task; a small sample seed lives at the bottom so the
// model is type-checked and the Phase 1 build has something to render.
// ===================================================================

export type ArtStyle = 'expressionist' | 'colorField' | 'geometric' | 'impressionist' | 'lineArt' | 'ascii'
// ---- access control ------------------------------------------------

export type AccessLevel = 'public' | 'member' | 'premium' | 'private'
export type VisitorTier = 'public' | 'member' | 'premium' | 'admin'

const ACCESS_RANK: Record<AccessLevel, number> = { public: 0, member: 1, premium: 2, private: 3 }
const TIER_RANK: Record<VisitorTier, number> = { public: 0, member: 1, premium: 2, admin: 3 }

/** Most-restrictive wins down the Hall → Exhibition → Artwork chain. */
export function effectiveAccess(...levels: AccessLevel[]): AccessLevel {
  return levels.reduce<AccessLevel>((a, b) => (ACCESS_RANK[b] > ACCESS_RANK[a] ? b : a), 'public')
}

/** Can a visitor of the given tier view content at this access level? */
export function canView(required: AccessLevel, visitor: VisitorTier): boolean {
  if (required === 'private') return visitor === 'admin'
  return TIER_RANK[visitor] >= ACCESS_RANK[required]
}

// ---- commerce (built in a later phase; fields present now) ---------

export type PrintOption = { id: string; label: string; price: number; sku?: string }

export type Commerce = {
  printsForSale: boolean
  prints: PrintOption[]
  originalForSale?: boolean
  originalPrice?: number
  currency?: string // defaults to MUSEUM.currency
  artistShare?: number // defaults to MUSEUM.artistShare
  productRef?: string // external store id (Shopify/Stripe) — future
}

// ---- procedural placeholder (until a real image is supplied) -------

export type Placeholder = {
  seed: number
  palette: string[]
  style?: ArtStyle
  dims: [number, number] // 3D world units [w, h]
}

// ---- core entities -------------------------------------------------

export type Theme = {
  id: string
  slug: string
  title: string
  subtitle?: string
  description?: string
  cover?: string
  order?: number
}

export type Hall = {
  id: string
  slug: string
  themeId: string
  title: string
  description?: string
  access: AccessLevel // e.g. a premium-members hall
  order?: number
}

export type Room = {
  id: string
  slug: string
  hallId: string
  title: string
  order?: number
  capacity?: number // ~5 rooms/hall guideline; artworks per room is flexible
  currentExhibitionId?: string // the active exhibition; rotate by changing this
}

export type ExhibitionStatus = 'permanent' | 'current' | 'upcoming' | 'past'

export type Exhibition = {
  id: string
  slug: string
  roomId: string
  artistId: string
  title: string
  story?: string
  status: ExhibitionStatus
  startDate?: string // ISO date
  endDate?: string // ISO date
  access: AccessLevel
  order?: number
}

export type Artist = {
  id: string
  slug: string
  name: string
  tagline?: string
  bio?: string
  portrait?: string
  country?: string
  links?: { label: string; url: string }[]
  defaultStyle?: ArtStyle
}

export type Artwork = {
  id: string
  slug: string
  exhibitionId: string
  artistId: string
  title: string
  year?: number
  medium?: string
  dimensions?: string // human-readable, e.g. "24 × 36 in"
  image?: string // real image; when absent the placeholder is generated
  placeholder?: Placeholder
  shortDescription?: string
  story?: string
  themeTags?: string[]
  access: AccessLevel
  copyright?: string
  usageRights?: string
  commerce?: Commerce
  order?: number
}

// ---- future modules (declared, not built in Phase 1) --------------

export type MembershipTier = {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  benefits: string[]
  grants: AccessLevel[] // access levels this tier unlocks
}

export type MuseumConfig = {
  name: string
  tagline?: string
  currency: string
  artistShare: number // fraction paid to the artist, e.g. 0.5
}

// ---- the museum ----------------------------------------------------

export type Museum = {
  config: MuseumConfig
  themes: Theme[]
  halls: Hall[]
  rooms: Room[]
  exhibitions: Exhibition[]
  artists: Artist[]
  artworks: Artwork[]
  membershipTiers?: MembershipTier[]
}

export const MUSEUM_CONFIG: MuseumConfig = {
  name: 'The Atelier Museum of Emerging Art',
  tagline: 'Discover artists before history does.',
  currency: 'USD',
  artistShare: 0.5,
}

// ---- lookup & navigation helpers -----------------------------------

export function makeMuseum(data: Omit<Museum, 'config'> & { config?: MuseumConfig }): Museum {
  return { config: MUSEUM_CONFIG, ...data }
}

export const hallsInTheme = (m: Museum, themeId: string) =>
  m.halls.filter((h) => h.themeId === themeId).sort(byOrder)

export const roomsInHall = (m: Museum, hallId: string) =>
  m.rooms.filter((r) => r.hallId === hallId).sort(byOrder)

export const exhibitionsInRoom = (m: Museum, roomId: string) =>
  m.exhibitions.filter((e) => e.roomId === roomId).sort(byOrder)

export const currentExhibition = (m: Museum, room: Room) =>
  room.currentExhibitionId
    ? m.exhibitions.find((e) => e.id === room.currentExhibitionId)
    : exhibitionsInRoom(m, room.id).find((e) => e.status === 'current' || e.status === 'permanent')

export const artworksInExhibition = (m: Museum, exhibitionId: string) =>
  m.artworks.filter((a) => a.exhibitionId === exhibitionId).sort(byOrder)

export const artistById = (m: Museum, id: string) => m.artists.find((a) => a.id === id)
export const themeBySlug = (m: Museum, slug: string) => m.themes.find((t) => t.slug === slug)
export const hallBySlug = (m: Museum, slug: string) => m.halls.find((h) => h.slug === slug)
export const roomBySlug = (m: Museum, slug: string) => m.rooms.find((r) => r.slug === slug)
export const artworkBySlug = (m: Museum, slug: string) => m.artworks.find((a) => a.slug === slug)

/** Effective access requirement for an artwork, folding in its exhibition + hall. */
export function artworkAccess(m: Museum, art: Artwork): AccessLevel {
  const ex = m.exhibitions.find((e) => e.id === art.exhibitionId)
  const room = ex && m.rooms.find((r) => r.id === ex.roomId)
  const hall = room && m.halls.find((h) => h.id === room.hallId)
  return effectiveAccess(hall?.access ?? 'public', ex?.access ?? 'public', art.access)
}

const byOrder = (a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0)

// ---- SAMPLE SEED ---------------------------------------------------
// Placeholder content so the model type-checks and Phase 1 has something
// to render. Replace with real themes/artists for production.

export const SAMPLE_MUSEUM: Museum = makeMuseum({
  themes: [
    { id: 't-main', slug: 'all-exhibits', title: 'Museum Collection', order: 1 },
  ],
  halls: [
    { id: 'h-main', slug: 'main-hall', themeId: 't-main', title: 'Main Hall', access: 'public', order: 1 },
  ],
  rooms: [
    { id: 'r-1', slug: 'room-1', hallId: 'h-main', title: 'Main Hall', order: 1, capacity: 10, currentExhibitionId: 'ex-elena' },
    { id: 'r-2', slug: 'room-2', hallId: 'h-main', title: 'Exhibit I', order: 2, capacity: 10, currentExhibitionId: 'ex-aurora' },
    { id: 'r-3', slug: 'room-3', hallId: 'h-main', title: 'Exhibit II', order: 3, capacity: 10, currentExhibitionId: 'ex-marcus' },
    { id: 'r-4', slug: 'room-4', hallId: 'h-main', title: 'Exhibit III', order: 4, capacity: 10, currentExhibitionId: 'ex-sofia' },
    { id: 'r-5', slug: 'room-5', hallId: 'h-main', title: 'Exhibit IV', order: 5, capacity: 10, currentExhibitionId: 'ex-david' },
  ],
  exhibitions: [
    { id: 'ex-elena', slug: 'elena-volkov-exhibit', roomId: 'r-1', artistId: 'a-elena', title: 'Elena Volkov Exhibit', status: 'current', access: 'public', order: 1 },
    { id: 'ex-aurora', slug: 'aurora-chen-exhibit', roomId: 'r-2', artistId: 'a-aurora', title: 'Aurora Chen Exhibit', status: 'current', access: 'public', order: 2 },
    { id: 'ex-marcus', slug: 'marcus-webb-exhibit', roomId: 'r-3', artistId: 'a-marcus', title: 'Marcus Webb Exhibit', status: 'current', access: 'public', order: 3 },
    { id: 'ex-sofia', slug: 'sofia-reyes-exhibit', roomId: 'r-4', artistId: 'a-sofia', title: 'Sofia Reyes Exhibit', status: 'current', access: 'public', order: 4 },
    { id: 'ex-david', slug: 'david-okafor-exhibit', roomId: 'r-5', artistId: 'a-david', title: 'David Okafor Exhibit', status: 'current', access: 'public', order: 5 },
  ],
  artists: [
    { id: 'a-elena', slug: 'elena-volkov', name: 'Elena Volkov', tagline: 'Bold color in motion', bio: 'Elena paints fast, physical canvases where color behaves like weather. Her Chromatic Storm series anchors the museum’s Main Hall.', defaultStyle: 'expressionist' },
    { id: 'a-aurora', slug: 'aurora-chen', name: 'Aurora Chen', tagline: 'Meditations on light and horizon', bio: 'Aurora’s color-field paintings are slow, breathing gradients — studies of dawn, dusk and open water reduced to pure atmosphere.', defaultStyle: 'colorField' },
    { id: 'a-marcus', slug: 'marcus-webb', name: 'Marcus Webb', tagline: 'Structure, rhythm, city', bio: 'Marcus builds crisp geometric compositions inspired by street grids and transit maps — order with just enough surprise.', defaultStyle: 'geometric' },
    { id: 'a-sofia', slug: 'sofia-reyes', name: 'Sofia Reyes', tagline: 'Light studies in a thousand strokes', bio: 'Sofia works outdoors in short sessions, catching fields, harbors and orchards in dense flurries of broken color.', defaultStyle: 'impressionist' },
    { id: 'a-david', slug: 'david-okafor', name: 'David Okafor', tagline: 'One line, held breath', bio: 'David draws continuous-line meditations in ink — each piece a single unbroken gesture, spare and quiet.', defaultStyle: 'lineArt' },
  ],
  artworks: [
    {
      id: 'aw-ev1', slug: 'chromatic-storm-i', exhibitionId: 'ex-elena', artistId: 'a-elena',
      title: 'Chromatic Storm I', year: 2024,
      story: 'The first of the storm series — a front of warm color colliding with cold teal, painted in a single afternoon.', access: 'public', order: 1,
      placeholder: { seed: 101, palette: ["#e63946","#f4a261","#2a9d8f","#e9c46a"], dims: [2.3, 1.7] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 87 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 145 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 232 }] },
    },
    {
      id: 'aw-ev2', slug: 'chromatic-storm-ii', exhibitionId: 'ex-elena', artistId: 'a-elena',
      title: 'Chromatic Storm II', year: 2024,
      story: 'Storm II turns electric — violet and magenta arcs cut by cobalt, the most kinetic piece in the hall.', access: 'public', order: 2,
      placeholder: { seed: 102, palette: ["#8338ec","#ff006e","#3a86ff","#ffbe0b"], dims: [2.3, 1.7] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 87 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 145 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 232 }] },
    },
    {
      id: 'aw-ev3', slug: 'ember', exhibitionId: 'ex-elena', artistId: 'a-elena',
      title: 'Ember', year: 2023,
      story: 'A quieter piece: banked fire under a dark field, strokes layered until the surface seems to glow from inside.', access: 'public', order: 3,
      placeholder: { seed: 103, palette: ["#d00000","#ffba08","#f48c06","#6a040f"], dims: [2.3, 1.7] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 78 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 130 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 208 }] },
    },
    {
      id: 'aw-ev4', slug: 'north-light', exhibitionId: 'ex-elena', artistId: 'a-elena',
      title: 'North Light', year: 2025,
      story: 'Painted after a winter residency — aurora greens and glacial blues sweeping across a near-black ground.', access: 'public', order: 4,
      placeholder: { seed: 104, palette: ["#06d6a0","#118ab2","#83c5be","#edf6f9"], dims: [2.3, 1.7] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 96 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 160 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 256 }] },
    },
    {
      id: 'aw-ac1', slug: 'dawn-meridian', exhibitionId: 'ex-aurora', artistId: 'a-aurora',
      title: 'Dawn Meridian', year: 2024,
      story: 'Four bands of first light — amber lifting out of violet dark, the horizon implied rather than drawn.', access: 'public', order: 5,
      placeholder: { seed: 201, palette: ["#f2c14e","#e8846b","#7b4b94","#2e2d4d"], dims: [1.5, 2] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 57 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 95 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 152 }] },
    },
    {
      id: 'aw-ac2', slug: 'sea-glass', exhibitionId: 'ex-aurora', artistId: 'a-aurora',
      title: 'Sea Glass', year: 2024,
      story: 'Cool blues stacked like water at depth, softened until the edges dissolve completely.', access: 'public', order: 6,
      placeholder: { seed: 202, palette: ["#8ecae6","#219ebc","#126782","#023047"], dims: [1.5, 2] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 54 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 90 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 144 }] },
    },
    {
      id: 'aw-ac3', slug: 'amber-hour', exhibitionId: 'ex-aurora', artistId: 'a-aurora',
      title: 'Amber Hour', year: 2023,
      story: 'The last twenty minutes of an October evening compressed into slow gradients of heat.', access: 'public', order: 7,
      placeholder: { seed: 203, palette: ["#ffb703","#fd9e02","#e85d04","#6a040f"], dims: [1.5, 2] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 51 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 85 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 136 }] },
    },
    {
      id: 'aw-ac4', slug: 'night-swim', exhibitionId: 'ex-aurora', artistId: 'a-aurora',
      title: 'Night Swim', year: 2025,
      story: 'Blue-black water under blue-black sky — Aurora’s darkest and most requested piece.', access: 'public', order: 8,
      placeholder: { seed: 204, palette: ["#0d1b2a","#1b263b","#415a77","#778da9"], dims: [1.5, 2] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 66 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 110 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 176 }] },
    },
    {
      id: 'aw-ac5', slug: 'quiet-horizon', exhibitionId: 'ex-aurora', artistId: 'a-aurora',
      title: 'Quiet Horizon', year: 2025,
      story: 'A pale, weightless field painted in thin veils of lavender and sky — the centerpiece of Exhibit I.', access: 'public', order: 9,
      placeholder: { seed: 205, palette: ["#cdb4db","#ffc8dd","#bde0fe","#a2d2ff"], dims: [2.2, 1.5] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 63 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 105 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 168 }] },
    },
    {
      id: 'aw-mw1', slug: 'grid-study-no-7', exhibitionId: 'ex-marcus', artistId: 'a-marcus',
      title: 'Grid Study No. 7', year: 2024,
      story: 'The seventh in an ongoing series of balanced asymmetries — primary color held in a black lattice.', access: 'public', order: 10,
      placeholder: { seed: 301, palette: ["#d32f2f","#1565c0","#f9a825"], dims: [1.5, 2] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 48 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 80 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 128 }] },
    },
    {
      id: 'aw-mw2', slug: 'interchange', exhibitionId: 'ex-marcus', artistId: 'a-marcus',
      title: 'Interchange', year: 2024,
      story: 'Named for a highway junction seen from the air; terracotta and sage negotiating right angles.', access: 'public', order: 11,
      placeholder: { seed: 302, palette: ["#e07a5f","#3d405b","#81b29a"], dims: [1.5, 2] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 51 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 85 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 136 }] },
    },
    {
      id: 'aw-mw3', slug: 'signal-red', exhibitionId: 'ex-marcus', artistId: 'a-marcus',
      title: 'Signal Red', year: 2023,
      story: 'One dominant red field, precisely offset — the piece that first got Marcus collected.', access: 'public', order: 12,
      placeholder: { seed: 303, palette: ["#d90429","#2b2d42","#8d99ae"], dims: [1.5, 2] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 45 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 75 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 120 }] },
    },
    {
      id: 'aw-mw4', slug: 'composition-in-blue', exhibitionId: 'ex-marcus', artistId: 'a-marcus',
      title: 'Composition in Blue', year: 2025,
      story: 'Three blues and a single bar of yellow; restraint as its own kind of drama.', access: 'public', order: 13,
      placeholder: { seed: 304, palette: ["#0466c8","#0353a4","#023e7d","#ffd60a"], dims: [1.5, 2] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 54 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 90 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 144 }] },
    },
    {
      id: 'aw-mw5', slug: 'city-block', exhibitionId: 'ex-marcus', artistId: 'a-marcus',
      title: 'City Block', year: 2025,
      story: 'A wide, playful map of an imagined neighborhood — Exhibit II’s centerpiece.', access: 'public', order: 14,
      placeholder: { seed: 305, palette: ["#ef476f","#ffd166","#06d6a0","#118ab2"], dims: [2.2, 1.5] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 57 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 95 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 152 }] },
    },
    {
      id: 'aw-sr1', slug: 'field-at-noon', exhibitionId: 'ex-sofia', artistId: 'a-sofia',
      title: 'Field at Noon', year: 2024,
      story: 'High summer heat in broken strokes of olive and wheat, painted in a single two-hour session.', access: 'public', order: 15,
      placeholder: { seed: 401, palette: ["#606c38","#283618","#fefae0","#dda15e"], dims: [2.2, 1.5] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 54 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 90 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 144 }] },
    },
    {
      id: 'aw-sr2', slug: 'poppies-after-rain', exhibitionId: 'ex-sofia', artistId: 'a-sofia',
      title: 'Poppies After Rain', year: 2024,
      story: 'Wet red blooms against washed green — the rain had barely stopped when she started.', access: 'public', order: 16,
      placeholder: { seed: 402, palette: ["#bc4749","#a7c957","#6a994e","#f2e8cf"], dims: [1.5, 2] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 57 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 95 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 152 }] },
    },
    {
      id: 'aw-sr3', slug: 'harbor-light', exhibitionId: 'ex-sofia', artistId: 'a-sofia',
      title: 'Harbor Light', year: 2023,
      story: 'Morning boats dissolving into their own reflections; Sofia’s tribute to the fishing town she grew up in.', access: 'public', order: 17,
      placeholder: { seed: 403, palette: ["#219ebc","#ffb703","#8ecae6","#023047"], dims: [2.2, 1.5] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 51 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 85 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 136 }] },
    },
    {
      id: 'aw-sr4', slug: 'sunday-orchard', exhibitionId: 'ex-sofia', artistId: 'a-sofia',
      title: 'Sunday Orchard', year: 2025,
      story: 'Apple trees in soft afternoon light, the kind of quiet that only exists on Sundays.', access: 'public', order: 18,
      placeholder: { seed: 404, palette: ["#ccd5ae","#e9edc9","#d4a373","#faedcd"], dims: [1.5, 2] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 54 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 90 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 144 }] },
    },
    {
      id: 'aw-sr5', slug: 'lavender-mile', exhibitionId: 'ex-sofia', artistId: 'a-sofia',
      title: 'Lavender Mile', year: 2025,
      story: 'Rows of lavender running to the horizon — Exhibit III’s centerpiece and the museum’s best-selling print.', access: 'public', order: 19,
      placeholder: { seed: 405, palette: ["#7251b5","#9d4edd","#c77dff","#e0aaff"], dims: [2.2, 1.5] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 60 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 100 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 160 }] },
    },
    {
      id: 'aw-do1', slug: 'single-breath', exhibitionId: 'ex-david', artistId: 'a-david',
      title: 'Single Breath', year: 2024,
      story: 'One unbroken line drawn in a single exhale — the piece the whole series is named for.', access: 'public', order: 20,
      placeholder: { seed: 501, palette: ["#1c1c1c","#c9a227"], dims: [1.5, 2] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 42 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 70 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 112 }] },
    },
    {
      id: 'aw-do2', slug: 'two-rivers', exhibitionId: 'ex-david', artistId: 'a-david',
      title: 'Two Rivers', year: 2024,
      story: 'Two lines that never quite touch, tracing parallel journeys across the page.', access: 'public', order: 21,
      placeholder: { seed: 502, palette: ["#1d3557","#e63946"], dims: [1.5, 2] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 42 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 70 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 112 }] },
    },
    {
      id: 'aw-do3', slug: 'the-long-way-home', exhibitionId: 'ex-david', artistId: 'a-david',
      title: 'The Long Way Home', year: 2023,
      story: 'A wandering route that doubles back on itself — drawn from memory of a childhood walk.', access: 'public', order: 22,
      placeholder: { seed: 503, palette: ["#2b2d42","#ef8354"], dims: [2.2, 1.5] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 39 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 65 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 104 }] },
    },
    {
      id: 'aw-do4', slug: 'meridian-line', exhibitionId: 'ex-david', artistId: 'a-david',
      title: 'Meridian Line', year: 2025,
      story: 'The stillest work in the room: one nearly-straight line, and everything it takes to hold it.', access: 'public', order: 23,
      placeholder: { seed: 504, palette: ["#0b132b","#3a86ff"], dims: [1.5, 2] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 45 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 75 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 120 }] },
    },
    {
      id: 'aw-do5', slug: 'falling-quietly', exhibitionId: 'ex-david', artistId: 'a-david',
      title: 'Falling Quietly', year: 2025,
      story: 'A line descending the full height of the sheet in slow loops — Exhibit IV’s centerpiece.', access: 'public', order: 24,
      placeholder: { seed: 505, palette: ["#212529","#adb5bd"], dims: [1.5, 2] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 48 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 80 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 128 }] },
    },
    {
      id: 'aw-do6', slug: 'the-museum-cat', exhibitionId: 'ex-david', artistId: 'a-david',
      title: 'The Museum Cat', year: 2026,
      story: 'Pixel, the museum’s resident cat, rendered entirely in keyboard characters. David insists this took longer than any of his ink pieces. The best-selling postcard in the gift shop.', access: 'public', order: 25,
      placeholder: { seed: 506, palette: ["#9aa5ad","#d9b64a"], style: 'ascii', dims: [1.3, 1.6] },
      commerce: { printsForSale: true, prints: [{ id: 'sm', label: 'Small — 12 × 16 in', price: 27 }, { id: 'md', label: 'Medium — 18 × 24 in', price: 45 }, { id: 'lg', label: 'Large — 24 × 36 in', price: 72 }] },
    },
  ],
  membershipTiers: [
    { id: 'free', name: 'Visitor', price: 0, interval: 'year', benefits: ['Public exhibits'], grants: ['public'] },
    { id: 'member', name: 'Member', price: 60, interval: 'year', benefits: ['Public + member exhibits', 'Newsletter'], grants: ['public', 'member'] },
    { id: 'premium', name: 'Premium', price: 150, interval: 'year', benefits: ['Members’ Hall', 'Early access', 'Private artist stories', 'Member events'], grants: ['public', 'member', 'premium'] },
  ],
})
