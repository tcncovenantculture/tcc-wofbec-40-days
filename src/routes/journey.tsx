import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDaySummaries, type DaySummary } from '@/features/days/api'
import { useProgrammeDay } from '@/features/days/use-programme'
import { useProgress } from '@/features/progress/api'
import { ProgressStrip } from '@/features/progress/progress-strip'
import { JourneyDay } from '@/features/reflections/components/journey-day'
import {
  DAY_ONE,
  DAYS_PER_MODULE,
  formatInLagos,
  LESSON_DAYS,
  publishAtFor,
  unlockedThrough,
} from '@/lib/programme'

const modules = Array.from({ length: LESSON_DAYS / DAYS_PER_MODULE }, (_, i) => i + 1)

/**
 * My journey (PLAN.md 4.4): the days you've finished, grouped by module, each opening your answers.
 * Days that are open but not done yet are listed neutrally ("Ready when you are"); later modules show when
 * they open. Only the person sees this.
 */
export default function JourneyRoute() {
  const today = useProgrammeDay()
  const days = useDaySummaries()
  const progress = useProgress()

  return (
    <main className="flex flex-col gap-6 py-2">
      <h1 className="text-5xl leading-none">My journey</h1>
      {today.phase === 'before' ? (
        <NothingYet
          title="It starts soon"
          body={`Day 1 opens on ${formatInLagos(DAY_ONE)}. The days you finish will collect here with your answers, so you can look back on them.`}
        />
      ) : days.isPending || progress.isPending ? (
        days.fetchStatus === 'paused' || progress.fetchStatus === 'paused' ? (
          <NothingYet title="You’re offline" body="Your journey will appear as soon as you’re back online." />
        ) : (
          <JourneySkeleton />
        )
      ) : days.isError || progress.isError ? (
        <LoadError
          onRetry={() => {
            void days.refetch()
            void progress.refetch()
          }}
        />
      ) : (
        <Modules
          summaries={days.data}
          done={progress.data}
          lastOpen={unlockedThrough(today)}
          today={today.phase === 'lesson' ? today.day : 0}
        />
      )}
    </main>
  )
}

function Modules({
  summaries,
  done,
  lastOpen,
  today,
}: {
  summaries: DaySummary[]
  done: Set<number>
  lastOpen: number
  today: number
}) {
  const byDay = new Map(summaries.map((summary) => [summary.day_number, summary]))

  return (
    <>
      <section aria-label="Progress" className="space-y-3">
        <p>
          {done.size === 0
            ? 'Days you finish will collect here with your answers.'
            : `${done.size} ${done.size === 1 ? 'day' : 'days'} finished. Tap one to read your answers again.`}
        </p>
        <ProgressStrip today={today} done={done} />
      </section>

      {modules.map((module) => {
        const first = (module - 1) * DAYS_PER_MODULE + 1
        const last = module * DAYS_PER_MODULE
        if (first > lastOpen) {
          return (
            <p key={module} data-module={module} className="flex items-center gap-3 text-ink-soft">
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-module" />
              Module {module}, days {first} to {last}, opens on {formatInLagos(publishAtFor(first))}
            </p>
          )
        }
        const open = Array.from({ length: Math.min(last, lastOpen) - first + 1 }, (_, i) => first + i)
        return (
          <section
            key={module}
            data-module={module}
            aria-labelledby={`module-${module}`}
            className="space-y-3"
          >
            <div>
              <h2 id={`module-${module}`} className="text-3xl text-module-display">
                Module {module}
              </h2>
              <p className="text-ink-soft">
                Days {first} to {last}
              </p>
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border-l-4 border-module bg-card shadow-card">
              {open.map((day) => {
                const summary = byDay.get(day)
                if (summary && done.has(day)) return <JourneyDay key={day} summary={summary} />
                return <NotDoneYet key={day} day={day} summary={summary} />
              })}
            </ul>
          </section>
        )
      })}
    </>
  )
}

function NotDoneYet({ day, summary }: { day: number; summary: DaySummary | undefined }) {
  if (!summary) {
    return <li className="flex min-h-16 items-center px-4 py-3 text-ink-soft">Day {day} is on its way</li>
  }
  return (
    <li>
      <Link to={`/day/${day}`} className="flex min-h-16 items-center gap-3 px-4 py-3">
        <span className="flex-1">
          <span className="block font-semibold">
            Day {day} · {summary.title}
          </span>
          <span className="block text-ink-soft">Ready when you are</span>
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-soft" />
      </Link>
    </li>
  )
}

function NothingYet({ title, body }: { title: string; body: string }) {
  return (
    <section className="space-y-2 rounded-3xl bg-card p-6 shadow-card">
      <h2 className="text-3xl">{title}</h2>
      <p className="text-ink-soft">{body}</p>
    </section>
  )
}

function JourneySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-4">
      <Skeleton className="h-10 rounded-xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  )
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <section role="alert" className="space-y-4 rounded-3xl bg-card p-6 shadow-card">
      <h2 className="text-3xl">We couldn’t load your journey</h2>
      <p className="text-ink-soft">Check your connection, then try again.</p>
      <Button variant="outline" className="w-full" onClick={onRetry}>
        Try again
      </Button>
    </section>
  )
}
