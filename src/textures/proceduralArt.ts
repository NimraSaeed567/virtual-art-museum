import * as THREE from 'three'
import type { Artwork } from '../data/artworks'
import { ARTISTS, ARTWORKS, getArtist } from '../data/artworks'
import type { Artwork as MuseumArtwork } from '../data/museum'
import { SAMPLE_MUSEUM, artistById } from '../data/museum'

// Artwork can come from either the static 3D-museum dataset (flat dims/seed/
// palette/style) or the dynamic Supabase-backed dataset (nested under
// `placeholder`, with an optional real `image_url`). Both are accepted here.
type AnyArtwork = Artwork | MuseumArtwork

// ---------------------------------------------------------------------------
// Procedurally generated placeholder art. Every painting, plaque and banner in
// the museum is drawn to an offscreen canvas at runtime — zero image assets.
// In production these become high-res photos of the real artworks.
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Rng = () => number
type Ctx = CanvasRenderingContext2D

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, (n >> 16) + amt))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt))
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt))
  return `rgb(${r},${g},${b})`
}

function grain(ctx: Ctx, w: number, h: number, rng: Rng) {
  for (let i = 0; i < 1400; i++) {
    const l = rng() > 0.5
    ctx.fillStyle = l ? `rgba(255,255,255,${rng() * 0.04})` : `rgba(0,0,0,${rng() * 0.05})`
    ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1 + rng() * 2)
  }
  // vignette
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.16)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

// ---- style generators -----------------------------------------------------

function colorField(ctx: Ctx, w: number, h: number, rng: Rng, pal: string[]) {
  ctx.fillStyle = pal[pal.length - 1]
  ctx.fillRect(0, 0, w, h)
  const bands = 3 + Math.floor(rng() * 2)
  let y = 0
  for (let i = 0; i < bands; i++) {
    const bh = (h / bands) * (0.7 + rng() * 0.6)
    const c = pal[i % pal.length]
    const g = ctx.createLinearGradient(0, y - bh * 0.3, 0, y + bh * 1.3)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(0.5, c)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, Math.max(0, y - bh * 0.3), w, bh * 1.6)
    y += bh
  }
  // soft haze passes
  for (let i = 0; i < 5; i++) {
    const c = pal[Math.floor(rng() * pal.length)]
    ctx.globalAlpha = 0.08 + rng() * 0.08
    ctx.fillStyle = c
    const hy = rng() * h
    ctx.fillRect(0, hy, w, h * (0.1 + rng() * 0.25))
  }
  ctx.globalAlpha = 1
}

function geometric(ctx: Ctx, w: number, h: number, rng: Rng, pal: string[]) {
  ctx.fillStyle = '#f4f1ea'
  ctx.fillRect(0, 0, w, h)
  const xs = [0, ...Array.from({ length: 3 }, () => Math.round(rng() * w)), w].sort((a, b) => a - b)
  const ys = [0, ...Array.from({ length: 3 }, () => Math.round(rng() * h)), h].sort((a, b) => a - b)
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      if (rng() < 0.3) {
        ctx.fillStyle = pal[Math.floor(rng() * pal.length)]
        ctx.fillRect(xs[i], ys[j], xs[i + 1] - xs[i], ys[j + 1] - ys[j])
      }
    }
  }
  ctx.fillStyle = '#141414'
  const lw = Math.max(8, w * 0.02)
  for (let i = 1; i < xs.length - 1; i++) ctx.fillRect(xs[i] - lw / 2, 0, lw, h)
  for (let j = 1; j < ys.length - 1; j++) ctx.fillRect(0, ys[j] - lw / 2, w, lw)
}

