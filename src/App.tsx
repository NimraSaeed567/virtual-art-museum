import { useEffect } from 'react'
import { useStore } from './store'
import { Switch, Route } from 'wouter'
import LandingPage from './components/LandingPage'
import Museum3D from './components/Museum3D'
import SiteHeader from './components/SiteHeader'
import Notifications from './components/Notifications'
import HallPage from './pages/HallPage'
import ExhibitPage from './pages/ExhibitPage'
import ArtworkPage from './pages/ArtworkPage'
import ArtistPage from './pages/ArtistPage'
import AllArtistsPage from './pages/AllArtistsPage'
import AllExhibitsPage from './pages/AllExhibitsPage'
import AuthPage from './pages/AuthPage'
import SettingsPage from './pages/SettingsPage'
import ArtworkSubmitPage from './pages/ArtworkSubmitPage'
import CuratorDashboard from './pages/CuratorDashboard'
import { CartDrawer } from './components/UI'

export default function App() {
  const entered = useStore((s) => s.entered)
  const cartOpen = useStore((s) => s.cartOpen)
  const initializeAuth = useStore((s) => s.initializeAuth)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])
  
  if (entered) return <Museum3D />

  return (
    <div className="site-layout">
      <SiteHeader />
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/artists" component={AllArtistsPage} />
        <Route path="/exhibits" component={AllExhibitsPage} />
        <Route path="/hall/:slug" component={HallPage} />
        <Route path="/exhibit/:slug" component={ExhibitPage} />
        <Route path="/artwork/:slug" component={ArtworkPage} />
        <Route path="/artist/:slug" component={ArtistPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/submit-artwork" component={ArtworkSubmitPage} />
        <Route path="/curator" component={CuratorDashboard} />
      </Switch>
      {cartOpen && <CartDrawer />}
      <Notifications />
    </div>
  )
}
