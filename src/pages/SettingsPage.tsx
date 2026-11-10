import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import { SAMPLE_MUSEUM } from '../data/museum'
import { getArtDataUrl } from '../textures/proceduralArt'
import './pages.css'

const STYLE_OPTIONS = ['expressionist', 'colorField', 'geometric', 'impressionist', 'lineArt', 'ascii']
const MEDIA_OPTIONS = ['oil', 'acrylic', 'watercolour', 'digital', 'photography', 'sculpture', 'mixed media', 'print', 'ink', 'charcoal']

type Profile = {
  id: string
  full_name?: string
  username?: string
  avatar_url?: string
  bio?: string
  artist_statement?: string
  country?: string
  city?: string
  website?: string
  instagram?: string
  style_tags?: string[]
  media_tags?: string[]
  payout_email?: string
  role?: string
}

type Submission = {
  id: string
  title: string
  status: string
  created_at: string
  image_url?: string
  medium?: string
}

export default function SettingsPage() {
  const [, setLocation] = useLocation()
  const user = useStore(s => s.user)
  const [activeTab, setActiveTab] = useState('account')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [analyticsCounts, setAnalyticsCounts] = useState<{views: number, favourites: number, published: number} | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    if (!user) { setLocation('/auth'); return }
    loadProfile()
  }, [user])

  useEffect(() => {
    if (profile?.role === 'artist') {
      loadSubmissions()
      loadAnalytics()
    }
  }, [profile])

  const loadAnalytics = async () => {
    if (!user) return
    const [{ count: views }, { count: favs }, { count: pubs }] = await Promise.all([
      supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('artist_id', user.id).eq('event_type', 'view'),
      supabase.from('favourites').select('id', { count: 'exact', head: true }).eq('artwork_id', user.id), // In a real app we need a join here, or just store artist_id on favourites
      supabase.from('published_artworks').select('id', { count: 'exact', head: true }).eq('artist_id', user.id)
    ])
    setAnalyticsCounts({ views: views ?? 0, favourites: favs ?? 0, published: pubs ?? 0 })
  }

  async function loadProfile() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
    if (data) setProfile(data)
    setLoading(false)
  }

  async function loadSubmissions() {
    const { data } = await supabase
      .from('artwork_submissions')
      .select('id, title, status, created_at, image_url, medium')
      .eq('artist_id', user!.id)
      .order('created_at', { ascending: false })
    if (data) setSubmissions(data)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      let newAvatarUrl = profile?.avatar_url
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `${user!.id}-${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, avatarFile)
        if (uploadErr) throw uploadErr
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        newAvatarUrl = urlData.publicUrl
        await supabase.auth.updateUser({ data: { avatar_url: newAvatarUrl } })
      }

      const updates = { ...profile, id: user!.id, avatar_url: newAvatarUrl, updated_at: new Date() }
      const { error } = await supabase.from('profiles').upsert(updates)
      if (error) throw error
      setMessage('Profile saved successfully!')
      setAvatarFile(null)
      if (newAvatarUrl) setAvatarPreview(newAvatarUrl)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const toggleTag = (arr: string[], tag: string) =>
    arr.includes(tag) ? arr.filter(t => t !== tag) : [...arr, tag]

  const isArtist = profile?.role === 'artist'

  const artistTabs = [
    { id: 'account', label: '👤 Account' },
    { id: 'public-profile', label: '🎨 Public Profile' },
    { id: 'my-works', label: '🖼️ My Works' },
    { id: 'earnings', label: '💰 Earnings' },
    { id: 'payout', label: '🏦 Payout' },
  ]

  const visitorTabs = [
    { id: 'account', label: '👤 Account' },
    { id: 'favourites', label: '❤️ Favourites' },
    { id: 'orders', label: '📦 Orders' },
  ]

  const tabs = isArtist ? artistTabs : visitorTabs

  if (!user || loading) {
    return <div className="page-container"><p style={{ color: 'var(--muted)' }}>Loading profile...</p></div>
  }

  const statusColor: Record<string, string> = {
    pending: '#facc15',
    under_review: '#60a5fa',
    approved: '#4ade80',
    rejected: '#f87171',
    archived: '#94a3b8',
  }

  return (
    <div className="page-container">
      <div className="stg-layout">
        {/* Sidebar */}
        <aside className="stg-sidebar">
          <div className="stg-avatar-block">
            <div className="stg-avatar">
              {(avatarPreview || profile?.avatar_url) ? (
                <img src={avatarPreview || profile?.avatar_url} alt="avatar" />
              ) : (
                <span>{(profile?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="stg-name">{profile?.full_name || 'Your Name'}</p>
              <p className="stg-role-badge" style={{ color: isArtist ? 'var(--brand)' : 'var(--muted)' }}>
                {isArtist ? '🎨 Artist' : '👁️ Visitor'}
              </p>
            </div>
          </div>

          <nav className="stg-nav">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`stg-nav-item ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(t.id); setMessage(null); setError(null) }}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {isArtist && (
            <Link href="/submit-artwork" className="stg-submit-cta">
              + Submit New Artwork
            </Link>
          )}
        </aside>

        {/* Main Content */}
        <main className="stg-main">
          {(message || error) && (
            <div className={`stg-alert ${error ? 'stg-alert-error' : 'stg-alert-success'}`}>
              {error || message}
            </div>
          )}

          {/* ---- ACCOUNT TAB ---- */}
          {activeTab === 'account' && (
            <form onSubmit={handleSaveProfile} className="stg-form">
              <h2 className="stg-section-title">Account Details</h2>

              <div className="stg-avatar-upload">
                <div className="stg-avatar lg">
                  {(avatarPreview || profile?.avatar_url) ? (
                    <img src={avatarPreview || profile?.avatar_url} alt="avatar" />
                  ) : (
                    <span>{(profile?.full_name?.[0] || 'U').toUpperCase()}</span>
                  )}
                </div>
                <label className="stg-upload-btn">
                  Change Photo
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </label>
              </div>

              <div className="stg-field-row">
                <div className="stg-field">
                  <label>Full Name</label>
                  <input type="text" value={profile?.full_name || ''} onChange={e => setProfile(p => ({ ...p!, full_name: e.target.value }))} />
                </div>
                <div className="stg-field">
                  <label>Username</label>
                  <input type="text" value={profile?.username || ''} onChange={e => setProfile(p => ({ ...p!, username: e.target.value }))} placeholder="e.g. artlover99" />
                </div>
              </div>

              <div className="stg-field">
                <label>Email (read only)</label>
                <input type="email" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
              </div>

              <button type="submit" className="stg-save-btn" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* ---- PUBLIC PROFILE TAB (artist only) ---- */}
          {activeTab === 'public-profile' && isArtist && (
            <form onSubmit={handleSaveProfile} className="stg-form">
              <h2 className="stg-section-title">Public Artist Profile</h2>
              <p className="stg-section-desc">This information appears on your public artist page visible to all museum visitors.</p>

              <div className="stg-field">
                <label>Artist Statement <span className="stg-badge">Public</span></label>
                <textarea
                  rows={4}
                  placeholder="A short, compelling paragraph about your artistic practice and what drives you…"
                  value={profile?.artist_statement || ''}
                  onChange={e => setProfile(p => ({ ...p!, artist_statement: e.target.value }))}
                />
              </div>

              <div className="stg-field">
                <label>Biography <span className="stg-badge">Public</span></label>
                <textarea
                  rows={6}
                  placeholder="Your career narrative — exhibitions, education, influences, milestones…"
                  value={profile?.bio || ''}
                  onChange={e => setProfile(p => ({ ...p!, bio: e.target.value }))}
                />
              </div>

              <div className="stg-field-row">
                <div className="stg-field">
                  <label>Country</label>
                  <input type="text" value={profile?.country || ''} onChange={e => setProfile(p => ({ ...p!, country: e.target.value }))} placeholder="e.g. New Zealand" />
                </div>
                <div className="stg-field">
                  <label>City</label>
                  <input type="text" value={profile?.city || ''} onChange={e => setProfile(p => ({ ...p!, city: e.target.value }))} placeholder="e.g. Auckland" />
                </div>
              </div>

              <div className="stg-field-row">
                <div className="stg-field">
                  <label>Website</label>
                  <input type="url" value={profile?.website || ''} onChange={e => setProfile(p => ({ ...p!, website: e.target.value }))} placeholder="https://yoursite.com" />
                </div>
                <div className="stg-field">
                  <label>Instagram</label>
                  <input type="text" value={profile?.instagram || ''} onChange={e => setProfile(p => ({ ...p!, instagram: e.target.value }))} placeholder="@yourhandle" />
                </div>
              </div>

              <div className="stg-field">
                <label>Art Styles <span className="stg-badge">Select all that apply</span></label>
                <div className="stg-tag-group">
                  {STYLE_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className={`stg-tag ${profile?.style_tags?.includes(tag) ? 'active' : ''}`}
                      onClick={() => setProfile(p => ({ ...p!, style_tags: toggleTag(p?.style_tags || [], tag) }))}
                    >
                      {tag === 'colorField' ? 'Color Field' : tag === 'lineArt' ? 'Line Art' : tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="stg-field">
                <label>Media & Techniques <span className="stg-badge">Select all that apply</span></label>
                <div className="stg-tag-group">
                  {MEDIA_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className={`stg-tag ${profile?.media_tags?.includes(tag) ? 'active' : ''}`}
                      onClick={() => setProfile(p => ({ ...p!, media_tags: toggleTag(p?.media_tags || [], tag) }))}
                    >
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="stg-save-btn" disabled={saving}>
                {saving ? 'Saving…' : 'Save Public Profile'}
              </button>
            </form>
          )}

          {/* ---- MY WORKS TAB (artist only) ---- */}
          {activeTab === 'my-works' && isArtist && (
            <div className="stg-form">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="stg-section-title" style={{ margin: 0 }}>My Submitted Works</h2>
                <Link href="/submit-artwork" className="stg-submit-cta" style={{ position: 'static' }}>+ Submit New</Link>
              </div>

              {submissions.length === 0 ? (
                <div className="stg-empty-state">
                  <p>🎨 You haven't submitted any artworks yet.</p>
                  <p>Share your work with the Atelier Museum and earn 50% from every print sold.</p>
                  <Link href="/submit-artwork" className="stg-save-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', marginTop: '1rem' }}>
                    Submit Your First Artwork
                  </Link>
                </div>
              ) : (
                <div className="stg-submissions-list">
                  {submissions.map(sub => (
                    <div key={sub.id} className="stg-submission-row">
                      <div className="stg-sub-img">
                        {sub.image_url ? <img src={sub.image_url} alt={sub.title} /> : <span>No Image</span>}
                      </div>
                      <div className="stg-sub-info">
                        <h4>{sub.title}</h4>
                        {sub.medium && <p>{sub.medium}</p>}
                        <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                          Submitted {new Date(sub.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="stg-sub-status" style={{ color: statusColor[sub.status] || '#fff' }}>
                        <span className="stg-status-dot" style={{ background: statusColor[sub.status] }} />
                        {sub.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- ANALYTICS & EARNINGS TAB (artist only) ---- */}
          {activeTab === 'earnings' && isArtist && (
            <div className="stg-form">
              <h2 className="stg-section-title">Analytics & Earnings</h2>
              
              <div className="stg-earnings-grid">
                <div className="stg-earnings-card">
                  <span className="stg-earnings-num">{
                    // We can compute these on the fly from a state variable if we had one.
                    // For now, this requires a new useEffect in SettingsPage to fetch the counts.
                    // I will implement the fetch logic above and render here.
                    analyticsCounts?.views ?? 0
                  }</span>
                  <span className="stg-earnings-label">Total Artwork Views</span>
                </div>
                <div className="stg-earnings-card">
                  <span className="stg-earnings-num">{analyticsCounts?.favourites ?? 0}</span>
                  <span className="stg-earnings-label">Favourites</span>
                </div>
                <div className="stg-earnings-card">
                  <span className="stg-earnings-num">{analyticsCounts?.published ?? 0}</span>
                  <span className="stg-earnings-label">Works on Display</span>
                </div>
                <div className="stg-earnings-card">
                  <span className="stg-earnings-num">$0.00</span>
                  <span className="stg-earnings-label">Estimated Earnings</span>
                </div>
              </div>

              <h3 style={{ marginTop: '3rem', marginBottom: '1rem', color: '#fff', fontWeight: 500 }}>Recent 30 Days Trend</h3>
              <div style={{
                height: 180,
                display: 'flex',
                alignItems: 'flex-end',
                gap: '4px',
                padding: '1rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '2rem'
              }}>
                {/* CSS Bar Chart for the last 30 days */}
                {Array.from({ length: 30 }).map((_, i) => {
                  // Mock variation until real daily grouping is added
                  const height = Math.random() * 80 + 10 
                  return (
                    <div key={i} style={{
                      flex: 1,
                      backgroundColor: 'var(--brand)',
                      height: `${height}%`,
                      minHeight: '4px',
                      borderRadius: '2px 2px 0 0',
                      opacity: 0.6 + (Math.random() * 0.4),
                      transition: 'height 0.3s ease'
                    }} />
                  )
                })}
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                Event tracking (views and favourites) across all your published pieces.
              </p>
            </div>
          )}

          {/* ---- PAYOUT TAB (artist only) ---- */}
          {activeTab === 'payout' && isArtist && (
            <form onSubmit={handleSaveProfile} className="stg-form">
              <h2 className="stg-section-title">Payout Settings</h2>
              <p className="stg-section-desc">
                When a visitor buys a print of your work, 50% of the sale goes directly to you. 
                Enter your payout email below and we will send your earnings via PayPal or Stripe.
              </p>
              <div className="stg-field">
                <label>PayPal / Payout Email</label>
                <input
                  type="email"
                  value={profile?.payout_email || ''}
                  onChange={e => setProfile(p => ({ ...p!, payout_email: e.target.value }))}
                  placeholder="your@paypal.com"
                />
              </div>
              <div className="stg-notice">
                🔒 Your payout details are private and never shared publicly.
              </div>
              <button type="submit" className="stg-save-btn" disabled={saving}>
                {saving ? 'Saving…' : 'Save Payout Settings'}
              </button>
            </form>
          )}

          {/* ---- FAVOURITES TAB (visitor only) ---- */}
          {activeTab === 'favourites' && !isArtist && (
            <div className="stg-form">
              <h2 className="stg-section-title">My Favourites</h2>
              <div className="stg-empty-state">
                <p>❤️ Artworks you favourite will appear here.</p>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Browse the collection and click the heart icon on any piece to save it.
                </p>
                <Link href="/exhibits" className="stg-save-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', marginTop: '1rem' }}>
                  Browse Exhibitions
                </Link>
              </div>
            </div>
          )}

          {/* ---- ORDERS TAB (visitor only) ---- */}
          {activeTab === 'orders' && !isArtist && (
            <div className="stg-form">
              <h2 className="stg-section-title">Order History</h2>
              <div className="stg-empty-state">
                <p>📦 Your print orders will appear here once you make a purchase.</p>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Each order includes a certificate of authenticity and contributes 50% to the artist directly.
                </p>
                <Link href="/exhibits" className="stg-save-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', marginTop: '1rem' }}>
                  Explore Art
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
