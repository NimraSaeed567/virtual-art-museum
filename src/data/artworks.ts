export type ArtStyle = 'colorField' | 'geometric' | 'impressionist' | 'lineArt' | 'expressionist' | 'ascii'

export type Artist = {
  id: string
  name: string
  style: ArtStyle
  tagline: string
  bio: string
  gallery: string // display name of their room
}

export type Artwork = {
  id: string
  artistId: string
  title: string
  year: number
  desc: string
  base: number // price of the medium print, USD
  dims: [number, number] // world units, [width, height]
  seed: number
  palette: string[]
  style?: ArtStyle // overrides the artist's default style
  exclusive?: boolean // shown only in the Gold Membership wing
}

export const PRINT_SIZES = [
  { id: 'sm', label: 'Small — 12 × 16 in', mult: 0.6 },
  { id: 'md', label: 'Medium — 18 × 24 in', mult: 1 },
  { id: 'lg', label: 'Large — 24 × 36 in', mult: 1.6 },
] as const

export const ARTIST_SHARE = 0.5 // 50% of every sale goes to the artist

export const ARTISTS: Artist[] = [
  {
    id: 'elena',
    name: 'Elena Volkov',
    style: 'expressionist',
    tagline: 'Bold color in motion',
    bio: 'Elena paints fast, physical canvases where color behaves like weather. Her Chromatic Storm series anchors the museum’s Main Hall.',
    gallery: 'Main Hall',
  },
  {
    id: 'aurora',
    name: 'Aurora Chen',
    style: 'colorField',
    tagline: 'Meditations on light and horizon',
    bio: 'Aurora’s color-field paintings are slow, breathing gradients — studies of dawn, dusk and open water reduced to pure atmosphere.',
    gallery: 'Gallery I',
  },
  {
    id: 'marcus',
    name: 'Marcus Webb',
    style: 'geometric',
    tagline: 'Structure, rhythm, city',
    bio: 'Marcus builds crisp geometric compositions inspired by street grids and transit maps — order with just enough surprise.',
    gallery: 'Gallery II',
  },
  {
    id: 'sofia',
    name: 'Sofia Reyes',
    style: 'impressionist',
    tagline: 'Light studies in a thousand strokes',
    bio: 'Sofia works outdoors in short sessions, catching fields, harbors and orchards in dense flurries of broken color.',
    gallery: 'Gallery III',
  },
  {
    id: 'david',
    name: 'David Okafor',
    style: 'lineArt',
    tagline: 'One line, held breath',
    bio: 'David draws continuous-line meditations in ink — each piece a single unbroken gesture, spare and quiet.',
    gallery: 'Gallery IV',
  },
]

