import { useState } from 'react'
import { useRoute, Link } from 'wouter'
import { SAMPLE_MUSEUM, artistById } from '../data/museum'
import { getArtDataUrl } from '../textures/proceduralArt'
import { useStore } from '../store'
import { usePageMeta } from '../hooks/usePageMeta'
import './pages.css'

export default function ArtworkPage() {
  const [match, params] = useRoute('/artwork/:slug')
  const addToCart = useStore((s) => s.addToCart)
  const openCart = useStore((s) => s.openCart)
  const [sizeId, setSizeId] = useState('md')
  const [added, setAdded] = useState(false)
  
  if (!match) return null
  
  const art = SAMPLE_MUSEUM.artworks.find(a => a.id === params.slug)
  if (!art) return <div className="page-container"><h1>Artwork not found</h1></div>

  usePageMeta({
    title: art.title,
    description: art.story,
    image: getArtDataUrl(art),
  })

  const artist = artistById(SAMPLE_MUSEUM, art.artistId)
  const prints = art.commerce?.prints ?? []
  
  const priceFor = (id: string) => prints.find(p => p.id === id)?.price ?? 0

  const handleAdd = () => {
    addToCart(art.id, sizeId)
    setAdded(true)
    openCart()
  }

  return (
    <div className="page-container">
      <Link href={`/exhibit/${art.exhibitionId}`} className="btn-link" style={{ marginBottom: '2rem', display: 'inline-block' }}>
        ← Back to Exhibition
      </Link>
      
      <div className="artwork-detail">
        <div className="artwork-image-container">
          <img src={getArtDataUrl(art)} alt={art.title} />
        </div>
        
        <div className="artwork-info">
          <h1>{art.title}</h1>
          <div className="artist-name">
            <Link href={`/artist/${artist?.id}`}>{artist?.name}</Link> · {art.year}
          </div>
          
          <div className="artwork-story">
            {art.story}
          </div>

          <div className="commerce-section">
            <h3 style={{ marginBottom: '1rem' }}>Order Museum Print</h3>
            <div className="share-note" style={{ marginBottom: '1.5rem' }}>
              ♥ {Math.round(SAMPLE_MUSEUM.config.artistShare * 100)}% of this sale goes directly to {artist?.name.split(' ')[0]}
            </div>
            
            <div className="sizes">
              {prints.map((s) => (
                <label key={s.id} className={`size-opt ${sizeId === s.id ? 'sel' : ''}`}>
                  <input
                    type="radio"
                    name="size"
                    checked={sizeId === s.id}
                    onChange={() => {
                      setSizeId(s.id)
                      setAdded(false)
                    }}
                  />
                  <span>{s.label}</span>
                  <b>${s.price}</b>
                </label>
              ))}
            </div>
            
            <button
              className="btn-primary lg"
              style={{ width: '100%', marginTop: '2rem' }}
              onClick={handleAdd}
            >
              {added ? '✓ Added to cart' : `Add to cart — $${priceFor(sizeId)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
