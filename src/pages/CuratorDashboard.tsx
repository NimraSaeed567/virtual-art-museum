import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import RequireAdmin from '../components/RequireAdmin'
import './pages.css'

const ROOMS = [
  { id: 'r-1', title: 'Main Hall' },
  { id: 'r-2', title: 'Exhibit I' },
  { id: 'r-3', title: 'Exhibit II' },
  { id: 'r-4', title: 'Exhibit III' },
  { id: 'r-5', title: 'Exhibit IV' },
]

type Submission = {
  id: string
  title: string
  medium?: string
  year?: number
  dimensions?: string
  description?: string
  story?: string
  image_url?: string
  price_small?: number
  price_medium?: number
  price_large?: number
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'archived'
  reviewer_notes?: string
  created_at: string
  artist_id: string
  style_tags?: string[]
  profiles?: { full_name?: string; email?: string; avatar_url?: string }
}

const STATUS_TABS = [
  { key: 'pending', label: '🕐 Pending', color: '#facc15' },
  { key: 'under_review', label: '🔍 Under Review', color: '#60a5fa' },
  { key: 'approved', label: '✅ Approved', color: '#4ade80' },
  { key: 'rejected', label: '❌ Rejected', color: '#f87171' },
]

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: '#facc15', under_review: '#60a5fa', approved: '#4ade80', rejected: '#f87171', archived: '#94a3b8'
  }
  const labels: Record<string, string> = {
    pending: 'Pending', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected', archived: 'Archived'
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600,
      background: `${colors[status]}18`, color: colors[status],
      border: `1px solid ${colors[status]}40`
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[status] }} />
      {labels[status] ?? status}
    </span>
  )
}

