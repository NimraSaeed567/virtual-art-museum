import { Link, useRoute } from 'wouter'
import { SAMPLE_MUSEUM } from '../data/museum'
import { getArtDataUrl } from '../textures/proceduralArt'
import './pages.css'

export default function HallPage() {
  const [match, params] = useRoute('/hall/:slug')
  
  if (!match) return null
  
  const hall = SAMPLE_MUSEUM.halls.find(h => h.id === params.slug)
  if (!hall) return <div className="page-container"><h1>Hall not found</h1></div>

  const rooms = SAMPLE_MUSEUM.rooms.filter(r => r.hallId === hall.id)

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="page-eyebrow">Museum Wing</span>
        <h1 className="page-title">{hall.title}</h1>
        <p className="page-desc">{hall.description}</p>
      </div>

      <div className="exhibit-grid">
        {rooms.map(room => {
          const exhibit = SAMPLE_MUSEUM.exhibitions.find(e => e.roomId === room.id)
          if (!exhibit) return null

          // Find the first artwork to use as a cover
          const coverArt = SAMPLE_MUSEUM.artworks.find(a => a.exhibitionId === exhibit.id)
          const artist = SAMPLE_MUSEUM.artists.find(a => a.id === exhibit.artistId)

          return (
            <Link key={room.id} href={`/exhibit/${exhibit.id}`} className="exhibit-card">
              {coverArt && <img src={getArtDataUrl(coverArt)} alt={exhibit.title} />}
              <div className="exhibit-card-body">
                <h3>{exhibit.title}</h3>
                <p>{artist?.name} — {room.title}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
