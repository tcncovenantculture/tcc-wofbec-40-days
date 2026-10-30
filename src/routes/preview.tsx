import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { DotsLoader } from '@/components/brand/dots-loader'
import { Button } from '@/components/ui/button'
import { useProfile } from '@/features/auth/api'
import { useDay, useDaySummaries, type Day } from '@/features/days/api'
import { BackToToday } from '@/features/days/components/day-parts'
import { LessonDay } from '@/features/days/components/lesson-day'
import { SynthesisDay } from '@/features/days/components/synthesis-day'
import { formatInLagos, LESSON_DAYS } from '@/lib/programme'

// Reviewers (role set by hand in Studio) see any day, draft or future, exactly as participants will, with
// saving and completing switched off. RLS lets reviewers read every day; everyone else gets nothing here.

export default function PreviewRoute() {
  const { n } = useParams()
  const dayNumber = Number(n)
  const profile = useProfile()

  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > LESSON_DAYS) {
    return <Navigate to="/preview/1" replace />
  }
  if (profile.isPending) return <Centered />
  if (profile.data?.role !== 'reviewer') {
    return (
      <main className="flex flex-1 flex-col gap-6 py-2">
        <BackToToday />
        <section className="space-y-2 rounded-3xl bg-card p-6 shadow-card">
          <h1 className="text-4xl">This page is for reviewers</h1>
          <p className="text-ink-soft">Ask the project lead if you need to preview days before they open.</p>
        </section>
      </main>
    )
  }
  return <PreviewDay key={dayNumber} dayNumber={dayNumber} />
}

function PreviewDay({ dayNumber }: { dayNumber: number }) {
  const day = useDay(dayNumber)

  if (day.isPending) return <Centered />
  if (day.isError || !day.data) {
    return (
      <main className="flex flex-1 flex-col gap-6 py-2">
        <PreviewBar dayNumber={dayNumber} day={null} />
        <section className="space-y-2 rounded-3xl bg-card p-6 shadow-card">
          <h1 className="text-4xl">Day {dayNumber} isn’t loaded yet</h1>
          <p className="text-ink-soft">
            {day.isError
              ? 'We couldn’t load it. Check your connection.'
              : 'Its content file hasn’t been loaded.'}
          </p>
        </section>
      </main>
    )
  }

  const header = <PreviewBar dayNumber={dayNumber} day={day.data} />
  return day.data.kind === 'synthesis' ? (
    <SynthesisDay day={day.data} preview header={header} />
  ) : (
    <LessonDay day={day.data} preview header={header} />
  )
}

function PreviewBar({ dayNumber, day }: { dayNumber: number; day: Day | null }) {
  const navigate = useNavigate()
  const summaries = useDaySummaries()
  const status = !day
    ? 'Not loaded'
    : day.status === 'draft'
      ? 'Draft: participants can’t see it'
      : `Published: opens ${formatInLagos(new Date(day.publish_at))}`

  return (
    <div className="sticky top-0 z-10 -mx-5 space-y-3 bg-purple px-5 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 text-white">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-heading text-2xl font-bold">
          <Eye aria-hidden="true" className="size-6" />
          Preview
        </p>
        <Link to="/home" className="flex min-h-11 items-center font-semibold underline">
          Exit
        </Link>
      </div>
      <p>{status}</p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="text-ink"
          aria-label="Previous day"
          disabled={dayNumber <= 1}
          onClick={() => void navigate(`/preview/${dayNumber - 1}`)}
        >
          <ChevronLeft />
        </Button>
        <label htmlFor="preview-day" className="sr-only">
          Day to preview
        </label>
        <select
          id="preview-day"
          value={dayNumber}
          onChange={(event) => void navigate(`/preview/${event.target.value}`)}
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-base text-ink"
        >
          {Array.from({ length: LESSON_DAYS }, (_, i) => i + 1).map((n) => {
            const summary = summaries.data?.find((d) => d.day_number === n)
            return (
              <option key={n} value={n}>
                Day {n}
                {summary
                  ? ` · ${summary.title}${summary.status === 'draft' ? ' (draft)' : ''}`
                  : ' · not loaded'}
              </option>
            )
          })}
        </select>
        <Button
          variant="outline"
          size="icon"
          className="text-ink"
          aria-label="Next day"
          disabled={dayNumber >= LESSON_DAYS}
          onClick={() => void navigate(`/preview/${dayNumber + 1}`)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}

function Centered() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <DotsLoader />
    </div>
  )
}
