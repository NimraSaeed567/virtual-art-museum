import { useStore } from '../store'
import { useLocation } from 'wouter'
import { useEffect, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function RequireAdmin({ children }: Props) {
  const [, setLocation] = useLocation()
  const user = useStore(s => s.user)
  const isAdmin = useStore(s => s.isAdmin)
  const authInitialized = useStore(s => s.authInitialized)

  useEffect(() => {
    if (!authInitialized) return
    if (!user || !isAdmin) {
      setLocation('/')
    }
  }, [user, isAdmin, authInitialized, setLocation])

  if (!authInitialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white' }}>
        <span>Verifying access…</span>
      </div>
    )
  }

  if (!user || !isAdmin) return null

  return <>{children}</>
}
