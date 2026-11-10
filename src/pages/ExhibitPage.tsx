import { Link, useRoute } from 'wouter'
import { SAMPLE_MUSEUM, artistById } from '../data/museum'
import { getArtDataUrl } from '../textures/proceduralArt'
import { usePageMeta } from '../hooks/usePageMeta'
import './pages.css'

export default function ExhibitPage() {
  const [match, params] = useRoute('/exhibit/:slug')
  
  if (!match) return null
  
  const exhibit = SAMPLE_MUSEUM.exhibitions.find(e => e.id === params.slug)
  if (!exhibit) return <div className="page-container"><h1>Exhibition not found</h1></div>

  const artist = artistById(SAMPLE_MUSEUM, exhibit.artistId)
  const room = SAMPLE_MUSEUM.rooms.find(r => r.id === exhibit.roomId)
  const artworks = SAMPLE_MUSEUM.artworks.filter(a => a.exhibitionId === exhibit.id)

  usePageMeta({
    title: exhibit.title,
    description: exhibit.story,
    image: artworks.length > 0 ? getArtDataUrl(artworks[0]) : undefined,
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="page-eyebrow">{room?.title} · {artist?.name}</span>
        <h1 className="page-title">{exhibit.title}</h1>
        <p className="page-desc">{exhibit.story}</p>
      </div>

      <div className="artwork-grid">
        {artworks.map(art => (
          <Link key={art.id} href={`/artwork/${art.id}`} className="artwork-card">
            <img src={getArtDataUrl(art)} alt={art.title} loading="lazy" />
            <div className="artwork-meta">
              <div>
                <h4>{art.title}</h4>
                <span>{art.year}</span>
              </div>
              <span>${art.commerce?.prints?.[0]?.price ?? 0}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
