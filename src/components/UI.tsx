import { useEffect, useRef, useState } from 'react'
import {
  ARTIST_SHARE,
  PRINT_SIZES,
  byArtist,
  getArt,
  getArtist,
  priceFor,
} from '../data/artworks'
import {
  FINALE_CENTER_Z,
  FINALE_HALF,
  PROMENADE_BAYS,
  PROMENADE_ENTRANCE_Z,
} from '../data/layout'
import { getArtDataUrl } from '../textures/proceduralArt'
import { useStore, playerState } from '../store'

export default function UI() {
  const locked = useStore((s) => s.locked)
  const modalId = useStore((s) => s.modalId)
  const cartOpen = useStore((s) => s.cartOpen)

  const showPause = !locked && !modalId && !cartOpen
  const showHud = locked

  return (
    <>
      {showHud && <Hud />}
      {showPause && <PauseOverlay />}
      {modalId && <ArtworkModal artId={modalId} />}
      {cartOpen && <CartDrawer />}
    </>
  )
}

// ---------------------------------------------------------------------------

function Hud() {
  const hoveredId = useStore((s) => s.hoveredId)
  const room = useStore((s) => s.room)
  const membership = useStore((s) => s.membership)
  const cartCount = useStore((s) => s.cart.reduce((n, c) => n + c.qty, 0))
  const art = hoveredId ? getArt(hoveredId) : null
  return (
    <div className="hud">
      <div className="vignette" />
      <div className="hud-brand">
        The Living Artists Museum
        {membership === 'gold' && <span className="hud-tier gold"> · Gold Membership</span>}
      </div>
      <div className="room-banner" key={room}>{room}</div>
      <div className={`crosshair ${art ? 'active' : ''}`} />
      {art && (
        <div className="hud-tooltip">
          <strong>{art.title}</strong> — {getArtist(art.artistId).name}
          <span>click or press E to view &amp; buy prints</span>
        </div>
      )}
      <Minimap gold={membership === 'gold'} />
      <div className="hud-hint">
        WASD move · mouse look · <b>Esc</b> menu{cartCount > 0 ? ` · cart (${cartCount})` : ''}
      </div>
    </div>
  )
}

function Minimap({ gold }: { gold: boolean }) {
  return gold ? <PromenadeMinimap /> : <HubMinimap />
}

// Plus-shaped floor plan (General Admission); player dot driven by rAF
// outside React renders.
function HubMinimap() {
  const dotRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const d = dotRef.current
      if (d) {
        const px = ((playerState.x + 25) / 50) * 120
        const py = ((playerState.z + 25) / 50) * 120
        d.style.transform = `translate(${px - 5}px, ${py - 6}px) rotate(${playerState.yaw}rad)`
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])
  const room = (x: number, y: number, w: number, h: number, key: string) => (
    <rect key={key} x={x} y={y} width={w} height={h} rx={2} />
  )
  return (
    <div className="minimap">
      <svg viewBox="0 0 120 120">
        <g fill="rgba(217,182,74,0.12)" stroke="rgba(217,182,74,0.55)" strokeWidth="1.5">
          {room(36, 36, 48, 48, 'hall')}
          {room(48, 2, 24, 34, 'n')}
          {room(48, 84, 24, 34, 's')}
          {room(84, 48, 34, 24, 'e')}
          {room(2, 48, 34, 24, 'w')}
        </g>
        <text x="60" y="21" textAnchor="middle">I</text>
        <text x="103" y="62" textAnchor="middle">II</text>
        <text x="60" y="104" textAnchor="middle">III</text>
        <text x="17" y="62" textAnchor="middle">IV</text>
      </svg>
      <div className="minimap-dot" ref={dotRef} />
    </div>
  )
}

// Tall vertical strip for the Grand Salon promenade: entrance at the top,
// one segment per artist bay, finale room at the bottom.
const PROMENADE_Z_TOP = PROMENADE_ENTRANCE_Z
const PROMENADE_Z_BOTTOM = FINALE_CENTER_Z - FINALE_HALF
const PROMENADE_SVG_W = 60
const PROMENADE_SVG_H = 170

