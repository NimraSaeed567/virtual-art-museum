import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { SAMPLE_MUSEUM, type Artwork } from './data/museum'

// Set by Player once controls mount; lets DOM overlays lock/unlock the pointer.
export const controlsRef: { current: { lock: () => void; unlock: () => void } | null } = {
  current: null,
}

// Mutable per-frame player state, read by the DOM minimap via rAF (bypasses React).
export const playerState = { x: 0, z: 5, yaw: 0 }

export type CartItem = { artId: string; sizeId: string; qty: number }
export type Membership = 'normal' | 'gold'

export interface ToastNotification {
  id: string
  message: string
  type?: 'info' | 'success' | 'warning'
}

export interface DynamicArtwork {
  id: string
  title: string
  artistId: string
  artistName: string
  image_url?: string
  medium?: string
  year?: number
  room_id: string
  exhibition_id?: string
  submission_id: string
  price_small?: number
  price_medium?: number
  price_large?: number
  description?: string
}

type State = {
  entered: boolean
  membership: Membership | null
  locked: boolean
  room: string
  hoveredId: string | null
  modalId: string | null
  cartOpen: boolean
  checkedOut: boolean
  cart: CartItem[]
  // artId -> collector name, for the "your name on the plaque" credit —
  // session-only, cleared when you leave the museum.
  collectors: Record<string, string>
  lastPurchased: CartItem[]
  session: Session | null
  user: User | null
  isAdmin: boolean
  authInitialized: boolean
  dynamicArtworks: DynamicArtwork[]
  notifications: ToastNotification[]
  enter: () => void
  setMembership: (m: Membership) => void
  leave: () => void
  resume: () => void
  setLocked: (v: boolean) => void
  setRoom: (v: string) => void
  setHovered: (v: string | null) => void
  openModal: (id: string) => void
  openCart: () => void
  addToCart: (artId: string, sizeId: string) => void
  setQty: (artId: string, sizeId: string, qty: number) => void
  checkout: (collectorName: string) => void
  setAuth: (session: Session | null) => void
  initializeAuth: () => void
  addNotification: (msg: string, type?: ToastNotification['type']) => void
  dismissNotification: (id: string) => void
  loadDynamicArtworks: () => Promise<void>
}