function impressionist(ctx: Ctx, w: number, h: number, rng: Rng, pal: string[]) {
  const horizon = h * (0.3 + rng() * 0.2)
  const sky = ctx.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, shade(pal[3] ?? pal[0], 70))
  sky.addColorStop(1, shade(pal[3] ?? pal[0], 110))
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, horizon)
  const ground = ctx.createLinearGradient(0, horizon, 0, h)
  ground.addColorStop(0, shade(pal[0], 40))
  ground.addColorStop(1, shade(pal[1], -20))
  ctx.fillStyle = ground
  ctx.fillRect(0, horizon, w, h - horizon)
  // sun
  ctx.globalAlpha = 0.5
  ctx.fillStyle = '#fff3c4'
  ctx.beginPath()
  ctx.arc(w * (0.25 + rng() * 0.5), horizon * (0.3 + rng() * 0.4), w * 0.06, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  // dabs
  for (let i = 0; i < 2200; i++) {
    const y = rng() * h
    const nearGround = y > horizon
    const c = pal[Math.floor(rng() * pal.length)]
    ctx.strokeStyle = shade(c, Math.round((rng() - 0.5) * 60))
    ctx.globalAlpha = 0.25 + rng() * 0.45
    ctx.lineWidth = 2 + rng() * (nearGround ? 5 : 3)
    const x = rng() * w
    const len = 4 + rng() * (nearGround ? 14 : 8)
    const ang = nearGround ? (rng() - 0.5) * 0.6 : (rng() - 0.5) * 0.25
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function lineArt(ctx: Ctx, w: number, h: number, rng: Rng, pal: string[]) {
  ctx.fillStyle = '#f6f2e8'
  ctx.fillRect(0, 0, w, h)
  // one accent shape
  ctx.fillStyle = pal[1] ?? '#c9a227'
  ctx.globalAlpha = 0.85
  ctx.beginPath()
  ctx.arc(w * (0.25 + rng() * 0.5), h * (0.2 + rng() * 0.5), w * (0.05 + rng() * 0.08), 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  // flowing continuous lines
  ctx.strokeStyle = pal[0]
  ctx.lineCap = 'round'
  const lines = 1 + Math.floor(rng() * 2)
  for (let l = 0; l < lines; l++) {
    ctx.lineWidth = 3 + rng() * 3
    ctx.beginPath()
    let x = w * 0.08
    let y = h * (0.15 + rng() * 0.7)
    ctx.moveTo(x, y)
    const steps = 5 + Math.floor(rng() * 4)
    for (let s = 0; s < steps; s++) {
      const nx = x + (w * 0.84) / steps
      const ny = h * (0.1 + rng() * 0.8)
      const cx1 = x + (nx - x) * 0.4
      const cy1 = y + (rng() - 0.5) * h * 0.5
      const cx2 = x + (nx - x) * 0.6
      const cy2 = ny + (rng() - 0.5) * h * 0.5
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, nx, ny)
      x = nx
      y = ny
    }
    ctx.stroke()
  }
}

function expressionist(ctx: Ctx, w: number, h: number, rng: Rng, pal: string[]) {
  ctx.fillStyle = '#14121a'
  ctx.fillRect(0, 0, w, h)
  ctx.lineCap = 'round'
  for (let i = 0; i < 26; i++) {
    const c = pal[Math.floor(rng() * pal.length)]
    ctx.strokeStyle = shade(c, Math.round((rng() - 0.5) * 50))
    ctx.globalAlpha = 0.55 + rng() * 0.4
    ctx.lineWidth = 10 + rng() * 34
    const x = rng() * w
    const y = rng() * h
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(
      x + (rng() - 0.5) * w * 0.9,
      y + (rng() - 0.5) * h * 0.9,
      x + (rng() - 0.5) * w * 1.2,
      y + (rng() - 0.5) * h * 1.2,
    )
    ctx.stroke()
  }
  // splatter
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = pal[Math.floor(rng() * pal.length)]
    ctx.globalAlpha = 0.4 + rng() * 0.5
    ctx.beginPath()
    ctx.arc(rng() * w, rng() * h, 1 + rng() * 5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

const ASCII_CAT = [
  '      /\\_____/\\',
  '     /  o   o  \\',
  ' ===( ==  ^  == )===',
  '     )         (',
  '    (           )',
  '   ( (  )   (  ) )',
  '  (__(__)___(__)__)',
  '',
  '   p i x e l . e x e',
]

function ascii(ctx: Ctx, w: number, h: number, rng: Rng, pal: string[]) {
  // terminal-dark ground
  ctx.fillStyle = '#0c0f12'
  ctx.fillRect(0, 0, w, h)
  // faint scanlines
  ctx.fillStyle = 'rgba(255,255,255,0.025)'
  for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2)

  const maxLen = Math.max(...ASCII_CAT.map((l) => l.length))
  const fontSize = Math.min((h * 0.7) / ASCII_CAT.length, (w * 0.92) / (maxLen * 0.62))
  ctx.font = `bold ${Math.floor(fontSize)}px "Courier New", monospace`
  ctx.textBaseline = 'middle'
  const charW = ctx.measureText('M').width
  const lineH = fontSize * 1.15
  const y0 = h / 2 - (ASCII_CAT.length - 1) * lineH * 0.5

  ASCII_CAT.forEach((line, li) => {
    const x0 = w / 2 - (line.length * charW) / 2
    for (let ci = 0; ci < line.length; ci++) {
      const ch = line[ci]
      if (ch === ' ') continue
      // gold eyes and nose, soft gray for everything else
      ctx.fillStyle = ch === 'o' || ch === '^' ? pal[1] ?? '#d9b64a' : pal[0] ?? '#9aa5ad'
      // characters flicker very slightly in brightness, like a real terminal
      ctx.globalAlpha = 0.82 + rng() * 0.18
      ctx.fillText(ch, x0 + ci * charW + charW / 2 - charW * 0.3, y0 + li * lineH)
    }
  })
  ctx.globalAlpha = 1
  // phosphor glow pass
  ctx.globalCompositeOperation = 'lighter'
  ctx.filter = 'blur(6px)'
  ctx.globalAlpha = 0.22
  ctx.drawImage(ctx.canvas, 0, 0)
  ctx.filter = 'none'
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
}

const GENERATORS = { colorField, geometric, impressionist, lineArt, expressionist, ascii }

// ---- caches ---------------------------------------------------------------

type ArtEntry = { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; dataUrl?: string }
const artCache = new Map<string, ArtEntry>()

function makeArtEntry(art: AnyArtwork): ArtEntry {
  const placeholder = (art as MuseumArtwork).placeholder
  const [dw, dh] = placeholder ? placeholder.dims : (art as Artwork).dims
  const w = 640
  const h = Math.round((640 * dh) / dw)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  const imageUrl = (art as any).image_url
  if (imageUrl) {
    ctx.fillStyle = '#222'
    ctx.fillRect(0, 0, w, h)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h)
      texture.needsUpdate = true
    }
    img.src = imageUrl
  } else {
    const rng = mulberry32(placeholder ? placeholder.seed : (art as Artwork).seed)
    const palette = placeholder ? placeholder.palette : (art as Artwork).palette
    const style =
      (placeholder?.style as keyof typeof GENERATORS | undefined) ??
      (art as Artwork).style ??
      (placeholder
        ? artistById(SAMPLE_MUSEUM, art.artistId)?.defaultStyle
        : getArtist(art.artistId).style)
    GENERATORS[style as keyof typeof GENERATORS](ctx, w, h, rng, palette)
    grain(ctx, w, h, rng)
  }

  return { canvas, texture }
}

export function getArtTexture(art: AnyArtwork): THREE.CanvasTexture {
  let e = artCache.get(art.id)
  if (!e) {
    e = makeArtEntry(art)
    artCache.set(art.id, e)
  }
  return e.texture
}

export function getArtCanvas(art: AnyArtwork): HTMLCanvasElement {
  let e = artCache.get(art.id)
  if (!e) {
    e = makeArtEntry(art)
    artCache.set(art.id, e)
  }
  return e.canvas
}

export function getArtDataUrl(art: AnyArtwork): string {
  let e = artCache.get(art.id)
  if (!e) {
    e = makeArtEntry(art)
    artCache.set(art.id, e)
  }
  if (!e.dataUrl) e.dataUrl = e.canvas.toDataURL('image/jpeg', 0.85)
  return e.dataUrl
}

// ---- plaques & banners ----------------------------------------------------

const labelCache = new Map<string, THREE.CanvasTexture>()

export function makePlaqueTexture(title: string, sub: string, sub2: string): THREE.CanvasTexture {
  const key = `plaque:${title}|${sub}|${sub2}`
  const hit = labelCache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 176
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#efe9dc'
  ctx.fillRect(0, 0, 512, 176)
  ctx.strokeStyle = '#b7a77f'
  ctx.lineWidth = 4
  ctx.strokeRect(6, 6, 500, 164)
  ctx.fillStyle = '#242018'
  ctx.textAlign = 'center'
  ctx.font = 'bold 40px Georgia, serif'
  ctx.fillText(title, 256, 62, 470)
  ctx.font = 'italic 26px Georgia, serif'
  ctx.fillStyle = '#4a4336'
  ctx.fillText(sub, 256, 105, 470)
  ctx.font = '24px Georgia, serif'
  ctx.fillStyle = '#7a6a45'
  ctx.fillText(sub2, 256, 144, 470)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  labelCache.set(key, tex)
  return tex
}

/** Brass credit tag mounted directly under a purchased piece's plaque —
 * sized to match the plaque's width so the two read as one fixture. */
export function makeCollectorPlaqueTexture(name: string): THREE.CanvasTexture {
  const key = `collector:${name}`
  const hit = labelCache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 140
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#2a2114'
  ctx.fillRect(0, 0, 512, 140)
  ctx.strokeStyle = '#d4af37'
  ctx.lineWidth = 4
  ctx.strokeRect(6, 6, 500, 128)
  ctx.textAlign = 'center'
  ctx.font = 'bold 26px Georgia, serif'
  ctx.fillStyle = '#d9c08f'
  ctx.fillText('COLLECTED BY', 256, 54, 480)
  ctx.font = 'bold italic 46px Georgia, serif'
  ctx.fillStyle = '#ffe9b0'
  ctx.fillText(name, 256, 104, 480)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  labelCache.set(key, tex)
  return tex
}

export function makeBannerTexture(text: string, sub?: string, light = false): THREE.CanvasTexture {
  const key = `banner:${text}|${sub ?? ''}|${light}`
  const hit = labelCache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 192
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 1024, 192)
  ctx.textAlign = 'center'
  ctx.fillStyle = light ? '#e9dcc0' : '#3a3226'
  ctx.font = 'bold 72px Georgia, serif'
  ctx.fillText(text, 512, sub ? 88 : 116, 990)
  if (sub) {
    ctx.font = 'italic 38px Georgia, serif'
    ctx.fillStyle = light ? '#c9ad6d' : '#8a7a55'
    ctx.fillText(sub, 512, 152, 990)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  labelCache.set(key, tex)
  return tex
}

// ---- hall decor -------------------------------------------------------------

const SKIN_TONES = ['#8d5524', '#c68642', '#e0ac69', '#5c3a21', '#7a4a2a']

const portraitCanvasCache = new Map<string, HTMLCanvasElement>()

/** Draw (and cache) an artist portrait to a canvas. */
function makePortraitCanvas(artistId: string): HTMLCanvasElement {
  const cached = portraitCanvasCache.get(artistId)
  if (cached) return cached
  const art0 = ARTWORKS.find((a) => a.artistId === artistId)!
  const pal = art0.palette
  const rng = mulberry32(art0.seed + 991)
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  // painterly background from the artist's own palette
  const bg = ctx.createLinearGradient(0, 0, 0, 256)
  bg.addColorStop(0, shade(pal[0], 70))
  bg.addColorStop(1, shade(pal[1] ?? pal[0], 20))
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = pal[Math.floor(rng() * pal.length)]
    ctx.globalAlpha = 0.14 + rng() * 0.12
    ctx.beginPath()
    ctx.arc(rng() * 256, rng() * 200, 30 + rng() * 60, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  // shoulders + head silhouette
  const skin = SKIN_TONES[Math.floor(rng() * SKIN_TONES.length)]
  ctx.fillStyle = shade(skin, -50)
  ctx.beginPath()
  ctx.ellipse(128, 268, 92, 82, 0, Math.PI, 0)
  ctx.fill()
  // collar accent in the artist's palette
  ctx.fillStyle = pal[0]
  ctx.beginPath()
  ctx.ellipse(128, 276, 60, 52, 0, Math.PI, 0)
  ctx.fill()
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.ellipse(128, 120, 47, 57, 0, 0, Math.PI * 2)
  ctx.fill()
  // hair
  ctx.fillStyle = shade('#2a1c10', Math.round(rng() * 40))
  ctx.beginPath()
  ctx.ellipse(128, 88, 50, 38, 0, Math.PI, 0, true)
  ctx.fill()
  grain(ctx, 256, 256, rng)
  portraitCanvasCache.set(artistId, canvas)
  return canvas
}

/** Semi-abstract painted portrait medallion for an artist. */
export function makePortraitTexture(artistId: string): THREE.CanvasTexture {
  const key = `portrait:${artistId}`
  const hit = labelCache.get(key)
  if (hit) return hit
  const tex = new THREE.CanvasTexture(makePortraitCanvas(artistId))
  tex.colorSpace = THREE.SRGBColorSpace
  labelCache.set(key, tex)
  return tex
}

/** Artist portrait as an <img>-ready data URL, for the landing page. */
export function getPortraitDataUrl(artistId: string): string {
  return makePortraitCanvas(artistId).toDataURL('image/jpeg', 0.85)
}

/** Framed floor plan of the museum for the hall wall. */
export function makeMapTexture(): THREE.CanvasTexture {
  const key = 'museum-map'
  const hit = labelCache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#efe7d2'
  ctx.fillRect(0, 0, 512, 512)
  ctx.strokeStyle = '#8a7a55'
  ctx.lineWidth = 3
  ctx.strokeRect(14, 14, 484, 484)
  ctx.strokeRect(22, 22, 468, 468)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#3a3226'
  ctx.font = 'bold 38px Georgia, serif'
  ctx.fillText('MUSEUM PLAN', 256, 64, 440)

  const s = 7 // world units → px
  const cx = 256
  const cy = 296
  const room = (x1: number, z1: number, x2: number, z2: number) => {
    ctx.fillStyle = 'rgba(168,144,90,0.22)'
    ctx.strokeStyle = '#5a4a32'
    ctx.lineWidth = 3
    ctx.fillRect(cx + x1 * s, cy + z1 * s, (x2 - x1) * s, (z2 - z1) * s)
    ctx.strokeRect(cx + x1 * s, cy + z1 * s, (x2 - x1) * s, (z2 - z1) * s)
  }
  room(-10, -10, 10, 10)
  room(-5, -24, 5, -10)
  room(-5, 10, 5, 24)
  room(10, -5, 24, 5)
  room(-24, -5, -10, 5)

  ctx.fillStyle = '#3a3226'
  ctx.font = 'bold 22px Georgia, serif'
  ctx.fillText('MAIN HALL', cx, cy + 2)
  ctx.font = 'italic 16px Georgia, serif'
  ctx.fillText(ARTISTS[0].name, cx, cy + 24)
  const wing = (label: string, name: string, x: number, y: number) => {
    ctx.font = 'bold 24px Georgia, serif'
    ctx.fillText(label, x, y)
    ctx.font = 'italic 14px Georgia, serif'
    ctx.fillText(name, x, y + 20)
  }
  wing('I', ARTISTS[1].name, cx, cy - 17 * s)
  wing('II', ARTISTS[2].name, cx + 17 * s, cy - 4)
  wing('III', ARTISTS[3].name, cx, cy + 16 * s)
  wing('IV', ARTISTS[4].name, cx - 17 * s, cy - 4)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  labelCache.set(key, tex)
  return tex
}

// ---- lighting fakes ---------------------------------------------------------

let washTex: THREE.CanvasTexture | null = null

/** Warm radial "spotlight wash" placed on the wall behind each artwork. */
export function makeWashTexture(): THREE.CanvasTexture {
  if (washTex) return washTex
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(128, 100, 10, 128, 118, 150)
  g.addColorStop(0, 'rgba(255,241,214,0.55)')
  g.addColorStop(0.55, 'rgba(255,236,200,0.22)')
  g.addColorStop(1, 'rgba(255,236,200,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  washTex = new THREE.CanvasTexture(canvas)
  washTex.colorSpace = THREE.SRGBColorSpace
  return washTex
}

let shadowTex: THREE.CanvasTexture | null = null

/** Soft dark ellipse used as a contact shadow under furniture. */
export function makeShadowTexture(): THREE.CanvasTexture {
  if (shadowTex) return shadowTex
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 62)
  g.addColorStop(0, 'rgba(0,0,0,0.5)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  shadowTex = new THREE.CanvasTexture(canvas)
  return shadowTex
}

// ---- normal maps ------------------------------------------------------------

/** Derive a tangent-space normal map from a canvas, using luminance as height. */
function heightToNormal(src: HTMLCanvasElement, strength = 2): HTMLCanvasElement {
  const w = src.width
  const h = src.height
  const sctx = src.getContext('2d')!
  const data = sctx.getImageData(0, 0, w, h).data
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const octx = out.getContext('2d')!
  const img = octx.createImageData(w, h)
  const lum = (x: number, y: number) => {
    const xx = (x + w) % w
    const yy = (y + h) % h
    const i = (yy * w + xx) * 4
    return (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (lum(x + 1, y) - lum(x - 1, y)) * strength
      const dy = (lum(x, y + 1) - lum(x, y - 1)) * strength
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1)
      const i = (y * w + x) * 4
      img.data[i] = Math.round((-dx * inv * 0.5 + 0.5) * 255)
      img.data[i + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255)
      img.data[i + 2] = Math.round((inv * 0.5 + 0.5) * 255)
      img.data[i + 3] = 255
    }
  }
  octx.putImageData(img, 0, 0)
  return out
}

let weaveTex: THREE.CanvasTexture | null = null

/** Subtle canvas-weave normal map shared by all paintings. */
export function makeWeaveNormalTexture(): THREE.CanvasTexture {
  if (weaveTex) return weaveTex
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(128, 128)
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const v =
        128 +
        Math.sin(x * 1.57) * 34 +
        Math.sin(y * 1.57) * 34 +
        (Math.random() - 0.5) * 24
      const i = (y * 128 + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, v))
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const normal = heightToNormal(canvas, 0.8)
  weaveTex = new THREE.CanvasTexture(normal)
  weaveTex.wrapS = THREE.RepeatWrapping
  weaveTex.wrapT = THREE.RepeatWrapping
  weaveTex.repeat.set(4, 4)
  return weaveTex
}

let floorNormalTex: THREE.CanvasTexture | null = null

/** Normal map matching the wood floor (grooves between planks, grain streaks). */
export function makeFloorNormalTexture(): THREE.CanvasTexture {
  if (floorNormalTex) return floorNormalTex
  makeFloorTexture() // ensure the color canvas exists
  const normal = heightToNormal(floorCanvas!, 2.2)
  floorNormalTex = new THREE.CanvasTexture(normal)
  floorNormalTex.wrapS = THREE.RepeatWrapping
  floorNormalTex.wrapT = THREE.RepeatWrapping
  floorNormalTex.repeat.set(10, 10)
  floorNormalTex.anisotropy = 8
  return floorNormalTex
}

// ---- floor ----------------------------------------------------------------

let floorTex: THREE.CanvasTexture | null = null
let floorCanvas: HTMLCanvasElement | null = null

export function makeFloorTexture(): THREE.CanvasTexture {
  if (floorTex) return floorTex
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const rng = mulberry32(7777)
  const rowH = 64
  for (let y = 0; y < 512; y += rowH) {
    let x = -Math.floor(rng() * 120)
    while (x < 512) {
      const pw = 120 + rng() * 140
      const base = '#8a6b4a'
      ctx.fillStyle = shade(base, Math.round((rng() - 0.5) * 36))
      ctx.fillRect(x, y, pw - 3, rowH - 3)
      // wood streaks
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(60,40,20,${0.05 + rng() * 0.1})`
        ctx.lineWidth = 1 + rng() * 2
        const sy = y + rng() * rowH
        ctx.beginPath()
        ctx.moveTo(x, sy)
        ctx.lineTo(x + pw, sy + (rng() - 0.5) * 6)
        ctx.stroke()
      }
      x += pw
    }
  }
  ctx.fillStyle = 'rgba(30,20,10,0.55)'
  for (let y = rowH - 3; y < 512; y += rowH) ctx.fillRect(0, y, 512, 3)
  floorCanvas = canvas
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(10, 10)
  tex.anisotropy = 8
  floorTex = tex
  return tex
}

// ---- marble floor (Gold Hall) ---------------------------------------------

let marbleTex: THREE.CanvasTexture | null = null
let marbleCanvas: HTMLCanvasElement | null = null
let marbleNormalTex: THREE.CanvasTexture | null = null

/** Black-and-gold checkered marble with veining, for the Gold membership hall. */
export function makeMarbleFloorTexture(): THREE.CanvasTexture {
  if (marbleTex) return marbleTex
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const rng = mulberry32(9911)
  const tile = 128
  for (let ty = 0; ty < 512; ty += tile) {
    for (let tx = 0; tx < 512; tx += tile) {
      const dark = ((tx / tile + ty / tile) % 2) === 0
      ctx.fillStyle = dark ? shade('#141014', Math.round((rng() - 0.5) * 10)) : shade('#efe3c8', Math.round((rng() - 0.5) * 10))
      ctx.fillRect(tx, ty, tile, tile)
      // marble veining
      const veinColor = dark ? 'rgba(201,162,39,0.4)' : 'rgba(150,120,70,0.28)'
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = veinColor
        ctx.lineWidth = 0.5 + rng() * 1.4
        let x = tx + rng() * tile
        let y = ty
        ctx.beginPath()
        ctx.moveTo(x, y)
        while (y < ty + tile) {
          x += (rng() - 0.5) * 24
          y += 12 + rng() * 16
          ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      // polished tile groove
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'
      ctx.lineWidth = 2
      ctx.strokeRect(tx + 1, ty + 1, tile - 2, tile - 2)
    }
  }
  marbleCanvas = canvas
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(6, 6)
  tex.anisotropy = 8
  marbleTex = tex
  return tex
}

/** Normal map matching the marble floor (subtle veining relief). */
export function makeMarbleNormalTexture(): THREE.CanvasTexture {
  if (marbleNormalTex) return marbleNormalTex
  makeMarbleFloorTexture()
  const normal = heightToNormal(marbleCanvas!, 1.2)
  marbleNormalTex = new THREE.CanvasTexture(normal)
  marbleNormalTex.wrapS = THREE.RepeatWrapping
  marbleNormalTex.wrapT = THREE.RepeatWrapping
  marbleNormalTex.repeat.set(6, 6)
  marbleNormalTex.anisotropy = 8
  return marbleNormalTex
}