export const ARTWORKS: Artwork[] = [
  // ---- Elena Volkov — Main Hall (expressionist) ----
  { id: 'ev1', artistId: 'elena', title: 'Chromatic Storm I', year: 2024, base: 145, dims: [2.3, 1.7], seed: 101, palette: ['#e63946', '#f4a261', '#2a9d8f', '#e9c46a'], desc: 'The first of the storm series — a front of warm color colliding with cold teal, painted in a single afternoon.' },
  { id: 'ev2', artistId: 'elena', title: 'Chromatic Storm II', year: 2024, base: 145, dims: [2.3, 1.7], seed: 102, palette: ['#8338ec', '#ff006e', '#3a86ff', '#ffbe0b'], desc: 'Storm II turns electric — violet and magenta arcs cut by cobalt, the most kinetic piece in the hall.' },
  { id: 'ev3', artistId: 'elena', title: 'Ember', year: 2023, base: 130, dims: [2.3, 1.7], seed: 103, palette: ['#d00000', '#ffba08', '#f48c06', '#6a040f'], desc: 'A quieter piece: banked fire under a dark field, strokes layered until the surface seems to glow from inside.' },
  { id: 'ev4', artistId: 'elena', title: 'North Light', year: 2025, base: 160, dims: [2.3, 1.7], seed: 104, palette: ['#06d6a0', '#118ab2', '#83c5be', '#edf6f9'], desc: 'Painted after a winter residency — aurora greens and glacial blues sweeping across a near-black ground.' },
  { id: 'ev-ex', artistId: 'elena', title: 'The Last Storm', year: 2026, base: 460, dims: [2.8, 2.1], seed: 109, palette: ['#d4af37', '#8338ec', '#ff006e', '#1b1035'], exclusive: true, desc: 'The largest canvas Elena has painted, gold leaf worked straight into the storm front — made for the Grand Salon’s finale wall and nowhere else.' },

  // ---- Aurora Chen — Gallery I (color field) ----
  { id: 'ac1', artistId: 'aurora', title: 'Dawn Meridian', year: 2024, base: 95, dims: [1.5, 2.0], seed: 201, palette: ['#f2c14e', '#e8846b', '#7b4b94', '#2e2d4d'], desc: 'Four bands of first light — amber lifting out of violet dark, the horizon implied rather than drawn.' },
  { id: 'ac2', artistId: 'aurora', title: 'Sea Glass', year: 2024, base: 90, dims: [1.5, 2.0], seed: 202, palette: ['#8ecae6', '#219ebc', '#126782', '#023047'], desc: 'Cool blues stacked like water at depth, softened until the edges dissolve completely.' },
  { id: 'ac3', artistId: 'aurora', title: 'Amber Hour', year: 2023, base: 85, dims: [1.5, 2.0], seed: 203, palette: ['#ffb703', '#fd9e02', '#e85d04', '#6a040f'], desc: 'The last twenty minutes of an October evening compressed into slow gradients of heat.' },
  { id: 'ac4', artistId: 'aurora', title: 'Night Swim', year: 2025, base: 110, dims: [1.5, 2.0], seed: 204, palette: ['#0d1b2a', '#1b263b', '#415a77', '#778da9'], desc: 'Blue-black water under blue-black sky — Aurora’s darkest and most requested piece.' },
  { id: 'ac5', artistId: 'aurora', title: 'Quiet Horizon', year: 2025, base: 105, dims: [2.2, 1.5], seed: 205, palette: ['#cdb4db', '#ffc8dd', '#bde0fe', '#a2d2ff'], desc: 'A pale, weightless field painted in thin veils of lavender and sky — the centerpiece of Gallery I.' },
  { id: 'ac-ex', artistId: 'aurora', title: 'Golden Meridian', year: 2026, base: 340, dims: [1.8, 2.4], seed: 209, palette: ['#f9d976', '#f39f5a', '#7b4b94', '#1b1035'], exclusive: true, desc: 'Painted exclusively for the Grand Salon — a wider, slower gradient than anything else in the collection, gold leaf worked into the horizon line itself.' },

  // ---- Marcus Webb — Gallery II (geometric) ----
  { id: 'mw1', artistId: 'marcus', title: 'Grid Study No. 7', year: 2024, base: 80, dims: [1.5, 2.0], seed: 301, palette: ['#d32f2f', '#1565c0', '#f9a825'], desc: 'The seventh in an ongoing series of balanced asymmetries — primary color held in a black lattice.' },
  { id: 'mw2', artistId: 'marcus', title: 'Interchange', year: 2024, base: 85, dims: [1.5, 2.0], seed: 302, palette: ['#e07a5f', '#3d405b', '#81b29a'], desc: 'Named for a highway junction seen from the air; terracotta and sage negotiating right angles.' },
  { id: 'mw3', artistId: 'marcus', title: 'Signal Red', year: 2023, base: 75, dims: [1.5, 2.0], seed: 303, palette: ['#d90429', '#2b2d42', '#8d99ae'], desc: 'One dominant red field, precisely offset — the piece that first got Marcus collected.' },
  { id: 'mw4', artistId: 'marcus', title: 'Composition in Blue', year: 2025, base: 90, dims: [1.5, 2.0], seed: 304, palette: ['#0466c8', '#0353a4', '#023e7d', '#ffd60a'], desc: 'Three blues and a single bar of yellow; restraint as its own kind of drama.' },
  { id: 'mw5', artistId: 'marcus', title: 'City Block', year: 2025, base: 95, dims: [2.2, 1.5], seed: 305, palette: ['#ef476f', '#ffd166', '#06d6a0', '#118ab2'], desc: 'A wide, playful map of an imagined neighborhood — Gallery II’s centerpiece.' },
  { id: 'mw-ex', artistId: 'marcus', title: 'Gold Standard', year: 2026, base: 380, dims: [2.0, 2.6], seed: 309, palette: ['#d4af37', '#1a1a1a', '#0466c8', '#8d99ae'], exclusive: true, desc: 'Commissioned for the Grand Salon — the black lattice rebuilt in true gold leaf over lacquer, a one-off Marcus has refused to reprint anywhere else.' },

  // ---- Sofia Reyes — Gallery III (impressionist) ----
  { id: 'sr1', artistId: 'sofia', title: 'Field at Noon', year: 2024, base: 90, dims: [2.2, 1.5], seed: 401, palette: ['#606c38', '#283618', '#fefae0', '#dda15e'], desc: 'High summer heat in broken strokes of olive and wheat, painted in a single two-hour session.' },
  { id: 'sr2', artistId: 'sofia', title: 'Poppies After Rain', year: 2024, base: 95, dims: [1.5, 2.0], seed: 402, palette: ['#bc4749', '#a7c957', '#6a994e', '#f2e8cf'], desc: 'Wet red blooms against washed green — the rain had barely stopped when she started.' },
  { id: 'sr3', artistId: 'sofia', title: 'Harbor Light', year: 2023, base: 85, dims: [2.2, 1.5], seed: 403, palette: ['#219ebc', '#ffb703', '#8ecae6', '#023047'], desc: 'Morning boats dissolving into their own reflections; Sofia’s tribute to the fishing town she grew up in.' },
  { id: 'sr4', artistId: 'sofia', title: 'Sunday Orchard', year: 2025, base: 90, dims: [1.5, 2.0], seed: 404, palette: ['#ccd5ae', '#e9edc9', '#d4a373', '#faedcd'], desc: 'Apple trees in soft afternoon light, the kind of quiet that only exists on Sundays.' },
  { id: 'sr5', artistId: 'sofia', title: 'Lavender Mile', year: 2025, base: 100, dims: [2.2, 1.5], seed: 405, palette: ['#7251b5', '#9d4edd', '#c77dff', '#e0aaff'], desc: 'Rows of lavender running to the horizon — Gallery III’s centerpiece and the museum’s best-selling print.' },
  { id: 'sr-ex', artistId: 'sofia', title: 'Golden Hour, Twice', year: 2026, base: 360, dims: [2.4, 1.7], seed: 409, palette: ['#ffd166', '#e85d04', '#6a994e', '#2b2118'], exclusive: true, desc: 'Two sunsets from the same orchard, a year apart, painted over each other until only the gold survived — the Grand Salon’s only piece she describes as "finished."' },

  // ---- David Okafor — Gallery IV (line art) ----
  { id: 'do1', artistId: 'david', title: 'Single Breath', year: 2024, base: 70, dims: [1.5, 2.0], seed: 501, palette: ['#1c1c1c', '#c9a227'], desc: 'One unbroken line drawn in a single exhale — the piece the whole series is named for.' },
  { id: 'do2', artistId: 'david', title: 'Two Rivers', year: 2024, base: 70, dims: [1.5, 2.0], seed: 502, palette: ['#1d3557', '#e63946'], desc: 'Two lines that never quite touch, tracing parallel journeys across the page.' },
  { id: 'do3', artistId: 'david', title: 'The Long Way Home', year: 2023, base: 65, dims: [2.2, 1.5], seed: 503, palette: ['#2b2d42', '#ef8354'], desc: 'A wandering route that doubles back on itself — drawn from memory of a childhood walk.' },
  { id: 'do4', artistId: 'david', title: 'Meridian Line', year: 2025, base: 75, dims: [1.5, 2.0], seed: 504, palette: ['#0b132b', '#3a86ff'], desc: 'The stillest work in the room: one nearly-straight line, and everything it takes to hold it.' },
  { id: 'do5', artistId: 'david', title: 'Falling Quietly', year: 2025, base: 80, dims: [1.5, 2.0], seed: 505, palette: ['#212529', '#adb5bd'], desc: 'A line descending the full height of the sheet in slow loops — Gallery IV’s centerpiece.' },
  { id: 'do6', artistId: 'david', title: 'The Museum Cat', year: 2026, base: 45, dims: [1.3, 1.6], seed: 506, palette: ['#9aa5ad', '#d9b64a'], style: 'ascii', desc: 'Pixel, the museum’s resident cat, rendered entirely in keyboard characters. David insists this took longer than any of his ink pieces. The best-selling postcard in the gift shop.' },
  { id: 'do-ex', artistId: 'david', title: 'The Unbroken Line', year: 2026, base: 420, dims: [1.6, 2.6], seed: 509, palette: ['#0b0b0b', '#d4af37'], exclusive: true, desc: 'The longest single line David has ever drawn, laid in gold ink instead of black — made for the Grand Salon and, he says, never to be repeated.' },

  // ---- Grand Salon waypoint pieces — a small pair, one per wall, at a
  // handful of spots along the promenade to break up the walk ----
  { id: 'ac-niche', artistId: 'aurora', title: 'Afterglow Study', year: 2025, base: 150, dims: [1.0, 1.3], seed: 601, palette: ['#f2c14e', '#7b4b94', '#2e2d4d'], desc: 'A small study Aurora kept for herself for a year before letting the Grand Salon have it — the same dawn light, held closer.' },
  { id: 'ac-niche2', artistId: 'aurora', title: 'Horizon, Repeated', year: 2025, base: 145, dims: [1.0, 1.3], seed: 611, palette: ['#8ecae6', '#e8846b', '#2e2d4d'], desc: 'The same horizon painted twice from memory, hung side by side by side across the Salon on purpose.' },
  { id: 'mw-niche', artistId: 'marcus', title: 'Junction, Detail', year: 2025, base: 140, dims: [1.0, 1.3], seed: 602, palette: ['#d32f2f', '#0466c8', '#f9a825'], desc: 'A tighter crop of the grid, blown up until the intersections read like architecture.' },
  { id: 'mw-niche2', artistId: 'marcus', title: 'Grid, Close', year: 2025, base: 140, dims: [1.0, 1.3], seed: 612, palette: ['#0466c8', '#ffd60a', '#2b2d42'], desc: 'One intersection from Grid Study No. 7, magnified until it stops looking geometric at all.' },
  { id: 'sr-niche', artistId: 'sofia', title: 'Orchard, Late Light', year: 2025, base: 135, dims: [1.0, 1.3], seed: 603, palette: ['#dda15e', '#606c38', '#fefae0'], desc: 'Painted in the last ten minutes before the light went — Sofia calls it the fastest piece she owns.' },
  { id: 'sr-niche2', artistId: 'sofia', title: 'Harbor, Again', year: 2025, base: 135, dims: [1.0, 1.3], seed: 613, palette: ['#219ebc', '#ffb703', '#023047'], desc: 'A second, smaller take on Harbor Light — Sofia says she can’t stop painting that particular morning.' },
]

export function getArt(id: string): Artwork {
  return ARTWORKS.find((a) => a.id === id)!
}

export function getArtist(id: string): Artist {
  return ARTISTS.find((a) => a.id === id)!
}

export function byArtist(artistId: string): Artwork[] {
  return ARTWORKS.filter((a) => a.artistId === artistId && !a.exclusive)
}

/** The one Gold-Membership-only piece for an artist, if they have one. */
export function exclusiveFor(artistId: string): Artwork | undefined {
  return ARTWORKS.find((a) => a.artistId === artistId && a.exclusive)
}

export function priceFor(art: Artwork, sizeId: string): number {
  const size = PRINT_SIZES.find((s) => s.id === sizeId)!
  return Math.round(art.base * size.mult)
}
