import { Link } from 'react-router'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'

// Phase 0 placeholder. Phase 3 replaces this with the full landing screen.
const modules = [1, 2, 3, 4, 5] as const
const daysPerModule = 8

export default function LandingRoute() {
  return (
    <main className="flex flex-1 flex-col justify-between gap-10 py-4">
      <header className="space-y-5">
        <Logo className="w-52" />
        <h1 className="pt-2 text-7xl leading-none">40 Days</h1>
        <p className="text-lg text-ink-soft">
          Forty days of daily discipleship with a small pod, leading into WOFBEC 2027.
        </p>
      </header>

      <section aria-label="About the 40 days" className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
        <div aria-hidden="true" className="flex gap-2">
          {modules.map((module) => (
            <div key={module} data-module={module} className="flex flex-1 gap-0.5">
              {Array.from({ length: daysPerModule }, (_, day) => (
                <span key={day} className="h-2 flex-1 rounded-full bg-module" />
              ))}
            </div>
          ))}
        </div>
        <p>Five modules, a few minutes a day, and a pod of about five people walking it with you.</p>
        <p className="font-semibold">Day 1 is Saturday, 14 November.</p>
      </section>

      <div className="space-y-2">
        <Button asChild size="lg">
          <Link to="/signup">Join the 40 days</Link>
        </Button>
        <p className="flex items-center justify-center gap-1 text-ink-soft">
          Already joined?
          <Link
            to="/signup?mode=signin"
            className="inline-flex min-h-11 items-center font-semibold text-orange-ink underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
