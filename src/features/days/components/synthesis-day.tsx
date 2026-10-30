import { CheckCircle2, Circle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { LogoStrip } from '@/components/brand/logo-strip'
import { Button } from '@/components/ui/button'
import { useProgress } from '@/features/progress/api'
import { useDaySummaries, type Day } from '../api'
import { BackToToday, CompleteSection, Reflections, Scripture } from './day-parts'
import { DayMarkdown } from './day-markdown'

/**
 * Day 8 of a module: rest, looking back and pod alignment. Deliberately not a lesson: no steps, no
 * numbers, a calm layout with the logo strip, and the pod prompt given the most room.
 */
export function SynthesisDay({
  day,
  preview = false,
  header,
}: {
  day: Day
  preview?: boolean
  header?: ReactNode
}) {
  const summaries = useDaySummaries()
  const progress = useProgress()
  const moduleDays = (summaries.data ?? []).filter(
    (d) => d.module_number === day.module_number && d.day_number !== day.day_number,
  )

  return (
    <main data-module={day.module_number} className="flex flex-col gap-8 py-2">
      {header ?? <BackToToday />}

      <header className="space-y-4 text-center">
        <LogoStrip className="mx-auto w-40" />
        <p className="font-semibold text-module-ink">Day {day.day_number} · A day to rest and look back</p>
        <h1 className="text-5xl leading-none">{day.title}</h1>
        <p className="text-lg leading-relaxed">{day.introduction}</p>
      </header>

      <Scripture day={day} />
      <DayMarkdown>{day.body_md}</DayMarkdown>

      {moduleDays.length > 0 ? (
        <section aria-labelledby="look-back" className="space-y-3">
          <h2 id="look-back" className="text-3xl">
            Look back on this module
          </h2>
          <p className="text-ink-soft">The things you were asked to try. No need to have done them all.</p>
          <ul className="space-y-3">
            {moduleDays.map((d) => {
              const done = progress.data?.has(d.day_number) ?? false
              return (
                <li key={d.day_number} className="flex gap-3 rounded-2xl bg-card p-4">
                  {done ? (
                    <CheckCircle2 aria-label="Done" className="mt-0.5 size-5 shrink-0 text-module-ink" />
                  ) : (
                    <Circle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-soft" />
                  )}
                  <span>
                    <span className="block font-semibold">Day {d.day_number}</span>
                    {d.practical_action}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="pod-prompt" className="space-y-5 rounded-3xl bg-card p-6 shadow-card">
        <LogoStrip />
        <h2 id="pod-prompt" className="text-2xl">
          With your pod
        </h2>
        <p className="font-heading text-4xl leading-tight font-semibold">{day.pod_prompt}</p>
        <Button asChild size="lg">
          <Link to="/pod">Go to my pod</Link>
        </Button>
      </section>

      <section aria-labelledby="just-for-you" className="space-y-4">
        <h2 id="just-for-you" className="text-3xl">
          Just for you
        </h2>
        <Reflections day={day} preview={preview} />
      </section>

      <CompleteSection day={day} preview={preview} label={`Finish Day ${day.day_number}`} />
    </main>
  )
}
