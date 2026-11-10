import { useState } from 'react'
import { Link } from 'wouter'
import { SAMPLE_MUSEUM } from '../data/museum'
import { getPortraitDataUrl } from '../textures/proceduralArt'
import './pages.css'

const STYLE_LABELS: Record<string, string> = {
  expressionist: 'Expressionist',
  colorField: 'Color Field',
  geometric: 'Geometric',
  impressionist: 'Impressionist',
  lineArt: 'Line Art',
  ascii: 'ASCII',
  uncategorized: 'Mixed Media',
}

const STYLE_DESC: Record<string, string> = {
  expressionist: 'Raw emotion distilled onto canvas — bold, unrestrained, unflinching.',
  colorField: 'Pure feeling through expansive fields of harmonious hue.',
  geometric: 'Order, precision, beauty — mathematics made visible.',
  impressionist: 'Fleeting moments captured in light, color, and sensation.',
  lineArt: 'Minimal means, maximum expression through the mastery of line.',
  ascii: 'The digital frontier — art born from the language of machines.',
  uncategorized: 'Artists who defy easy classification.',
}

export default function AllArtistsPage() {
  const [activeStyle, setActiveStyle] = useState<string | null>(null)

  // Group artists by their default style
  const grouped = SAMPLE_MUSEUM.artists.reduce((acc, artist) => {
    const style = artist.defaultStyle || 'uncategorized'
    if (!acc[style]) acc[style] = []
    acc[style].push(artist)
    return acc
  }, {} as Record<string, typeof SAMPLE_MUSEUM.artists>)

  const allStyles = Object.keys(grouped)
  const displayedArtists = activeStyle
    ? SAMPLE_MUSEUM.artists.filter(a => (a.defaultStyle || 'uncategorized') === activeStyle)
    : SAMPLE_MUSEUM.artists

  return (
    <div className="dir-page">
      {/* Hero Banner */}
      <div className="dir-hero">
        <div className="dir-hero-noise" />
        <div className="dir-hero-content">
          <span className="dir-eyebrow">The Atelier Museum of Emerging Art</span>
          <h1 className="dir-hero-title">The Artists</h1>
          <p className="dir-hero-sub">
            Every sale funds a living artist. We showcase, you collect, they create.
          </p>
          <div className="dir-hero-stat-row">
            <div className="dir-stat">
              <span className="dir-stat-num">{SAMPLE_MUSEUM.artists.length}</span>
              <span className="dir-stat-label">Artists</span>
            </div>
            <div className="dir-stat-divider" />
            <div className="dir-stat">
              <span className="dir-stat-num">{allStyles.length}</span>
              <span className="dir-stat-label">Movements</span>
            </div>
            <div className="dir-stat-divider" />
            <div className="dir-stat">
              <span className="dir-stat-num">50%</span>
              <span className="dir-stat-label">Revenue to artists</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="dir-body">
        <div className="dir-filters">
          <button
            className={`dir-pill ${activeStyle === null ? 'active' : ''}`}
            onClick={() => setActiveStyle(null)}
          >
            All
          </button>
          {allStyles.map(s => (
            <button
              key={s}
              className={`dir-pill ${activeStyle === s ? 'active' : ''}`}
              onClick={() => setActiveStyle(s)}
            >
              {STYLE_LABELS[s] || s}
              <span className="dir-pill-count">{grouped[s].length}</span>
            </button>
          ))}
        </div>

        {/* Active Style Banner */}
        {activeStyle && (
          <div className="dir-style-banner">
            <h2>{STYLE_LABELS[activeStyle]}</h2>
            <p>{STYLE_DESC[activeStyle]}</p>
          </div>
        )}

        {/* Artist Grid */}
        <div className="dir-artist-grid">
          {displayedArtists.map((artist, i) => {
            const style = artist.defaultStyle || 'uncategorized'
            const artistExhibits = SAMPLE_MUSEUM.exhibitions.filter(e => e.artistId === artist.id)
            return (
              <Link key={artist.id} href={`/artist/${artist.id}`} className="dir-artist-card">
                <div className="dir-artist-img-wrap">
                  <img
                    src={getPortraitDataUrl(artist.id)}
                    alt={artist.name}
                    className="dir-artist-img"
                  />
                  <div className="dir-artist-img-overlay">
                    <span className="dir-artist-view-btn">View Profile →</span>
                  </div>
                  <div className="dir-artist-style-badge">
                    {STYLE_LABELS[style] || style}
                  </div>
                </div>
                <div className="dir-artist-info">
                  <h3 className="dir-artist-name">{artist.name}</h3>
                  {artist.tagline && <p className="dir-artist-tagline">{artist.tagline}</p>}
                  {artist.country && <span className="dir-artist-country">📍 {artist.country}</span>}
                  <div className="dir-artist-meta">
                    <span>{artistExhibits.length} exhibition{artistExhibits.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
