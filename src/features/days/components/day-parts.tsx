import { ArrowLeft, Briefcase, CheckCircle2, Clock, HeartHandshake, Lock, Sprout } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCompleteDay, useProgress } from '@/features/progress/api'
import { useReflections } from '@/features/reflections/api'
import type { Enums } from '@/lib/database.types'
import { LESSON_DAYS, nextOpenDay } from '@/lib/programme'
import { logoStripColours } from '@/theme/tokens'
import { useDaySummaries, type Day } from '../api'
import { useProgrammeDay } from '../use-programme'
import { ReflectionField } from './reflection-field'

export function BackToToday() {
  return (
    <Link
      to="/home"
      className="-ml-2 inline-flex min-h-11 items-center gap-1 self-start px-2 font-semibold text-ink-soft"
    >
      <ArrowLeft aria-hidden="true" />
      Today
    </Link>
  )
}

export function DayHeader({ day, eyebrow }: { day: Day; eyebrow: string }) {
  return (
    <header className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-module-ink">{eyebrow}</p>
        <p className="flex items-center gap-1 text-ink-soft">
          <Clock aria-hidden="true" className="size-4" />
          {day.est_minutes} min
        </p>
      </div>
      <h1 className="text-5xl leading-none text-module-display">{day.title}</h1>
    </header>
  )
}

export function Scripture({ day }: { day: Day }) {
  return (
    <figure className="space-y-3 rounded-2xl border-l-4 border-module bg-card p-5 shadow-card">
      {day.scripture_text ? (
        <blockquote className="text-lg leading-relaxed">{day.scripture_text}</blockquote>
      ) : null}
      <figcaption className="font-semibold text-module-ink">{day.scripture_ref}</figcaption>
      {day.scripture_url ? (
        <a
          href={day.scripture_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center font-semibold text-module-ink underline"
        >
          Read the passage in full
        </a>
      ) : null}
    </figure>
  )
}

const dimensions: Record<Enums<'dimension'>, { label: string; icon: typeof Briefcase }> = {
  career: { label: 'Career', icon: Briefcase },
  character: { label: 'Character', icon: Sprout },
  community: { label: 'Community', icon: HeartHandshake },
}

export function DimensionBadge({ dimension }: { dimension: Enums<'dimension'> }) {
  const { label, icon: Icon } = dimensions[dimension]
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full border border-module bg-card px-3 py-1 font-semibold text-module-ink">
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </p>
  )
}

/** The day's private answer boxes. */
export function Reflections({ day, preview }: { day: Day; preview: boolean }) {
  const answers = useReflections(day.day_number)
  return (
    <div className="space-y-6">
      <p className="flex items-center gap-2 text-ink-soft">
        <Lock aria-hidden="true" className="size-4 shrink-0" />
        Only you can see your answers.
      </p>
      {answers.isPending ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : answers.isError ? (
        <p role="alert" className="text-destructive">
          We couldn’t load your answers. Check your connection and come back to this step.
        </p>
      ) : (
        day.reflection_prompts.map((prompt, index) => (
          <ReflectionField
            key={`${day.day_number}-${index}`}
            dayNumber={day.day_number}
            index={index}
            prompt={prompt}
            initial={answers.data[index] ?? ''}
            preview={preview}
          />
        ))
      )}
    </div>
  )
}

/** Confetti, loaded only when someone completes a day. Skipped for people who prefer less motion. */
async function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const { default: confetti } = await import('canvas-confetti')
  await confetti({ particleCount: 90, spread: 70, origin: { y: 0.75 }, colors: [...logoStripColours] })
}

/** The Complete step: marks the day done, then says what's next. */
export function CompleteSection({ day, preview, label }: { day: Day; preview: boolean; label: string }) {
  const complete = useCompleteDay()
  const progress = useProgress()
  const summaries = useDaySummaries()
  const today = useProgrammeDay()
  const done = progress.data?.has(day.day_number) ?? false

  if (!done) {
    return (
      <div className="space-y-3">
        <Button
          size="lg"
          disabled={preview || complete.isPending}
          onClick={() => complete.mutate(day.day_number, { onSuccess: () => void celebrate() })}
        >
          {complete.isPaused ? 'Waiting for a connection…' : complete.isPending ? 'Saving…' : label}
        </Button>
        {complete.isError ? (
          <p role="alert" className="text-destructive">
            That didn’t save. Check your connection and try again.
          </p>
        ) : null}
        {preview ? <p className="text-ink-soft">Preview: completing is turned off.</p> : null}
      </div>
    )
  }

  const next = nextOpenDay({
    current: day.day_number,
    today,
    done: progress.data ?? new Set(),
    available: summaries.data?.map((d) => d.day_number) ?? [],
  })

  return (
    <div className="space-y-4" role="status">
      <p className="flex items-center gap-2 text-2xl font-semibold text-module-ink">
        <CheckCircle2 aria-hidden="true" className="size-7" />
        Day {day.day_number} complete
      </p>
      {next !== null ? (
        <>
          <p>Day {next} is ready when you are.</p>
          <Button asChild size="lg">
            <Link to={`/day/${next}`}>Go to Day {next}</Link>
          </Button>
        </>
      ) : today.phase === 'lesson' && today.day < LESSON_DAYS ? (
        <p>You’re all caught up. Day {today.day + 1} opens at midnight tonight.</p>
      ) : (
        <p>That’s all 40 days. Your pod is still there to talk.</p>
      )}
      <Button asChild variant="outline" className="w-full">
        <Link to="/home">Back to today</Link>
      </Button>
    </div>
  )
}
