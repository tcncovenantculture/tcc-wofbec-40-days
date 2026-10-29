import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { DotsLoader } from '@/components/brand/dots-loader'

export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <DotsLoader />
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </div>
  )
}
