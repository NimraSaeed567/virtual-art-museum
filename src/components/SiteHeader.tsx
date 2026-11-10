import { Link } from 'wouter'
import { useStore } from '../store'
import { useState, useEffect, useRef } from 'react'

export default function SiteHeader() {
  const enter = useStore((s) => s.enter)
  const openCart = useStore((s) => s.openCart)
  const cartCount = useStore((s) => s.cart.reduce((n, c) => n + c.qty, 0))
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) window.addEventListener('click', onClickOutside)
    return () => window.removeEventListener('click', onClickOutside)
  }, [profileOpen])

  const user = useStore(s => s.user)
  const [avatar, setAvatar] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      if (user.user_metadata?.avatar_url) {
        setAvatar(user.user_metadata.avatar_url)
      } else {
        import('../lib/supabase').then(({ supabase }) => {
          supabase.from('profiles').select('avatar_url').eq('id', user.id).single().then(({ data }) => {
            if (data?.avatar_url) {
              setAvatar(data.avatar_url)
              // Sync it back to metadata for next time
              supabase.auth.updateUser({ data: { avatar_url: data.avatar_url } })
            }
          })
        })
      }
    } else {
      setAvatar(null)
    }
  }, [user])

  const isAdmin = useStore(s => s.isAdmin)

  const nav = (
    <>
      <Link href="/exhibits" onClick={() => setMenuOpen(false)}>Exhibits</Link>
      <Link href="/artists" onClick={() => setMenuOpen(false)}>Artists</Link>
      <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
      {isAdmin && (
        <Link href="/curator" onClick={() => setMenuOpen(false)} style={{ color: '#d2a83c', fontWeight: 600 }}>Curator ✦</Link>
      )}
      {!user && (
        <Link href="/auth" onClick={() => setMenuOpen(false)}>Sign In</Link>
      )}
    </>
  )

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <Link href="/" className="lp-brand">
        <span>Atelier Museum</span>
      </Link>
      
      <nav className="lp-links">{nav}</nav>
      
      <div className="lp-nav-right">
        {user && (
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={user?.user_metadata?.full_name || 'Profile'} 
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#444', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
                  {(user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </button>
            {profileOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.5rem 0', minWidth: '160px', zIndex: 100, backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                <Link href="/settings" onClick={() => setProfileOpen(false)} style={{ display: 'block', padding: '0.75rem 1.25rem', color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Profile Settings
                </Link>
                <button 
                  onClick={() => { 
                    setProfileOpen(false)
                    useStore.getState().setAuth(null)
                    import('../lib/supabase').then(m => m.supabase.auth.signOut())
                  }} 
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1.25rem', color: '#ff6b6b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
        <button className="btn-secondary sm cart-btn" onClick={openCart}>
          Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
        <button className="btn-primary sm" onClick={enter}>
          Enter 3D Museum
        </button>
        <button className="lp-burger" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
          <span /><span /><span />
        </button>
      </div>

      {menuOpen && <nav className="lp-mobile-menu">{nav}</nav>}
    </header>
  )
}
