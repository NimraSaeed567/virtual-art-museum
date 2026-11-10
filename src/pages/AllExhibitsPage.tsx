import { useState } from 'react'
import { Link } from 'wouter'
import { SAMPLE_MUSEUM } from '../data/museum'
import { getArtDataUrl } from '../textures/proceduralArt'
import './pages.css'

const STATUS_LABELS: Record<string, string> = {
  permanent: 'Permanent Collection',
  current: 'On View Now',
  upcoming: 'Opening Soon',
  past: 'Past Exhibitions',
}

const STATUS_DESC: Record<string, string> = {
  permanent: 'The enduring works at the heart of the Atelier Museum.',
  current: 'Step inside — these exhibitions are alive and waiting for you.',
  upcoming: 'Mark your calendar. These works are on their way.',
  past: 'A record of the conversations we have had with art.',
}

const STATUS_ORDER = ['permanent', 'current', 'upcoming', 'past']

export default function AllExhibitsPage() {
  const [activeStatus, setActiveStatus] = useState<string | null>(null)

  // Group exhibitions by status
  const grouped = SAMPLE_MUSEUM.exhibitions.reduce((acc, e) => {
    const status = e.status || 'current'
    if (!acc[status]) acc[status] = []
    acc[status].push(e)
    return acc
  }, {} as Record<string, typeof SAMPLE_MUSEUM.exhibitions>)

  const displayedExhibits = activeStatus
    ? (grouped[activeStatus] || [])
    : [...(grouped['permanent'] || []), ...(grouped['current'] || []), ...(grouped['upcoming'] || []), ...(grouped['past'] || [])]

  // Featured exhibition: first current or permanent one
  const featured = SAMPLE_MUSEUM.exhibitions.find(e => e.status === 'current' || e.status === 'permanent')
  const featuredArt = featured ? SAMPLE_MUSEUM.artworks.find(a => a.exhibitionId === featured.id) : null
  const featuredArtist = featured ? SAMPLE_MUSEUM.artists.find(a => a.id === featured.artistId) : null

  return (
    <div className="dir-page">
      {/* Featured Hero */}
      {featured && featuredArt && (
        <div className="dir-exhibits-hero">
          <div className="dir-exhibits-hero-img">
            <img src={getArtDataUrl(featuredArt)} alt={featured.title} />
          </div>
          <Link href={`/exhibit/${featured.id}`} className="dir-exhibits-hero-overlay">
            <div className="dir-exhibits-hero-content">
              <span className="dir-eyebrow">Featured Exhibition</span>
              <h1 className="dir-hero-title">{featured.title}</h1>
              {featuredArtist && (
                <p className="dir-hero-sub">By <strong>{featuredArtist.name}</strong></p>
              )}
            </div>
          </Link>
        </div>
      )}

      <div className="dir-body">
        {/* Stats Row */}
        <div className="dir-stats-row">
          {STATUS_ORDER.map(s => (
            <div key={s} className="dir-stats-card">
              <span className="dir-stat-num">{grouped[s]?.length ?? 0}</span>
              <span className="dir-stat-label">{STATUS_LABELS[s]}</span>
            </div>
          ))}
        </div>

        {/* Filter Pills */}
        <div className="dir-filters">
          <button
            className={`dir-pill ${activeStatus === null ? 'active' : ''}`}
            onClick={() => setActiveStatus(null)}
          >
            All Exhibitions
          </button>
          {STATUS_ORDER.filter(s => (grouped[s]?.length ?? 0) > 0).map(s => (
            <button
              key={s}
              className={`dir-pill ${activeStatus === s ? 'active' : ''}`}
              onClick={() => setActiveStatus(s)}
            >
              <span className={`dir-status-dot dir-status-${s}`} />
              {STATUS_LABELS[s]}
              <span className="dir-pill-count">{grouped[s]?.length}</span>
            </button>
          ))}
        </div>

        {/* Active Status description */}
        {activeStatus && (
          <div className="dir-style-banner">
            <h2>{STATUS_LABELS[activeStatus]}</h2>
            <p>{STATUS_DESC[activeStatus]}</p>
          </div>
        )}

        {/* Exhibition Grid */}
        <div className="dir-exhibits-grid">
          {displayedExhibits.map((exhibit) => {
            const artist = SAMPLE_MUSEUM.artists.find(a => a.id === exhibit.artistId)
            const room = SAMPLE_MUSEUM.rooms.find(r => r.id === exhibit.roomId)
            const coverArt = SAMPLE_MUSEUM.artworks.find(a => a.exhibitionId === exhibit.id)
            const status = exhibit.status || 'active'

            return (
              <Link key={exhibit.id} href={`/exhibit/${exhibit.id}`} className="dir-exhibit-card">
                <div className="dir-exhibit-img-wrap">
                  {coverArt ? (
                    <img src={getArtDataUrl(coverArt)} alt={exhibit.title} className="dir-exhibit-img" />
                  ) : (
                    <div className="dir-exhibit-img-placeholder">No Preview</div>
                  )}
                  <div className={`dir-exhibit-status dir-status-${status}`}>
                    <span className={`dir-status-dot dir-status-${status}`} />
                    {STATUS_LABELS[status]}
                  </div>
                </div>
                <div className="dir-exhibit-info">
                  <p className="dir-exhibit-artist">{artist?.name}</p>
                  <h3 className="dir-exhibit-title">{exhibit.title}</h3>
                  {room && <span className="dir-exhibit-room">📍 {room.title}</span>}
                  <div className="dir-exhibit-footer">
                    <span className="dir-exhibit-cta">Explore →</span>
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
