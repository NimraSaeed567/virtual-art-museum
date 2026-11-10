import { useState, useRef } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import './pages.css'

const STYLE_OPTIONS = ['expressionist', 'colorField', 'geometric', 'impressionist', 'lineArt', 'ascii']

export default function ArtworkSubmitPage() {
  const [, setLocation] = useLocation()
  const user = useStore(s => s.user)
  const profile = useStore(s => s.user)

  const [title, setTitle] = useState('')
  const [medium, setMedium] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [dimensions, setDimensions] = useState('')
  const [description, setDescription] = useState('')
  const [story, setStory] = useState('')
  const [styleTags, setStyleTags] = useState<string[]>([])
  const [priceSmall, setPriceSmall] = useState('')
  const [priceMedium, setPriceMedium] = useState('')
  const [priceLarge, setPriceLarge] = useState('')

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleStyle = (tag: string) =>
    setStyleTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { setLocation('/auth'); return }
    if (!title.trim()) { setError('Title is required.'); return }
    if (!imageFile) { setError('Please upload an image of your artwork.'); return }

    setLoading(true)
    setError(null)

    try {
      // Upload image
      const ext = imageFile.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('submissions').upload(filePath, imageFile)
      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(filePath)

      // Save submission
      const { error: insertErr } = await supabase.from('artwork_submissions').insert({
        artist_id: user.id,
        title: title.trim(),
        medium: medium.trim() || null,
        year: year ? parseInt(year) : null,
        dimensions: dimensions.trim() || null,
        description: description.trim() || null,
        story: story.trim() || null,
        image_url: urlData.publicUrl,
        style_tags: styleTags.length > 0 ? styleTags : null,
        price_small: priceSmall ? parseFloat(priceSmall) : null,
        price_medium: priceMedium ? parseFloat(priceMedium) : null,
        price_large: priceLarge ? parseFloat(priceLarge) : null,
      })
      if (insertErr) throw insertErr

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  if (submitted) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="sub-success">
          <div className="sub-success-icon">✓</div>
          <h2>Artwork Submitted!</h2>
          <p>Thank you for sharing your work with the Atelier Museum. Our curators will review your submission and be in touch within 5–7 business days.</p>
          <p style={{ color: 'var(--brand)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            You can track the status in Settings → My Works.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button className="stg-save-btn" onClick={() => { setSubmitted(false); setTitle(''); setMedium(''); setDescription(''); setStory(''); setImageFile(null); setImagePreview(null); }}>
              Submit Another
            </button>
            <button className="stg-nav-item" onClick={() => setLocation('/settings')}>
              View My Works
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <span className="dir-eyebrow">Artist Portal</span>
        <h1 className="page-title">Submit Your Artwork</h1>
        <p className="page-desc">Share your work with the Atelier Museum collection. Earn 50% from every print sold.</p>
      </div>

      {error && <div className="stg-alert stg-alert-error" style={{ marginBottom: '2rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="sub-form">
        {/* Section 1: Basic Info */}
        <div className="sub-section">
          <h3 className="sub-section-title">1. Artwork Details</h3>
          <div className="stg-field-row">
            <div className="stg-field" style={{ flex: 2 }}>
              <label>Title <span style={{ color: '#f87171' }}>*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. The Golden Hour" required />
            </div>
            <div className="stg-field">
              <label>Year</label>
              <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2024" min="1900" max={new Date().getFullYear()} />
            </div>
          </div>
          <div className="stg-field-row">
            <div className="stg-field">
              <label>Medium</label>
              <input type="text" value={medium} onChange={e => setMedium(e.target.value)} placeholder="e.g. Oil on Canvas, Digital, Photography" />
            </div>
            <div className="stg-field">
              <label>Dimensions</label>
              <input type="text" value={dimensions} onChange={e => setDimensions(e.target.value)} placeholder="e.g. 60 × 90 cm" />
            </div>
          </div>
        </div>

        {/* Section 2: Image Upload */}
        <div className="sub-section">
          <h3 className="sub-section-title">2. Artwork Image <span style={{ color: '#f87171' }}>*</span></h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Upload a high-resolution image. JPG or PNG, max 10MB recommended.</p>
          
          <div
            className={`sub-dropzone ${isDragging ? 'dragging' : ''} ${imagePreview ? 'has-image' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="sub-preview-img" />
            ) : (
              <div className="sub-dropzone-inner">
                <div className="sub-dropzone-icon">🖼️</div>
                <p>Drag & drop your image here, or <span style={{ color: 'var(--brand)' }}>click to browse</span></p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
          </div>
          {imagePreview && (
            <button type="button" className="stg-tag" style={{ marginTop: '0.75rem' }} onClick={() => { setImageFile(null); setImagePreview(null) }}>
              × Remove image
            </button>
          )}
        </div>

        {/* Section 3: Description & Story */}
        <div className="sub-section">
          <h3 className="sub-section-title">3. About This Work</h3>
          <div className="stg-field">
            <label>Short Description</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="A concise description of the artwork — what visitors will read in the exhibition." />
          </div>
          <div className="stg-field">
            <label>Artist Story</label>
            <textarea rows={5} value={story} onChange={e => setStory(e.target.value)} placeholder="What inspired this piece? Your process, emotions, or narrative behind it. This creates a deeper connection with collectors." />
          </div>
        </div>

        {/* Section 4: Style Tags */}
        <div className="sub-section">
          <h3 className="sub-section-title">4. Art Style</h3>
          <div className="stg-tag-group">
            {STYLE_OPTIONS.map(tag => (
              <button
                key={tag}
                type="button"
                className={`stg-tag ${styleTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleStyle(tag)}
              >
                {tag === 'colorField' ? 'Color Field' : tag === 'lineArt' ? 'Line Art' : tag.charAt(0).toUpperCase() + tag.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Section 5: Print Pricing */}
        <div className="sub-section">
          <h3 className="sub-section-title">5. Print Pricing (Optional)</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Set suggested retail prices for print sizes. Leave blank to use museum defaults. You earn 50% of each sale.</p>
          <div className="stg-field-row">
            <div className="stg-field">
              <label>Small (A4 / 8×10″)</label>
              <input type="number" value={priceSmall} onChange={e => setPriceSmall(e.target.value)} placeholder="e.g. 45" min="0" step="0.01" />
            </div>
            <div className="stg-field">
              <label>Medium (A3 / 12×16″)</label>
              <input type="number" value={priceMedium} onChange={e => setPriceMedium(e.target.value)} placeholder="e.g. 85" min="0" step="0.01" />
            </div>
            <div className="stg-field">
              <label>Large (A2 / 18×24″)</label>
              <input type="number" value={priceLarge} onChange={e => setPriceLarge(e.target.value)} placeholder="e.g. 150" min="0" step="0.01" />
            </div>
          </div>
        </div>

        <div className="sub-footer">
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            By submitting, you confirm you own the rights to this artwork and agree to the Atelier Museum's artist terms.
          </div>
          <button type="submit" className="stg-save-btn lg" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Artwork for Review →'}
          </button>
        </div>
      </form>
    </div>
  )
}
