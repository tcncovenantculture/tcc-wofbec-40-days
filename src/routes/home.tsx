import { CheckCircle2, ChevronRight, Clock } from 'lucide-react'
import { Link, Navigate } from 'react-router'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProfile } from '@/features/auth/api'
import { avatarStepOffered } from '@/features/avatar/setup-step'
import { useDaySummaries, type DaySummary } from '@/features/days/api'
import { useNow, useProgrammeDay } from '@/features/days/use-programme'
import { useProgress } from '@/features/progress/api'
import { ProgressStrip } from '@/features/progress/progress-strip'
import { DAY_ONE, daysUntilDayOne, formatInLagos, LESSON_DAYS } from '@/lib/programme'

export default function HomeRoute() {
  const today = useProgrammeDay()
  const profile = useProfile()
  const firstName = profile.data?.display_name.split(' ')[0]

  // Straight after someone first signs in, make an avatar (PLAN.md 3.3). Skipping saves one, so this only
  // happens once; the session flag stops it repeating if that save couldn't reach the server.
  if (profile.data && profile.data.avatar === null && !avatarStepOffered()) {
    return <Navigate to="/avatar?setup=1" replace />
  }

  return (
    <main className="flex flex-col gap-6 py-2">
      <header className="flex items-center justify-between gap-4">
        <Logo variant="mark" className="w-11" />
        <p className="text-right text-ink-soft">{firstName ? `Hi, ${firstName}` : ' '}</p>
      </header>

      {today.phase === 'before' ? (
        <BeforeDayOne />
      ) : today.phase === 'lesson' ? (
        <LessonDay day={today.day} />
      ) : (
        <WaitingDays phase={today.phase} />
      )}
    </main>
  )
}

function BeforeDayOne() {
  const days = daysUntilDayOne(useNow())
  const dayOne = formatInLagos(DAY_ONE)

  return (
    <section className="space-y-5 rounded-3xl bg-card p-6 shadow-card">
      <h1 className="text-5xl leading-none">You’re in</h1>
      <p>
        Welcome to the 40 days. Each day takes about 10 to 15 minutes, and you’ll walk it with a small pod.
      </p>
      <div className="rounded-2xl bg-cream p-4" data-module={1}>
        <p className="font-heading text-6xl leading-none font-bold text-module-display">
          {days === 1 ? 'Tomorrow' : `${days} days`}
        </p>
        <p className="mt-1 font-semibold">
          {days === 1 ? `Day 1 starts at midnight` : `until Day 1, ${dayOne}`}
        </p>
      </div>
      <p className="text-ink-soft">Your pod forms on 13 November. We’ll let you know who’s in it.</p>
    </section>
  )
}

function LessonDay({ day }: { day: number }) {
  const days = useDaySummaries()
  const progress = useProgress()

  if (days.isPending || progress.isPending) {
    // Paused: offline with nothing saved on the phone yet. It loads by itself when the signal returns.
    const offline = days.fetchStatus === 'paused' || progress.fetchStatus === 'paused'
    return offline ? <Offline /> : <HomeSkeleton />
  }
  if (days.isError || progress.isError) {
    return (
      <LoadError
        onRetry={() => {
          void days.refetch()
          void progress.refetch()
        }}
      />
    )
  }

  const done = progress.data
  const todayDay = days.data.find((d) => d.day_number === day)
  const catchUp = days.data.filter((d) => d.day_number < day && !done.has(d.day_number))

  return (
    <>
      <TodayCard day={day} summary={todayDay} done={done.has(day)} />
      <section aria-labelledby="progress-heading" className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 id="progress-heading" className="text-2xl">
            Day {day} of {LESSON_DAYS}
          </h2>
          <p className="text-ink-soft">
            {done.size} {done.size === 1 ? 'day' : 'days'} completed
          </p>
        </div>
        <ProgressStrip today={day} done={done} />
      </section>
      <CatchUpList days={catchUp} />
    </>
  )
}

