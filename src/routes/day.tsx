import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDay } from '@/features/days/api'
import { BackToToday } from '@/features/days/components/day-parts'
import { LessonDay } from '@/features/days/components/lesson-day'
import { SynthesisDay } from '@/features/days/components/synthesis-day'
import { useProgrammeDay } from '@/features/days/use-programme'
import { formatInLagos, LESSON_DAYS, moduleFor, publishAtFor, unlockedThrough } from '@/lib/programme'
import NotFoundRoute from './not-found'

export default function DayRoute() {
  const { n } = useParams()
  const dayNumber = Number(n)
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > LESSON_DAYS) return <NotFoundRoute />
  return <DayScreen dayNumber={dayNumber} />
}

function DayScreen({ dayNumber }: { dayNumber: number }) {
  const today = useProgrammeDay()
  // The clock decides what's open (so ?asOf works on staging); the database also hides locked days.
  if (dayNumber > unlockedThrough(today)) return <Locked dayNumber={dayNumber} />
  return <OpenDay dayNumber={dayNumber} />
}

function OpenDay({ dayNumber }: { dayNumber: number }) {
  const day = useDay(dayNumber)

  if (day.isPending) {
    return day.fetchStatus === 'paused' ? (
      <Message title="You’re offline">Day {dayNumber} will open as soon as you’re back online.</Message>
    ) : (
      <DaySkeleton />
    )
  }
  if (day.isError) {
    return (
      <Message title="We couldn’t load this day" action={<RetryButton onRetry={() => void day.refetch()} />}>
        Check your connection, then try again.
      </Message>
    )
  }
  if (!day.data) {
    // Open by the clock, but not published yet.
    return (
      <Message title="Not quite ready">Day {dayNumber} is on its way. Check back a little later.</Message>
    )
  }
  return day.data.kind === 'synthesis' ? <SynthesisDay day={day.data} /> : <LessonDay day={day.data} />
}

function Locked({ dayNumber }: { dayNumber: number }) {
  return (
    <main data-module={moduleFor(dayNumber)} className="flex flex-1 flex-col gap-6 py-2">
      <BackToToday />
      <section className="space-y-3 rounded-3xl bg-card p-6 shadow-card">
        <Lock aria-hidden="true" className="size-8 text-module-ink" />
        <h1 className="text-4xl">Day {dayNumber} isn’t open yet</h1>
        <p className="text-lg">
          It unlocks on <strong>{formatInLagos(publishAtFor(dayNumber))}</strong>, at midnight.
        </p>
      </section>
    </main>
  )
}

function Message({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col gap-6 py-2">
      <BackToToday />
      <section role="status" className="space-y-3 rounded-3xl bg-card p-6 shadow-card">
        <h1 className="text-4xl">{title}</h1>
        <p className="text-ink-soft">{children}</p>
        {action}
      </section>
    </main>
  )
}

function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <Button variant="outline" className="w-full" onClick={onRetry}>
      Try again
    </Button>
  )
}

function DaySkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading" className="flex flex-col gap-6 py-2">
      <BackToToday />
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-96 rounded-3xl" />
    </main>
  )
}
