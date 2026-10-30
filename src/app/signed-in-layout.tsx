import { BookOpen, Settings, Sun, Users } from 'lucide-react'
import { Suspense } from 'react'
import { NavLink, Outlet } from 'react-router'
import { DotsLoader } from '@/components/brand/dots-loader'
import { cn } from '@/lib/utils'

const items = [
  { to: '/home', label: 'Today', icon: Sun },
  { to: '/journey', label: 'Journey', icon: BookOpen },
  { to: '/pod', label: 'Pod', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

/** Home, journey, pod and settings share a bottom nav. The day screen leaves it out to keep focus. */
export function SignedInLayout() {
  return (
    <>
      <div className="flex flex-1 flex-col pb-24">
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
      <nav
        aria-label="Main"
        data-bottom-nav=""
        className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto flex max-w-md">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-16 flex-col items-center justify-center gap-0.5 font-semibold',
                    isActive ? 'text-orange-ink' : 'text-ink-soft',
                  )
                }
              >
                <Icon aria-hidden="true" className="size-6" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
