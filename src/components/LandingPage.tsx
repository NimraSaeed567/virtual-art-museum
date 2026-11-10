import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  ARTISTS,
  ARTWORKS,
  ARTIST_SHARE,
  byArtist,
  getArt,
  getArtist,
  priceFor,
} from '../data/artworks'
import { getArtDataUrl } from '../textures/proceduralArt'
import { useStore } from '../store'
import '../landing.css'

const SHARE_PCT = Math.round(ARTIST_SHARE * 100)
const FEATURED_IDS = ['ev2', 'ac5', 'mw5', 'sr5', 'do5', 'ev4', 'ac4', 'mw1']

const ARTIST_PORTRAITS: Record<string, string> = {
  elena: 'https://images.unsplash.com/photo-1752649935896-55f97dfe3c4a?w=800&q=80',
  aurora: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  marcus: 'https://images.unsplash.com/photo-1544225917-1bf66feace19?w=800&q=80',
  sofia: 'https://images.unsplash.com/photo-1720995812487-867dcaaa2b2f?w=800&q=80',
  david: 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?w=800&q=80',
}

const MARQUEE = [
  'Supporting living artists',
  `${SHARE_PCT}% of every sale to the artist`,
  'Five galleries',
  'Walk in',
  'Shine a light',
]

const STATS = [
  { target: 5, pad: 2, label: 'Galleries' },
  { target: ARTWORKS.length, pad: 0, label: 'Artworks' },
  { target: 5, pad: 2, label: 'Living artists' },
  { target: SHARE_PCT, pad: 0, suffix: '%', label: 'To the artist' },
]

const STEPS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="4.5" r="2" />
        <path d="M12 7v6l-3 4M12 13l3 4M9 10l-3 1M15 10l3 1" strokeLinecap="round" />
      </svg>
    ),
    title: 'Walk the halls',
    body: 'Move freely through five galleries in first person — no headset, no install. Just your keyboard and mouse.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="7" />
        <path d="M16 16l5 5M9 11h4M11 9v4" strokeLinecap="round" />
      </svg>
    ),
    title: 'Get close to the work',
    body: 'Step up to any piece to read its story, meet the artist, and see it in full, framed detail.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="14" rx="1.5" />
        <path d="M3 15l5-4 4 3 4-4 5 4M8.5 9a1 1 0 100-2 1 1 0 000 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Take a print home',
    body: `Buy a museum-quality print of anything you love — and ${SHARE_PCT}% goes straight to the artist who made it.`,
  },
]

const TESTIMONIALS = [
  {
    quote:
      'I found an artist I now collect in person. The museum made discovering her work feel like an event, not a scroll.',
    name: 'Priya Nair',
    role: 'Collector, London',
  },
  {
    quote:
      'Half of every print comes back to me, automatically. It is the fairest deal I have had with any gallery, physical or digital.',
    name: 'Aurora Chen',
    role: 'Featured artist',
  },
  {
    quote:
      'We sent the link to our members and they spent twenty minutes walking the halls — nobody does that with a shop page.',
    name: 'Daniel Roth',
    role: 'Arts non-profit director',
  },
]

const FAQS = [
  {
    q: 'Do I need a VR headset or an app?',
    a: 'No. The entire museum runs in your browser on a normal computer. A desktop with a mouse gives the best experience, but nothing needs to be installed.',
  },
  {
    q: `How does the ${SHARE_PCT}% artist share work?`,
    a: `Every print in the gift shop is tied to the artist who made the original. When it sells, ${SHARE_PCT}% of the sale is recorded to that artist and paid out — the museum keeps the rest to cover printing, shipping and hosting.`,
  },
  {
    q: 'Who are the five founding artists?',
    a: 'Elena, Aurora, Marcus, Sofia and David make up our launch collection — each with their own room, story and body of work. The museum is built to grow: new artists and exhibitions rotate in as the collective expands.',
  },
  {
    q: 'How are prints made and shipped?',
    a: 'Checkout hands off to a print-on-demand partner who prints and ships museum-quality prints on your behalf, so no inventory is ever held and every order goes out fresh.',
  },
  {
    q: 'Can we feature our own collection or artists?',
    a: 'Yes — the museum is designed to scale to new rooms, artists and catalogues through a content system. Reach out and we can walk you through it.',
  },
]

