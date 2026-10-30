import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import { ErrorBoundary } from '@/app/error-boundary'
import { LoadFailed } from '@/app/load-failed'
import { PageFrame } from '@/app/page-frame'
import { hasSavedSession } from '@/lib/auth-storage'
import LandingRoute from '@/routes/landing'

const element = document.getElementById('root')
if (!element) throw new Error('Missing #root element in index.html')
const root = createRoot(element)
const render = (app: ReactNode) => root.render(<StrictMode>{app}</StrictMode>)

// The landing page is where the Nov 8 QR code lands, often on weak data, so it loads on its own: no router,
// Supabase client or query cache (budget: under 100 KB). Every other page, and the landing page for someone
// with a saved session (who's sent on to /home), loads the full app.
if (window.location.pathname === '/' && !hasSavedSession()) {
  render(
    <ErrorBoundary>
      <PageFrame>
        <LandingRoute />
      </PageFrame>
    </ErrorBoundary>,
  )
} else {
  // The offline app shell starts here rather than on the landing page, so a visitor who only reads the
  // landing page doesn't download the whole app in the background.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' })
  }
  import('@/app/App').then(({ App }) => render(<App />)).catch(() => render(<LoadFailed />))
}
