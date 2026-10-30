import { Navigate, Outlet } from 'react-router'
import { DotsLoader } from '@/components/brand/dots-loader'
import { useAuth } from '@/features/auth/use-auth'

function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <DotsLoader />
    </div>
  )
}

/** Screens for signed-in people only. Signed-out visitors go to the landing page. */
export function RequireSignedIn() {
  const auth = useAuth()
  if (auth.status === 'loading') return <Loading />
  if (auth.status === 'signed-out') return <Navigate to="/" replace />
  return <Outlet />
}

/** Landing, sign-up and verify: signed-in people skip straight to home. */
export function RedirectIfSignedIn() {
  const auth = useAuth()
  if (auth.status === 'loading') return <Loading />
  if (auth.status === 'signed-in') return <Navigate to="/home" replace />
  return <Outlet />
}