export const useStore = create<State>((set, get) => ({
  entered: false,
  membership: null,
  locked: false,
  room: '',
  hoveredId: null,
  modalId: null,
  cartOpen: false,
  checkedOut: false,
  cart: [],
  collectors: {},
  lastPurchased: [],
  session: null,
  user: null,
  isAdmin: false,
  authInitialized: false,
  dynamicArtworks: [],
  notifications: [],

  // Mount the 3D museum. The membership gate decides the hall; pointer lock
  // happens on the follow-up "click to explore" gate (PauseOverlay), since
  // the canvas only mounts once a tier is chosen.
  enter: () => set({ entered: true, locked: false }),

  setMembership: (m) => set({ membership: m }),

  // Tear down the 3D museum and return to the marketing homepage.
  leave: () => {
    controlsRef.current?.unlock()
    if (document.pointerLockElement) document.exitPointerLock()
    set({
      entered: false,
      membership: null,
      locked: false,
      modalId: null,
      cartOpen: false,
      checkedOut: false,
      collectors: {},
      lastPurchased: [],
    })
  },

  resume: () => {
    set({ modalId: null, cartOpen: false, checkedOut: false })
    controlsRef.current?.lock()
  },

  setLocked: (v) => set({ locked: v }),

  setRoom: (v) => {
    if (get().room !== v) set({ room: v })
  },

  setHovered: (v) => {
    if (get().hoveredId !== v) set({ hoveredId: v })
  },

  openModal: (id) => {
    set({ modalId: id, hoveredId: null })
    controlsRef.current?.unlock()
  },

  openCart: () => set({ cartOpen: true, modalId: null, checkedOut: false }),

  addToCart: (artId, sizeId) =>
    set((s) => {
      const found = s.cart.find((c) => c.artId === artId && c.sizeId === sizeId)
      const cart = found
        ? s.cart.map((c) => (c === found ? { ...c, qty: c.qty + 1 } : c))
        : [...s.cart, { artId, sizeId, qty: 1 }]
      return { cart }
    }),

  setQty: (artId, sizeId, qty) =>
    set((s) => ({
      cart:
        qty <= 0
          ? s.cart.filter((c) => !(c.artId === artId && c.sizeId === sizeId))
          : s.cart.map((c) =>
              c.artId === artId && c.sizeId === sizeId ? { ...c, qty } : c,
            ),
    })),

  checkout: (collectorName) =>
    set((s) => {
      const name = collectorName.trim()
      const collectors = name ? { ...s.collectors } : s.collectors
      if (name) for (const item of s.cart) collectors[item.artId] = name
      return { cart: [], checkedOut: true, collectors, lastPurchased: s.cart }
    }),

  setAuth: (session) => set({ session, user: session?.user ?? null }),

  addNotification: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ notifications: [...s.notifications.slice(-2), { id, message, type }] }))
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }))
    }, 5000)
  },

  dismissNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  loadDynamicArtworks: async () => {
    const { data, error } = await supabase
      .from('published_artworks')
      .select(`
        id,
        room_id,
        exhibition_id,
        submission_id,
        artwork_submissions (
          title, medium, year, description, image_url,
          price_small, price_medium, price_large, artist_id
        ),
        profiles:artist_id (
          full_name
        )
      `)
    if (error || !data) return
    const mapped: DynamicArtwork[] = (data as any[]).map((row) => ({
      id: `dynamic-${row.id}`,
      title: row.artwork_submissions?.title ?? 'Untitled',
      artistId: row.artwork_submissions?.artist_id ?? '',
      artistName: row.profiles?.full_name ?? 'Unknown Artist',
      image_url: row.artwork_submissions?.image_url,
      medium: row.artwork_submissions?.medium,
      year: row.artwork_submissions?.year,
      room_id: row.room_id,
      exhibition_id: row.exhibition_id,
      submission_id: row.submission_id,
      price_small: row.artwork_submissions?.price_small,
      price_medium: row.artwork_submissions?.price_medium,
      price_large: row.artwork_submissions?.price_large,
      description: row.artwork_submissions?.description,
    }))
    set({ dynamicArtworks: mapped })

    // Inject into the static museum data so non-React components (like proceduralArt.ts) can see them
    const existingIds = new Set(SAMPLE_MUSEUM.artworks.map((a: any) => a.id))
    mapped.forEach(da => {
      if (!existingIds.has(da.id)) {
        const art: Artwork = {
          id: da.id,
          slug: da.id,
          artistId: da.artistId,
          exhibitionId: da.exhibition_id ?? '',
          title: da.title,
          year: da.year ?? new Date().getFullYear(),
          story: da.description,
          access: 'public',
          order: 999,
          placeholder: {
            seed: parseInt(da.id.replace(/\D/g, '').slice(0, 5)) || Math.floor(Math.random() * 10000),
            palette: ["#111111", "#333333", "#666666", "#999999"],
            dims: [2, 2]
          }
        }
        // Attach real image for procedural generation fallback override
        ;(art as any).image_url = da.image_url

        if (da.price_small || da.price_medium || da.price_large) {
          art.commerce = { printsForSale: true, prints: [] }
          if (da.price_small) art.commerce.prints.push({ id: 'sm', label: 'Small', price: da.price_small })
          if (da.price_medium) art.commerce.prints.push({ id: 'md', label: 'Medium', price: da.price_medium })
          if (da.price_large) art.commerce.prints.push({ id: 'lg', label: 'Large', price: da.price_large })
        }

        SAMPLE_MUSEUM.artworks.push(art)
      }
    })
  },

  initializeAuth: () => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null
      let isAdmin = false
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        isAdmin = data?.is_admin ?? false
      }
      set({ session, user, isAdmin, authInitialized: true })
      get().loadDynamicArtworks()
    })
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      let isAdmin = false
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        isAdmin = data?.is_admin ?? false
      }
      set({ session, user, isAdmin })
    })
  },
}))
