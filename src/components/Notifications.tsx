import { useEffect } from 'react'
import { useStore, type ToastNotification } from '../store'
import { supabase } from '../lib/supabase'

function Toast({ notification, onDismiss }: { notification: ToastNotification; onDismiss: () => void }) {
  const icons: Record<string, string> = { info: '✨', success: '✅', warning: '⚠️' }
  const icon = icons[notification.type ?? 'info'] ?? '✨'

  return (
    <div className="toast-item" onClick={onDismiss} role="alert">
      <span className="toast-icon">{icon}</span>
      <span className="toast-msg">{notification.message}</span>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  )
}

export default function Notifications() {
  const user = useStore(s => s.user)
  const notifications = useStore(s => s.notifications)
  const addNotification = useStore(s => s.addNotification)
  const dismissNotification = useStore(s => s.dismissNotification)

  // Subscribe to realtime favourites for artist users
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`artist-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'favourites',
        },
        async (payload) => {
          // Fetch the artwork title from submissions to make notification useful
          const artworkId = payload.new?.artwork_id
          if (artworkId) {
            // Try to find artwork name in static data (fast, no extra DB call for static collection)
            addNotification(`Someone just favourited one of your artworks! ❤️`, 'success')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, addNotification])

  if (notifications.length === 0) return null

  return (
    <>
      <style>{`
        .toast-stack {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-width: 360px;
          pointer-events: none;
        }
        .toast-item {
          pointer-events: all;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(20, 20, 20, 0.95);
          border: 1px solid rgba(210, 168, 60, 0.35);
          border-left: 3px solid #d2a83c;
          border-radius: 12px;
          padding: 1rem 1.25rem;
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(210, 168, 60, 0.1);
          cursor: pointer;
          animation: toastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          color: white;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        .toast-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .toast-msg {
          flex: 1;
        }
        .toast-close {
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          flex-shrink: 0;
          transition: color 0.2s;
        }
        .toast-close:hover { color: white; }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(100%) scale(0.9); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
      <div className="toast-stack" aria-live="polite">
        {notifications.map(n => (
          <Toast key={n.id} notification={n} onDismiss={() => dismissNotification(n.id)} />
        ))}
      </div>
    </>
  )
}