function PromenadeMinimap() {
  const dotRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const d = dotRef.current
      if (d) {
        const px = ((playerState.x + 12) / 24) * PROMENADE_SVG_W
        const py = ((PROMENADE_Z_TOP - playerState.z) / (PROMENADE_Z_TOP - PROMENADE_Z_BOTTOM)) * PROMENADE_SVG_H
        d.style.transform = `translate(${px - 5}px, ${py - 6}px) rotate(${playerState.yaw}rad)`
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])
  const toY = (z: number) => ((PROMENADE_Z_TOP - z) / (PROMENADE_Z_TOP - PROMENADE_Z_BOTTOM)) * PROMENADE_SVG_H
  return (
    <div className="minimap tall">
      <svg viewBox={`0 0 ${PROMENADE_SVG_W} ${PROMENADE_SVG_H}`}>
        <g fill="rgba(217,182,74,0.12)" stroke="rgba(217,182,74,0.55)" strokeWidth="1.5">
          <rect x={12} y={0} width={36} height={toY(PROMENADE_BAYS[3].z + 12)} rx={2} />
          <rect x={2} y={toY(FINALE_CENTER_Z + FINALE_HALF)} width={56} height={toY(FINALE_CENTER_Z - FINALE_HALF) - toY(FINALE_CENTER_Z + FINALE_HALF)} rx={2} />
        </g>
        {PROMENADE_BAYS.map((b, i) => (
          <text key={b.artist.id} x={30} y={toY(b.z) + 4} textAnchor="middle">
            {['I', 'II', 'III', 'IV'][i]}
          </text>
        ))}
        <text x={30} y={toY(FINALE_CENTER_Z) + 4} textAnchor="middle" fontSize="7">Salon</text>
      </svg>
      <div className="minimap-dot" ref={dotRef} />
    </div>
  )
}

