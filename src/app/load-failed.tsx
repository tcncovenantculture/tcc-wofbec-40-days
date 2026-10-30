// buttonVariants rather than <Button>: this loads with the landing page, which has no room for the
// class-merging library <Button> uses.
import { buttonVariants } from '@/components/ui/button-variants'
import { PageFrame } from './page-frame'

/** Shown when the full app's code can't be downloaded (usually no signal and nothing saved yet). */
export function LoadFailed() {
  return (
    <PageFrame>
      <main role="alert" className="my-auto space-y-4 rounded-3xl bg-card p-6 shadow-card">
        <h1 className="text-4xl">We couldn’t load the app</h1>
        <p className="text-ink-soft">Check your connection, then try again.</p>
        <button
          type="button"
          className={buttonVariants({ className: 'w-full' })}
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </main>
    </PageFrame>
  )
}
