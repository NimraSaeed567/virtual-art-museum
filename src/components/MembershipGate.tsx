import { useStore, type Membership } from '../store'

const TIERS: {
  id: Membership
  name: string
  title: string
  tagline: string
  perks: string[]
  cta: string
  gold?: boolean
}[] = [
  {
    id: 'normal',
    name: 'General Admission',
    title: 'The Main Halls',
    tagline: 'The museum as it stands — five open galleries, free to walk.',
    perks: ['Main Hall + 4 artist wings', '25 original prints on view', 'Free, always'],
    cta: 'Enter General Admission',
  },
  {
    id: 'gold',
    name: 'Gold Membership',
    title: 'The Grand Salon',
    tagline: 'A private wing built for it — marble, crystal, and velvet rope.',
    perks: ['Exclusive marble atrium', 'Crystal chandelier & fountain', 'First look at every new drop'],
    cta: 'Enter the Grand Salon',
    gold: true,
  },
]

export default function MembershipGate() {
  const setMembership = useStore((s) => s.setMembership)
  const leave = useStore((s) => s.leave)

  return (
    <div className="overlay membership-gate">
      <div className="membership-card">
        <div className="eyebrow">Choose your visit</div>
        <h1>How would you like to walk in?</h1>
        <p className="lede">Pick a membership tier — you can always leave and switch later.</p>

        <div className="tier-grid">
          {TIERS.map((t) => (
            <button
              key={t.id}
              className={`tier-card ${t.gold ? 'gold' : ''}`}
              onClick={() => setMembership(t.id)}
            >
              {t.gold && <span className="tier-badge">Most exclusive</span>}
              <div className="tier-name">{t.name}</div>
              <div className="tier-title">{t.title}</div>
              <p className="tier-tagline">{t.tagline}</p>
              <ul className="tier-perks">
                {t.perks.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <span className="tier-cta">{t.cta} →</span>
            </button>
          ))}
        </div>

        <button className="btn-link" onClick={leave}>← Back to homepage</button>
      </div>
    </div>
  )
}
