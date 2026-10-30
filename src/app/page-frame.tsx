import type { ReactNode } from 'react'

/** The phone-width column every screen sits in, with room for notches and the home bar. */
export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      {children}
    </div>
  )
}
