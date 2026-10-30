import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { DotsLoader } from '@/components/brand/dots-loader'
import { PageFrame } from './page-frame'

/**
 * Declarative React Router keeps the scroll position between screens, so a day opened from far down the
 * home screen would start halfway down. Start each new screen at the top. Only the path counts: moving
 * between a day's steps changes ?step and keeps its own scrolling.
 */
function ScrollToTopOnNavigate() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function AppLayout() {
  return (
    <PageFrame>
      <ScrollToTopOnNavigate />
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <DotsLoader />
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </PageFrame>
  )
}
