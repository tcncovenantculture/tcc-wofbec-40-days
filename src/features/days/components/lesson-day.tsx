import { Check } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Day } from '../api'
import { BackToToday, CompleteSection, DayHeader, DimensionBadge, Reflections, Scripture } from './day-parts'
import { DayMarkdown } from './day-markdown'
import { DayMedia } from './day-media'

const steps = [
  { id: 'encounter', label: 'Encounter' },
  { id: 'understand', label: 'Understand' },
  { id: 'apply', label: 'Apply' },
  { id: 'connect', label: 'Connect' },
  { id: 'complete', label: 'Complete' },
] as const

/**
 * A lesson day: five steps in a vertical stepper on one route (?step=). Every step stays mounted, so a
 * half-typed answer survives moving between steps; only the active one is shown.
 */
export function LessonDay({
  day,
  preview = false,
  header,
}: {
  day: Day
  preview?: boolean
  header?: ReactNode
}) {
  const [params, setParams] = useSearchParams()
  const found = steps.findIndex((step) => step.id === params.get('step'))
  const active = found === -1 ? 0 : found
  // Set when someone taps to another step, so only that brings the step into view (never the first load,
  // where the title should show, and never twice under StrictMode).
  const scrollTo = useRef<number | null>(null)

  const go = (index: number) => {
    scrollTo.current = index
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.set('step', steps[index]?.id ?? 'encounter')
      return next
    })
  }

  useEffect(() => {
    if (scrollTo.current !== active) return
    scrollTo.current = null
    document.getElementById(`step-${steps[active]?.id}`)?.scrollIntoView({ block: 'start' })
  }, [active])

  const content: Record<(typeof steps)[number]['id'], ReactNode> = {
    encounter: (
      <>
        <p className="text-lg leading-relaxed">{day.introduction}</p>
        <Scripture day={day} />
        <DayMarkdown>{day.body_md}</DayMarkdown>
        <DayMedia items={day.media} />
      </>
    ),
    understand: <Reflections day={day} preview={preview} />,
    apply: (
      <>
        <DimensionBadge dimension={day.action_dimension} />
        <p className="font-heading text-3xl leading-tight font-semibold">{day.practical_action}</p>
        <p className="text-ink-soft">Try it today. Small and real beats big and someday.</p>
      </>
    ),
    connect: (
      <>
        <p className="text-ink-soft">Talk about it with your pod</p>
        <p className="font-heading text-3xl leading-tight font-semibold">{day.pod_prompt}</p>
        <Button asChild variant="outline" className="w-full">
          <Link to="/pod">Go to my pod</Link>
        </Button>
      </>
    ),
    complete: <CompleteSection day={day} preview={preview} label={`Complete Day ${day.day_number}`} />,
  }

  return (
    <main data-module={day.module_number} className="flex flex-col gap-6 py-2">
      {header ?? <BackToToday />}
      <DayHeader day={day} eyebrow={`Day ${day.day_number} · Module ${day.module_number}`} />

      <ol className="space-y-3">
        {steps.map((step, index) => {
          const isActive = index === active
          return (
            <li
              key={step.id}
              id={`step-${step.id}`}
              className={cn('scroll-mt-4 rounded-3xl', isActive ? 'bg-card shadow-card' : 'bg-card/60')}
            >
              <h2>
                <button
                  type="button"
                  aria-expanded={isActive}
                  aria-controls={`panel-${step.id}`}
                  onClick={() => go(index)}
                  className="flex min-h-14 w-full items-center gap-3 px-5 text-left"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-full font-semibold',
                      index <= active
                        ? 'bg-module-ink text-white'
                        : 'border-2 border-module-ink text-module-ink',
                    )}
                  >
                    {index < active ? <Check className="size-5" /> : index + 1}
                  </span>
                  <span className="font-heading text-2xl font-bold">{step.label}</span>
                  <span className="sr-only">, step {index + 1} of 5</span>
                </button>
              </h2>
              <div id={`panel-${step.id}`} hidden={!isActive} className="space-y-6 px-5 pb-6">
                {content[step.id]}
                {index < steps.length - 1 ? (
                  <div className="flex gap-3 pt-2">
                    {index > 0 ? (
                      <Button variant="outline" className="h-13 flex-1" onClick={() => go(index - 1)}>
                        Back
                      </Button>
                    ) : null}
                    <Button className="h-13 flex-2" onClick={() => go(index + 1)}>
                      Next: {steps[index + 1]?.label}
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </main>
  )
}