/** Splits a string into per-word spans for staggered kinetic reveals. */
function Kinetic({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span className="word" style={{ '--i': i } as CSSProperties} key={`${w}-${i}`}>
          {w}
        </span>
      ))}
    </>
  )
}

/** Full-bleed autoplay hero video with a play/pause toggle. */
function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (playing) v.play().catch(() => {})
    else v.pause()
  }, [playing])

  return (
    <div className="hero-video-wrap">
      <video
        ref={videoRef}
        className="hero-video"
        src="/video/hero.mp4"
        autoPlay={playing}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      />
      <button
        className="hero-video-toggle"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? 'Pause background video' : 'Play background video'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z" /></svg>
        )}
      </button>
    </div>
  )
}

const MARQUEE_SECTION_REPEAT = 4

/** One duplicated row cycling through the keyword phrases — two of these,
 * side by side, is what makes the loop below seamless. */
function MarqueeSectionRow({ id, words }: { id: string; words: string[] }) {
  return (
    <div className="marquee-section-row">
      {Array.from({ length: MARQUEE_SECTION_REPEAT }).map((_, cycle) =>
        words.map((w, i) => (
          <span className="marquee-section-word" key={`${id}-${cycle}-${i}`}>
            {w}
            <span className="marquee-section-dot">•</span>
          </span>
        )),
      )}
    </div>
  )
}

/**
 * Replaces one of the two thin ticker strips: a static, readable headline
 * sitting in front of a giant, low-contrast, continuously-scrolling cycle of
 * keyword phrases — texture behind real content, not a separate colored
 * band. Two identical rows sit side by side inside a track that animates
 * from translateX(0) to translateX(-50%); since the rows are identical, the
 * moment it "resets" is invisible.
 */
function MarqueeSection({ words, heading }: { words: string[]; heading: string }) {
  return (
    <section className="marquee-section">
      <div className="marquee-section-track" aria-hidden="true">
        <MarqueeSectionRow id="a" words={words} />
        <MarqueeSectionRow id="b" words={words} />
      </div>
      <h2 className="marquee-section-heading">{heading}</h2>
    </section>
  )
}

/**
 * Infinite carousel: the caller renders its items list 4x back-to-back.
 * A scroll listener silently snaps by exactly one set-width whenever the
 * view drifts too far from center, so the loop works no matter how the row
 * is scrolled — buttons, trackpad, drag, or wheel. 4 copies (not 2) because
 * the carousel is full-bleed (viewport-width): with only 2, one copy could
 * be nearly as wide as the visible area, leaving too little slack and
 * pinning the scroll position against the browser's hard clamp.
 */
const CAROUSEL_COPIES = 4

function useCarousel() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const setWidth = () => el.scrollWidth / CAROUSEL_COPIES
    const centerPos = () => setWidth() * Math.floor(CAROUSEL_COPIES / 2)
    const recenter = () => {
      const w = setWidth()
      if (w <= 0) return
      el.scrollLeft = centerPos()
    }
    recenter()
    // Only reposition once scrolling has fully settled (no scroll events for
    // 140ms) — jumping mid-momentum is what caused the smooth/jerky jitter.
    let settle: ReturnType<typeof setTimeout>
    const onScroll = () => {
      clearTimeout(settle)
      settle = setTimeout(() => {
        const w = setWidth()
        if (w <= 0) return
        const center = centerPos()
        if (el.scrollLeft >= center + w) el.scrollLeft -= w
        else if (el.scrollLeft <= center - w) el.scrollLeft += w
      }, 140)
    }
    const onResize = () => recenter()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      clearTimeout(settle)
    }
  }, [])
  const scroll = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: el.clientWidth * 0.82 * dir, behavior: 'smooth' })
  }
  return { ref, scroll }
}

