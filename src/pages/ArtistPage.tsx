import { useRoute, Link } from 'wouter'
import { SAMPLE_MUSEUM } from '../data/museum'
import { getPortraitDataUrl, getArtDataUrl } from '../textures/proceduralArt'
import { usePageMeta } from '../hooks/usePageMeta'
import './pages.css'

export default function ArtistPage() {
  const [match, params] = useRoute('/artist/:slug')
  
  if (!match) return null
  
  const artist = SAMPLE_MUSEUM.artists.find(a => a.id === params.slug)
  if (!artist) return <div className="page-container"><h1>Artist not found</h1></div>

  const exhibitions = SAMPLE_MUSEUM.exhibitions.filter(e => e.artistId === artist.id)

  usePageMeta({
    title: artist.name,
    description: artist.bio || artist.tagline,
    image: getPortraitDataUrl(artist.id),
  })

  return (
    <div className="page-container">
      <div className="artist-header">
        <img className="artist-portrait" src={getPortraitDataUrl(artist.id)} alt={artist.name} />
        <div className="artist-header-info">
          <h1>{artist.name}</h1>
          <div className="tagline">{artist.tagline}</div>
          <p className="bio">{artist.bio}</p>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: '4rem' }}>
        <h2 className="page-title" style={{ fontSize: '2rem' }}>Exhibitions</h2>
      </div>

      <div className="exhibit-grid">
        {exhibitions.map(exhibit => {
          const room = SAMPLE_MUSEUM.rooms.find(r => r.id === exhibit.roomId)
          const coverArt = SAMPLE_MUSEUM.artworks.find(a => a.exhibitionId === exhibit.id)
          
          return (
            <Link key={exhibit.id} href={`/exhibit/${exhibit.id}`} className="exhibit-card">
              {coverArt && <img src={getArtDataUrl(coverArt)} alt={exhibit.title} />}
              <div className="exhibit-card-body">
                <h3>{exhibit.title}</h3>
                <p>{room?.title}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