function TodayCard({ day, summary, done }: { day: number; summary: DaySummary | undefined; done: boolean }) {
  if (!summary) {
    // Unlocked by the clock, but the content isn't loaded (or published) yet.
    return (
      <section className="space-y-2 rounded-3xl bg-card p-6 shadow-card">
        <p className="font-semibold text-ink-soft">Today · Day {day}</p>
        <h1 className="text-4xl leading-tight">Today’s day is on its way</h1>
        <p className="text-ink-soft">Check back a little later.</p>
      </section>
    )
  }

  return (
    <section data-module={summary.module_number} className="space-y-4 rounded-3xl bg-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-module-ink">Today · Day {day}</p>
        <p className="flex items-center gap-1 text-ink-soft">
          <Clock aria-hidden="true" className="size-4" />
          {summary.est_minutes} min
        </p>
      </div>
      <h1 className="text-5xl leading-none text-module-display">{summary.title}</h1>
      {done ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 font-semibold text-module-ink">
            <CheckCircle2 aria-hidden="true" className="size-6" />
            Done for today
          </p>
          {day < LESSON_DAYS ? (
            <p className="text-ink-soft">Day {day + 1} opens at midnight tonight.</p>
          ) : null}
          <Button asChild variant="outline" className="w-full">
            <Link to={`/day/${day}`}>Look at today again</Link>
          </Button>
        </div>
      ) : (
        <Button asChild size="lg">
          <Link to={`/day/${day}`}>Continue</Link>
        </Button>
      )}
    </section>
  )
}

function CatchUpList({ days }: { days: DaySummary[] }) {
  if (days.length === 0) return null
  return (
    <section aria-labelledby="catch-up-heading" className="space-y-3">
      <div>
        <h2 id="catch-up-heading" className="text-2xl">
          Catch up
        </h2>
        <p className="text-ink-soft">Ready when you are.</p>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-card">
        {days.map((d) => (
          <li key={d.day_number} data-module={d.module_number}>
            <Link to={`/day/${d.day_number}`} className="flex min-h-16 items-center gap-3 px-4 py-3">
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-module" />
              <span className="flex-1">
                <span className="block font-semibold">
                  Day {d.day_number} · {d.title}
                </span>
                <span className="block text-ink-soft">{d.est_minutes} min</span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 text-ink-soft" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function WaitingDays({ phase }: { phase: 'waiting' | 'wofbec' }) {
  const days = useDaySummaries()
  const progress = useProgress()
  const catchUp =
    days.data && progress.data
      ? days.data.filter((d) => !progress.data.has(d.day_number))
      : ([] as DaySummary[])

  return (
    <>
      <section className="space-y-4 rounded-3xl bg-card p-6 shadow-card">
        <h1 className="text-5xl leading-none">
          {phase === 'waiting' ? 'Waiting together' : 'WOFBEC has begun'}
        </h1>
        <p>
          {phase === 'waiting'
            ? 'The 40 days are done. There’s nothing new to read now: this is time to wait together, and your pod is still open to talk.'
            : 'Thank you for walking the 40 days. Your pod is still there if you want to talk.'}
        </p>
        <Button asChild size="lg">
          <Link to="/pod">Go to my pod</Link>
        </Button>
      </section>
      <CatchUpList days={catchUp} />
    </>
  )
}

function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-6">
      <Skeleton className="h-64 rounded-3xl" />
      <Skeleton className="h-12 rounded-xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  )
}

function Offline() {
  return (
    <section role="status" className="space-y-2 rounded-3xl bg-card p-6 shadow-card">
      <h1 className="text-4xl">You’re offline</h1>
      <p className="text-ink-soft">Today will appear as soon as you’re back online.</p>
    </section>
  )
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <section role="alert" className="space-y-4 rounded-3xl bg-card p-6 shadow-card">
      <h1 className="text-4xl">We couldn’t load today</h1>
      <p className="text-ink-soft">Check your connection, then try again.</p>
      <Button variant="outline" className="w-full" onClick={onRetry}>
        Try again
      </Button>
    </section>
  )
}