/** Adds an `in` class to `.reveal` elements as they scroll into view. */
function useScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'))
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/** Scroll progress, count-up stats, magnetic buttons, 3D tilt, hero parallax. */
function useInteractions() {
  useEffect(() => {
    const cleanups: Array<() => void> = []
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = window.matchMedia('(pointer: fine)').matches

    // --- scroll progress + hero parallax ---
    const bar = document.querySelector('.scroll-progress') as HTMLElement | null
    const heroInner = document.querySelector('.lp-hero-inner') as HTMLElement | null
    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight || 1
      const p = Math.min(1, doc.scrollTop / max)
      if (bar) bar.style.transform = `scaleX(${p})`
      if (heroInner && !reduce) {
        const y = doc.scrollTop
        heroInner.style.setProperty('--sy', `${y * 0.22}px`)
        heroInner.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.75)))
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    cleanups.push(() => window.removeEventListener('scroll', onScroll))

    // --- count-up stats ---
    const counters = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'))
    const runCount = (el: HTMLElement) => {
      const target = Number(el.dataset.count || '0')
      const pad = Number(el.dataset.pad || '0')
      const suffix = el.dataset.suffix || ''
      const fmt = (n: number) => (pad ? String(n).padStart(pad, '0') : String(n)) + suffix
      if (reduce) {
        el.textContent = fmt(target)
        return
      }
      const dur = 1300
      const start = performance.now()
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / dur)
        const eased = 1 - Math.pow(1 - p, 3)
        el.textContent = fmt(Math.round(target * eased))
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
    if ('IntersectionObserver' in window) {
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              runCount(e.target as HTMLElement)
              cio.unobserve(e.target)
            }
          })
        },
        { threshold: 0.6 },
      )
      counters.forEach((c) => cio.observe(c))
      cleanups.push(() => cio.disconnect())
    } else {
      counters.forEach(runCount)
    }

    // --- pointer effects (skip on touch / reduced motion) ---
    if (fine && !reduce) {
      // 3D tilt
      document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((node) => {
        const onMove = (e: MouseEvent) => {
          const r = node.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width - 0.5
          const py = (e.clientY - r.top) / r.height - 0.5
          node.style.setProperty('--rx', `${(-py * 7).toFixed(2)}deg`)
          node.style.setProperty('--ry', `${(px * 7).toFixed(2)}deg`)
        }
        const onLeave = () => {
          node.style.setProperty('--rx', '0deg')
          node.style.setProperty('--ry', '0deg')
        }
        node.addEventListener('mousemove', onMove)
        node.addEventListener('mouseleave', onLeave)
        cleanups.push(() => {
          node.removeEventListener('mousemove', onMove)
          node.removeEventListener('mouseleave', onLeave)
        })
      })

      // magnetic buttons
      document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((node) => {
        const onMove = (e: MouseEvent) => {
          const r = node.getBoundingClientRect()
          const x = e.clientX - (r.left + r.width / 2)
          const y = e.clientY - (r.top + r.height / 2)
          node.style.transform = `translate(${x * 0.28}px, ${y * 0.4}px)`
        }
        const onLeave = () => {
          node.style.transform = ''
        }
        node.addEventListener('mousemove', onMove)
        node.addEventListener('mouseleave', onLeave)
        cleanups.push(() => {
          node.removeEventListener('mousemove', onMove)
          node.removeEventListener('mouseleave', onLeave)
        })
      })

      // hero title mouse parallax
      const hero = document.querySelector('.lp-hero') as HTMLElement | null
      const title = document.querySelector('.lp-hero-title') as HTMLElement | null
      if (hero && title) {
        const onMove = (e: MouseEvent) => {
          const px = e.clientX / window.innerWidth - 0.5
          const py = e.clientY / window.innerHeight - 0.5
          title.style.transform = `translate(${px * 20}px, ${py * 12}px)`
        }
        const onLeave = () => {
          title.style.transform = ''
        }
        hero.addEventListener('mousemove', onMove)
        hero.addEventListener('mouseleave', onLeave)
        cleanups.push(() => {
          hero.removeEventListener('mousemove', onMove)
          hero.removeEventListener('mouseleave', onLeave)
        })
      }
    }

    return () => cleanups.forEach((fn) => fn())
  }, [])
}