function PublishModal({ submission, onClose, onPublished }: {
  submission: Submission
  onClose: () => void
  onPublished: () => void
}) {
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0].id)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const addNotification = useStore(s => s.addNotification)

  const handlePublish = async () => {
    setLoading(true)
    // Update submission status to approved
    const { error: updateError } = await supabase
      .from('artwork_submissions')
      .update({ status: 'approved', reviewer_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', submission.id)

    if (updateError) { alert('Failed to update status: ' + updateError.message); setLoading(false); return }

    // Create published_artworks entry
    const { error: publishError } = await supabase
      .from('published_artworks')
      .insert([{ submission_id: submission.id, artist_id: submission.artist_id, room_id: selectedRoom }])

    if (publishError) { alert('Failed to publish: ' + publishError.message); setLoading(false); return }

    addNotification(`"${submission.title}" published to ${ROOMS.find(r => r.id === selectedRoom)?.title}!`, 'success')
    setLoading(false)
    onPublished()
    onClose()
  }

  return (
    <div className="curator-modal-backdrop" onClick={onClose}>
      <div className="curator-modal" onClick={e => e.stopPropagation()}>
        <h2>Publish to Gallery</h2>
        <p className="curator-modal-sub">Select a room to publish <strong>{submission.title}</strong> into the live 3D gallery.</p>

        <label className="curator-field-label">Target Room</label>
        <select className="curator-select" value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
          {ROOMS.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>

        <label className="curator-field-label">Curator Notes (optional)</label>
        <textarea
          className="curator-textarea"
          placeholder="e.g. Great use of colour. Approved for Main Hall opening."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
        />

        <div className="curator-modal-actions">
          <button className="curator-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="curator-btn-approve" onClick={handlePublish} disabled={loading}>
            {loading ? 'Publishing…' : '✓ Publish to Gallery'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RejectModal({ submission, onClose, onRejected }: {
  submission: Submission
  onClose: () => void
  onRejected: () => void
}) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReject = async () => {
    if (!notes.trim()) { alert('Please provide rejection notes for the artist.'); return }
    setLoading(true)
    const { error } = await supabase
      .from('artwork_submissions')
      .update({ status: 'rejected', reviewer_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', submission.id)
    if (error) { alert('Failed: ' + error.message); setLoading(false); return }
    setLoading(false)
    onRejected()
    onClose()
  }

  return (
    <div className="curator-modal-backdrop" onClick={onClose}>
      <div className="curator-modal" onClick={e => e.stopPropagation()}>
        <h2>Reject Submission</h2>
        <p className="curator-modal-sub">Provide feedback to the artist for <strong>{submission.title}</strong>.</p>

        <label className="curator-field-label">Feedback for Artist <span style={{ color: '#f87171' }}>*</span></label>
        <textarea
          className="curator-textarea"
          placeholder="e.g. The work shows promise but the resolution is too low for print quality. Please resubmit at 300dpi."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
        />

        <div className="curator-modal-actions">
          <button className="curator-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="curator-btn-reject" onClick={handleReject} disabled={loading}>
            {loading ? 'Saving…' : '✕ Reject & Notify'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SubmissionCard({ submission, onAction }: { submission: Submission; onAction: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [publishModal, setPublishModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const addNotification = useStore(s => s.addNotification)

  const markUnderReview = async () => {
    await supabase
      .from('artwork_submissions')
      .update({ status: 'under_review', updated_at: new Date().toISOString() })
      .eq('id', submission.id)
    addNotification(`"${submission.title}" marked as Under Review`)
    onAction()
  }

  return (
    <div className="curator-card">
      {/* Image */}
      <div className="curator-card-img">
        {submission.image_url ? (
          <img src={submission.image_url} alt={submission.title} />
        ) : (
          <div className="curator-img-placeholder">
            <span>No Image</span>
          </div>
        )}
        <div className="curator-card-status-badge">
          <StatusBadge status={submission.status} />
        </div>
      </div>

      {/* Info */}
      <div className="curator-card-body">
        <div className="curator-card-artist">
          <div className="curator-avatar">
            {submission.profiles?.avatar_url
              ? <img src={submission.profiles.avatar_url} alt="" />
              : <span>{(submission.profiles?.full_name?.[0] || 'A').toUpperCase()}</span>
            }
          </div>
          <div>
            <p className="curator-artist-name">{submission.profiles?.full_name ?? 'Unknown Artist'}</p>
            <p className="curator-submit-date">{new Date(submission.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <h3 className="curator-artwork-title">{submission.title}</h3>

        <div className="curator-meta-row">
          {submission.medium && <span className="curator-meta-tag">{submission.medium}</span>}
          {submission.year && <span className="curator-meta-tag">{submission.year}</span>}
          {submission.dimensions && <span className="curator-meta-tag">{submission.dimensions}</span>}
        </div>

        {/* Pricing */}
        <div className="curator-pricing">
          {submission.price_small && <span>S: <strong>${submission.price_small}</strong></span>}
          {submission.price_medium && <span>M: <strong>${submission.price_medium}</strong></span>}
          {submission.price_large && <span>L: <strong>${submission.price_large}</strong></span>}
        </div>

        {/* Expandable description */}
        {(submission.description || submission.story) && (
          <div className="curator-expand">
            <button className="curator-expand-btn" onClick={() => setExpanded(!expanded)}>
              {expanded ? '▲ Hide Details' : '▼ Show Description & Story'}
            </button>
            {expanded && (
              <div className="curator-expand-body">
                {submission.description && <p><strong>Description:</strong> {submission.description}</p>}
                {submission.story && <p><strong>Artist Statement:</strong> {submission.story}</p>}
                {submission.reviewer_notes && (
                  <p className="curator-notes-text"><strong>Curator Notes:</strong> {submission.reviewer_notes}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {(submission.status === 'pending' || submission.status === 'under_review') && (
          <div className="curator-actions">
            {submission.status === 'pending' && (
              <button className="curator-btn-review" onClick={markUnderReview}>🔍 Mark Under Review</button>
            )}
            <button className="curator-btn-approve" onClick={() => setPublishModal(true)}>✓ Approve & Publish</button>
            <button className="curator-btn-reject" onClick={() => setRejectModal(true)}>✕ Reject</button>
          </div>
        )}
      </div>

      {publishModal && (
        <PublishModal submission={submission} onClose={() => setPublishModal(false)} onPublished={onAction} />
      )}
      {rejectModal && (
        <RejectModal submission={submission} onClose={() => setRejectModal(false)} onRejected={onAction} />
      )}
    </div>
  )
}

function CuratorContent() {
  const [activeTab, setActiveTab] = useState('pending')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<Record<string, number>>({})

  const fetchSubmissions = async (status: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('artwork_submissions')
      .select('*, profiles:artist_id(full_name, avatar_url)')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSubmissions(data as Submission[])
    }
    setLoading(false)
  }

  const fetchCounts = async () => {
    const statuses = ['pending', 'under_review', 'approved', 'rejected']
    const results = await Promise.all(
      statuses.map(s => supabase.from('artwork_submissions').select('id', { count: 'exact', head: true }).eq('status', s))
    )
    const newCounts: Record<string, number> = {}
    statuses.forEach((s, i) => { newCounts[s] = results[i].count ?? 0 })
    setCounts(newCounts)
  }

  useEffect(() => {
    fetchSubmissions(activeTab)
    fetchCounts()
  }, [activeTab])

  return (
    <div className="curator-page">
      {/* Header */}
      <div className="curator-header">
        <div>
          <span className="curator-eyebrow">Admin Portal</span>
          <h1 className="curator-title">Curator Dashboard</h1>
          <p className="curator-subtitle">Review, curate, and publish artist submissions to the live gallery.</p>
        </div>
        <Link href="/submit-artwork" className="curator-header-btn">+ Submit as Artist</Link>
      </div>

      {/* Stats */}
      <div className="curator-stats">
        {STATUS_TABS.map(tab => (
          <div key={tab.key} className="curator-stat-card" style={{ borderColor: `${tab.color}30` }}>
            <span className="curator-stat-num" style={{ color: tab.color }}>{counts[tab.key] ?? 0}</span>
            <span className="curator-stat-label">{tab.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="curator-tabs">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            className={`curator-tab ${activeTab === tab.key ? 'active' : ''}`}
            style={activeTab === tab.key ? { borderColor: tab.color, color: tab.color } : {}}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {(counts[tab.key] ?? 0) > 0 && (
              <span className="curator-tab-badge" style={activeTab === tab.key ? { background: tab.color, color: '#000' } : {}}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="curator-loading">
          <div className="curator-spinner" />
          <p>Loading submissions…</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="curator-empty">
          <p>No {activeTab.replace('_', ' ')} submissions.</p>
        </div>
      ) : (
        <div className="curator-grid">
          {submissions.map(s => (
            <SubmissionCard key={s.id} submission={s} onAction={() => { fetchSubmissions(activeTab); fetchCounts() }} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CuratorDashboard() {
  return (
    <RequireAdmin>
      <CuratorContent />
    </RequireAdmin>
  )
}