function PauseOverlay() {
  const resume = useStore((s) => s.resume)
  const leave = useStore((s) => s.leave)
  const openCart = useStore((s) => s.openCart)
  const cartCount = useStore((s) => s.cart.reduce((n, c) => n + c.qty, 0))
  return (
    <div className="overlay pause" onClick={resume}>
      <div className="pause-card" onClick={(e) => e.stopPropagation()}>
        <h2>Ready to explore</h2>
        <button className="btn-primary" onClick={resume}>
          Click to look around
        </button>
        <button className="btn-secondary" onClick={openCart}>
          View cart{cartCount > 0 ? ` (${cartCount})` : ''}
        </button>
        <div className="controls-help vertical">
          <span><b>W A S D</b> walk · <b>Shift</b> run</span>
          <span><b>Click</b> an artwork to view &amp; buy prints</span>
        </div>
        <button className="btn-link" onClick={leave}>← Back to homepage</button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function ArtworkModal({ artId }: { artId: string }) {
  const art = getArt(artId)
  const artist = getArtist(art.artistId)
  const resume = useStore((s) => s.resume)
  const openCart = useStore((s) => s.openCart)
  const addToCart = useStore((s) => s.addToCart)
  const [sizeId, setSizeId] = useState('md')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setSizeId('md')
    setAdded(false)
  }, [artId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resume()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [resume])

  return (
    <div className="overlay modal-bg" onClick={resume}>
      <div className="art-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-x" onClick={resume} aria-label="Close">×</button>
        <div className="art-modal-img">
          <img src={getArtDataUrl(art)} alt={art.title} />
        </div>
        <div className="art-modal-info">
          <div className="eyebrow">{artist.gallery} · {artist.name}</div>
          <h2>{art.title}</h2>
          <div className="art-year">{art.year} · {artist.tagline}</div>
          <p className="art-desc">{art.desc}</p>
          <p className="artist-bio">{artist.bio}</p>
          <div className="share-note">
            ♥ {Math.round(ARTIST_SHARE * 100)}% of this sale goes directly to {artist.name.split(' ')[0]}
          </div>
          <div className="sizes">
            {PRINT_SIZES.map((s) => (
              <label key={s.id} className={`size-opt ${sizeId === s.id ? 'sel' : ''}`}>
                <input
                  type="radio"
                  name="size"
                  checked={sizeId === s.id}
                  onChange={() => setSizeId(s.id)}
                />
                <span>{s.label}</span>
                <b>${priceFor(art, s.id)}</b>
              </label>
            ))}
          </div>
          <div className="modal-actions">
            <button
              className="btn-primary"
              onClick={() => {
                addToCart(art.id, sizeId)
                setAdded(true)
              }}
            >
              {added ? '✓ Added to cart — add another?' : `Add print to cart — $${priceFor(art, sizeId)}`}
            </button>
            <div className="modal-links">
              <button className="btn-link" onClick={openCart}>View cart</button>
              <button className="btn-link" onClick={resume}>Continue exploring</button>
            </div>
          </div>
          <MoreFromArtist artId={art.id} />
        </div>
      </div>
    </div>
  )
}

function MoreFromArtist({ artId }: { artId: string }) {
  const art = getArt(artId)
  const artist = getArtist(art.artistId)
  const others = byArtist(art.artistId).filter((a) => a.id !== artId)
  if (others.length === 0) return null
  return (
    <div className="more-works">
      <div className="more-works-title">More from {artist.name.split(' ')[0]}</div>
      <div className="more-works-row">
        {others.map((o) => (
          <img
            key={o.id}
            src={getArtDataUrl(o)}
            alt={o.title}
            title={`${o.title} (${o.year})`}
            onClick={() => useStore.setState({ modalId: o.id })}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

export function CartDrawer() {
  const cart = useStore((s) => s.cart)
  const checkedOut = useStore((s) => s.checkedOut)
  const lastPurchased = useStore((s) => s.lastPurchased)
  const resume = useStore((s) => s.resume)
  const setQty = useStore((s) => s.setQty)
  const checkout = useStore((s) => s.checkout)
  const [name, setName] = useState('')

  const total = cart.reduce((sum, c) => sum + priceFor(getArt(c.artId), c.sizeId) * c.qty, 0)
  const artistCut = Math.round(total * ARTIST_SHARE)
  const trimmedName = name.trim()
  const purchasedTitles = [...new Set(lastPurchased.map((c) => getArt(c.artId).title))]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resume()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [resume])

  return (
    <div className="overlay modal-bg" onClick={resume}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <button className="close-x" onClick={resume} aria-label="Close">×</button>
        <h2>Gift Shop Cart</h2>

        {checkedOut ? (
          <div className="checkout-done">
            <div className="big-check">✓</div>
            <h3>Order placed (demo)</h3>
            <p>
              In the full build this checkout hands off to Shopify/Stripe, prints ship via a
              print-on-demand partner, and each artist's revenue share is recorded automatically.
            </p>
            {trimmedName && purchasedTitles.length > 0 && (
              <p className="collector-note">
                "{trimmedName}" is now on the plaque next to {purchasedTitles.join(', ')} — go take a look.
              </p>
            )}
            <button className="btn-primary" onClick={resume}>Back to the museum</button>
          </div>
        ) : cart.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <p className="muted">
              Walk up to any artwork and click it to buy a print — at checkout you can leave your
              name, and it'll show up on the plaque next to that piece.
            </p>
            <button className="btn-primary" onClick={resume}>Continue exploring</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((c) => {
                const art = getArt(c.artId)
                const size = PRINT_SIZES.find((s) => s.id === c.sizeId)!
                const line = priceFor(art, c.sizeId) * c.qty
                return (
                  <div className="cart-item" key={`${c.artId}-${c.sizeId}`}>
                    <img src={getArtDataUrl(art)} alt={art.title} />
                    <div className="cart-item-info">
                      <b>{art.title}</b>
                      <span>{getArtist(art.artistId).name}</span>
                      <span className="muted">{size.label}</span>
                    </div>
                    <div className="cart-item-qty">
                      <button onClick={() => setQty(c.artId, c.sizeId, c.qty - 1)}>−</button>
                      <span>{c.qty}</span>
                      <button onClick={() => setQty(c.artId, c.sizeId, c.qty + 1)}>+</button>
                    </div>
                    <div className="cart-item-price">${line}</div>
                  </div>
                )
              })}
            </div>
            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <b>${total}</b>
              </div>
              <div className="share-note">♥ ${artistCut} of this order goes directly to the artists</div>
              <label className="collector-field">
                <span>Your name (optional) — goes on the plaque next to what you buy</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nimra Saeed"
                  maxLength={40}
                />
              </label>
              <button className="btn-primary" onClick={() => checkout(name)}>Checkout (demo)</button>
              <button className="btn-link" onClick={resume}>Continue exploring</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
