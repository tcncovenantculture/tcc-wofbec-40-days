import { Logo } from '@/components/brand/logo'
import { buttonVariants } from '@/components/ui/button-variants'

// The first screen most people see: the Nov 8 QR code points here. main.tsx renders it on its own, without
// the router or Supabase, so it imports neither and its links are plain anchors (they load the full app).
// It uses buttonVariants, not <Button>, to keep a class-merging library out of its 100 KB budget.

const modules = [1, 2, 3, 4, 5] as const
const daysPerModule = 8

const themes = [
  {
    module: 1,
    title: 'Forty days with Jesus',
    body: 'After he rose, Jesus spent forty days with his friends, teaching them about the kingdom. Each day here takes 10 to 15 minutes: read, think it through, and try one small thing.',
    quote: 'being seen of them forty days, and speaking of the things pertaining to the kingdom of God',
    reference: 'Acts 1:3',
  },
  {
    module: 2,
    title: 'A pod of about five',
    body: 'Four friends carried a man to Jesus when he couldn’t get there on his own. You’ll walk the 40 days with a small pod of people at the same stage of life, talking each day’s question through together.',
    quote: 'And they come unto him, bringing one sick of the palsy, which was borne of four.',
    reference: 'Mark 2:3',
  },
  {
    module: 3,
    title: 'Career, character, community',
    body: 'Each day’s small action touches one of the three: your work or studies, who you’re becoming, and the people around you.',
    quote: 'Not slothful in business; fervent in spirit; serving the Lord',
    reference: 'Romans 12:11',
  },
] as const

function JoinLinks() {
  return (
    <div className="space-y-2">
      <a href="/signup" className={buttonVariants({ size: 'lg' })}>
        Join the 40 days
      </a>
      <p className="flex items-center justify-center gap-1 text-ink-soft">
        Already joined?
        <a
          href="/signup?mode=signin"
          className="inline-flex min-h-11 items-center font-semibold text-orange-ink underline"
        >
          Sign in
        </a>
      </p>
    </div>
  )
}

export default function LandingRoute() {
  return (
    <main className="flex flex-col gap-8 py-2">
      <header className="space-y-5">
        <Logo className="w-52" />
        <h1 className="text-7xl leading-none">40 Days</h1>
        <p className="text-lg">
          A few minutes a day with Jesus, and a small pod walking it with you. It all leads into WOFBEC 2027.
        </p>
      </header>

      <section aria-labelledby="dates" className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
        <div aria-hidden="true" className="flex gap-2">
          {modules.map((module) => (
            <div key={module} data-module={module} className="flex flex-1 gap-0.5">
              {Array.from({ length: daysPerModule }, (_, day) => (
                <span key={day} className="h-2 flex-1 rounded-full bg-module" />
              ))}
            </div>
          ))}
        </div>
        <h2 id="dates" className="text-3xl">
          Day 1 is Saturday 14 November
        </h2>
        <p>
          The last day is Wednesday 23 December. Then come nine days of waiting together, and WOFBEC begins on
          Saturday 2 January.
        </p>
        <JoinLinks />
      </section>

      {themes.map((theme) => (
        <section
          key={theme.title}
          data-module={theme.module}
          aria-labelledby={`theme-${theme.module}`}
          className="space-y-3"
        >
          <h2 id={`theme-${theme.module}`} className="text-3xl text-module-display">
            {theme.title}
          </h2>
          <p>{theme.body}</p>
          <figure className="space-y-1 rounded-2xl border-l-4 border-module bg-card p-4 shadow-card">
            <blockquote className="leading-relaxed">“{theme.quote}”</blockquote>
            <figcaption className="font-semibold text-module-ink">{theme.reference} (KJV)</figcaption>
          </figure>
        </section>
      ))}

      <section aria-label="Join" className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
        <p className="font-heading text-3xl leading-tight font-bold">
          Sign up with your email. No app to install.
        </p>
        <JoinLinks />
      </section>

      <footer className="flex justify-center">
        <a href="/privacy" className="inline-flex min-h-11 items-center text-ink-soft underline">
          Privacy
        </a>
      </footer>
    </main>
  )
}