export default function LandingPage() {
  const enter = useStore((s) => s.enter)
  const [scrolled, setScrolled] = useState(false)
  const [pastHero, setPastHero] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const mailRef = useRef<HTMLInputElement>(null)

  useScrollReveal()
  useInteractions()
  const galleryCar = useCarousel()
  const collectionCar = useCarousel()

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
      setPastHero(window.scrollY > window.innerHeight * 0.85)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const nav = (
    <>
      <a href="#experience" onClick={() => setMenuOpen(false)}>Experience</a>
      <a href="#galleries" onClick={() => setMenuOpen(false)}>Galleries</a>
      <a href="#collection" onClick={() => setMenuOpen(false)}>Collection</a>
      <a href="#mission" onClick={() => setMenuOpen(false)}>Mission</a>
      <a href="#artists" onClick={() => setMenuOpen(false)}>Artists</a>
      <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
    </>
  )

  return (
    <div className="landing">
      <div className="grain" aria-hidden />
      <div className="scroll-progress" aria-hidden />

      {/* floating enter button */}
      <button className={`lp-float ${pastHero ? 'show' : ''}`} onClick={enter} data-magnetic>
        Enter the Museum →
      </button>

      {/* ---------- nav ---------- */}
      <header className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <a className="lp-brand" href="#top">
          <span className="lp-logo" />
          <span>Living Artists</span>
        </a>
        <nav className="lp-links">{nav}</nav>
        <div className="lp-nav-right">
          <button className="btn-primary sm" onClick={enter} data-magnetic>
            Enter the Museum
          </button>
          <button className="lp-burger" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
            <span /><span /><span />
          </button>
        </div>
        {menuOpen && <nav className="lp-mobile-menu">{nav}</nav>}
      </header>

      {/* ---------- hero ---------- */}
      <section className="lp-hero" id="top">
        <HeroVideo />
        <div className="lp-hero-scrim" />
        <div className="lp-hero-inner">
          <div className="lp-hero-eyebrow"><span className="dotpulse" />A living collection, open worldwide</div>
          <h1 className="lp-hero-title">
            <span className="l1">THE&nbsp;LIVING</span>
            <span className="l2">Artists</span>
            <span className="l3">MUSEUM</span>
          </h1>
          <p className="lp-lede">
            Five galleries. Five living artists. Walk the halls, get close to the work, and take a
            print home — <b>{SHARE_PCT}% of every sale goes directly to the artist</b>.
          </p>
          <div className="lp-hero-cta">
            <button className="btn-primary" onClick={enter} data-magnetic>Enter the Museum</button>
            <a className="btn-ghost" href="#collection">Browse the collection</a>
          </div>
          <div className="lp-hero-hint">Walk in — no headset, no install, just a browser</div>
        </div>
        <div className="lp-hero-side">EST. 2026 — LIVING ARTISTS COLLECTIVE</div>
        <a href="#stats" className="lp-scrollcue" aria-label="Scroll down"><span /></a>
      </section>

      {/* ---------- stats ---------- */}
      <section className="lp-stats" id="stats">
        {STATS.map((s) => (
          <div className="lp-stat reveal" key={s.label}>
            <div
              className="lp-stat-val"
              data-count={s.target}
              data-pad={s.pad || 0}
              data-suffix={s.suffix || ''}
            >
              {(s.pad ? String(s.target).padStart(s.pad, '0') : String(s.target)) + (s.suffix || '')}
            </div>
            <div className="lp-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ---------- experience ---------- */}
      <section className="lp-section" id="experience">
        <div className="lp-head">
          <span className="lp-index reveal">01</span>
          <h2 className="kh reveal"><Kinetic text="A gallery you walk through, not scroll past" /></h2>
          <p className="reveal">Three simple moves turn browsing into visiting.</p>
        </div>
        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <div className="lp-step reveal" data-tilt style={{ transitionDelay: `${i * 90}ms` }} key={s.title}>
              <div className="lp-step-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- galleries ---------- */}
      <section className="lp-section alt" id="galleries">
        <div className="lp-head right">
          <span className="lp-index reveal">02</span>
          <h2 className="kh reveal"><Kinetic text="Five voices, one roof" /></h2>
          <p className="reveal">Each room is dedicated to a single living artist and their world.</p>
        </div>
        <div className="lp-car-wrap">
          <button className="lp-car-btn prev" onClick={() => galleryCar.scroll(-1)} aria-label="Previous galleries">‹</button>
          <div className="lp-galleries carousel" ref={galleryCar.ref}>
            {[...ARTISTS, ...ARTISTS, ...ARTISTS, ...ARTISTS].map((a, i) => {
              const first = byArtist(a.id)[0]
              const n = i % ARTISTS.length
              return (
                <button
                  className="lp-gallery reveal"
                  data-tilt
                  style={{ transitionDelay: `${n * 70}ms` }}
                  key={`${a.id}-${i}`}
                  onClick={enter}
                  title={`Enter ${a.gallery}`}
                >
                  <div className="lp-gallery-img">
                    {first && <img src={getArtDataUrl(first)} alt={a.gallery} loading="lazy" />}
                    <span className="lp-gnum">0{n + 1}</span>
                    <span className="lp-gallery-tag">{a.gallery}</span>
                  </div>
                  <div className="lp-gallery-body">
                    <h3>{a.name}</h3>
                    <p className="lp-gallery-tagline">{a.tagline}</p>
                    <span className="lp-enter-link">Enter gallery →</span>
                  </div>
                </button>
              )
            })}
          </div>
          <button className="lp-car-btn next" onClick={() => galleryCar.scroll(1)} aria-label="Next galleries">›</button>
        </div>
      </section>

      {/* ---------- collection ---------- */}
      <section className="lp-section" id="collection">
        <div className="lp-head">
          <span className="lp-index reveal">03</span>
          <h2 className="kh reveal"><Kinetic text="Prints worth living with" /></h2>
          <p className="reveal">A glimpse of what is hanging inside. Step in to see it all in context.</p>
        </div>
        <div className="lp-car-wrap">
          <button className="lp-car-btn prev" onClick={() => collectionCar.scroll(-1)} aria-label="Previous artworks">‹</button>
          <div className="lp-collection carousel" ref={collectionCar.ref}>
            {[...FEATURED_IDS, ...FEATURED_IDS, ...FEATURED_IDS, ...FEATURED_IDS].map((id, i) => {
              const art = getArt(id)
              const artist = getArtist(art.artistId)
              return (
                <button
                  className="lp-art reveal"
                  style={{ transitionDelay: `${(i % 4) * 70}ms` }}
                  key={`${id}-${i}`}
                  onClick={enter}
                  title="View in the museum"
                >
                  <img src={getArtDataUrl(art)} alt={art.title} loading="lazy" />
                  <div className="lp-art-meta">
                    <div>
                      <b>{art.title}</b>
                      <span>{artist.name}</span>
                    </div>
                    <div className="lp-art-price">from ${priceFor(art, 'sm')}</div>
                  </div>
                </button>
              )
            })}
          </div>
          <button className="lp-car-btn next" onClick={() => collectionCar.scroll(1)} aria-label="Next artworks">›</button>
        </div>
        <div className="lp-center reveal">
          <button className="btn-primary" onClick={enter} data-magnetic>See it all in the museum</button>
        </div>
      </section>

      <MarqueeSection words={MARQUEE} heading="Fifty percent, every time." />

      {/* ---------- mission ---------- */}
      <section className="lp-mission" id="mission">
        <div className="aurora" aria-hidden />
        <div className="lp-mission-grid">
          <div className="lp-mission-text">
            <span className="lp-index reveal">04</span>
            <h2 className="kh reveal"><Kinetic text="Half of everything, to the people who made it." /></h2>
            <p className="reveal">
              Most galleries take the lion's share. We flip it. The Living Artists Museum exists to
              put money back in the hands of working artists — so that making art stays a life,
              not a hobby squeezed between other jobs.
            </p>
            <p className="reveal">
              Every print is tied to its creator. When you buy, the split is automatic and
              transparent. No opaque commissions, no waiting seasons to get paid.
            </p>
            <button className="btn-primary reveal" onClick={enter} data-magnetic>Support an artist</button>
          </div>
          <div className="lp-split-card reveal" data-tilt>
            <div className="lp-split-title">Where a $100 print goes</div>
            <div className="lp-split-bar">
              <div className="lp-split-artist" style={{ width: `${SHARE_PCT}%` }}>
                <span>${Math.round(100 * ARTIST_SHARE)}</span>
              </div>
              <div className="lp-split-museum">
                <span>${100 - Math.round(100 * ARTIST_SHARE)}</span>
              </div>
            </div>
            <div className="lp-split-legend">
              <span><i className="dot artist" /> {SHARE_PCT}% to the artist</span>
              <span><i className="dot museum" /> {100 - SHARE_PCT}% printing, shipping &amp; hosting</span>
            </div>
            <p className="lp-split-note">
              The same split applies to every piece, from the smallest postcard to the largest
              centerpiece.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- artists ---------- */}
      <section className="lp-section alt" id="artists">
        <div className="lp-head right">
          <span className="lp-index reveal">05</span>
          <h2 className="kh reveal"><Kinetic text="The people behind the walls" /></h2>
        </div>
        <div className="lp-artists">
          {ARTISTS.map((a, i) => (
            <div className="lp-artist reveal" data-tilt style={{ transitionDelay: `${i * 60}ms` }} key={a.id}>
              <img src={ARTIST_PORTRAITS[a.id]} alt={a.name} loading="lazy" />
              <div className="lp-artist-body">
                <h3>{a.name}</h3>
                <div className="lp-artist-gallery">{a.gallery}</div>
                <p>{a.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- testimonials ---------- */}
      <section className="lp-section" id="testimonials">
        <div className="lp-head wide">
          <span className="lp-index reveal">06</span>
          <h2 className="kh reveal"><Kinetic text="What visitors and artists say" /></h2>
        </div>
        <div className="lp-quotes">
          {TESTIMONIALS.map((t, i) => (
            <figure className="lp-quote reveal" data-tilt style={{ transitionDelay: `${i * 80}ms` }} key={t.name}>
              <blockquote>“{t.quote}”</blockquote>
              <figcaption>
                <span className="lp-quote-avatar" aria-hidden>
                  {t.name.split(' ').map((w) => w[0]).join('')}
                </span>
                <span className="lp-quote-who">
                  <b>{t.name}</b>
                  <span>{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------- faq ---------- */}
      <section className="lp-section alt" id="faq">
        <div className="lp-head">
          <span className="lp-index reveal">07</span>
          <h2 className="kh reveal"><Kinetic text="Good to know" /></h2>
        </div>
        <div className="lp-faq">
          {FAQS.map((f) => (
            <details className="lp-faq-item reveal" key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------- final CTA ---------- */}
      <section className="lp-cta">
        <div className="cta-photo" aria-hidden />
        <div className="reveal">
          <h2 className="kh-cta"><Kinetic text="Ready to walk in?" /></h2>
          <p>The doors are open. Shine a light, find something you love, and support the artist who made it.</p>
          <button className="btn-primary lg" onClick={enter} data-magnetic>Enter the Museum</button>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="lp-footer">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <a className="lp-brand" href="#top">
              <span className="lp-logo" />
              <span>Living Artists</span>
            </a>
            <p>A browser-based virtual museum putting {SHARE_PCT}% of every print sale back into the hands of living artists.</p>
          </div>
          <div className="lp-footer-col">
            <h4>Explore</h4>
            <a href="#experience">Experience</a>
            <a href="#galleries">Galleries</a>
            <a href="#collection">Collection</a>
            <a href="#artists">Artists</a>
          </div>
          <div className="lp-footer-col">
            <h4>Visit</h4>
            <button className="lp-linkbtn" onClick={enter}>Enter the museum</button>
            <a href="#mission">Our mission</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="lp-footer-col lp-newsletter">
            <h4>Stay in the loop</h4>
            <p>New rooms, new artists, occasional emails.</p>
            {subscribed ? (
              <div className="lp-subscribed">✓ Thanks — you're on the list</div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (mailRef.current?.value) setSubscribed(true)
                }}
              >
                <input ref={mailRef} type="email" required placeholder="you@email.com" />
                <button type="submit">Join</button>
              </form>
            )}
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} The Living Artists Museum</span>
          <span>Crafted for the browser · Best experienced on desktop</span>
        </div>
      </footer>
    </div>
  )
}
