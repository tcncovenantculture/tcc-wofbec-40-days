import { ChevronDown, Pencil } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDay, type DaySummary } from '@/features/days/api'
import { ReflectionField } from '@/features/days/components/reflection-field'
import { useMyPod } from '@/features/pods/api'
import { cn } from '@/lib/utils'
import { useReflections } from '../api'
import { useShareState, type ShareableAnswer } from '../use-share-state'
import { ShareButton, ShareSheet } from './share-reflections'

/**
 * A finished day in My journey. Tap it to read your answers again; "Edit my answers" turns them into the
 * same autosaving boxes as the day screen, and each saved answer can be shared with the pod.
 */
export function JourneyDay({ summary }: { summary: DaySummary }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="flex-1">
          <span className="block font-semibold">
            Day {summary.day_number} · {summary.title}
          </span>
          <span className="block text-module-ink">Done</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn('size-5 shrink-0 text-ink-soft transition-transform', open && 'rotate-180')}
        />
      </button>
      {open ? (
        <div id={panelId} className="px-4 pb-4">
          <DayAnswers dayNumber={summary.day_number} />
        </div>
      ) : null}
    </li>
  )
}

function DayAnswers({ dayNumber }: { dayNumber: number }) {
  const day = useDay(dayNumber)
  const answers = useReflections(dayNumber)
  const pod = useMyPod()
  const sharing = useShareState()
  const [editing, setEditing] = useState(false)

  if (day.isPending || answers.isPending) {
    const offline = day.fetchStatus === 'paused' || answers.fetchStatus === 'paused'
    return offline ? (
      <p className="text-ink-soft">Your answers will show here when you’re back online.</p>
    ) : (
      <div aria-busy="true" aria-label="Loading your answers" className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-16" />
      </div>
    )
  }
  if (day.isError || answers.isError || !day.data) {
    return (
      <div role="alert" className="space-y-2">
        <p>We couldn’t load your answers.</p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            void day.refetch()
            void answers.refetch()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  const prompts = day.data.reflection_prompts

  if (editing) {
    return (
      <div className="space-y-4">
        {prompts.map((prompt, index) => (
          <ReflectionField
            key={index}
            dayNumber={dayNumber}
            index={index}
            prompt={prompt}
            initial={answers.data[index] ?? ''}
          />
        ))}
        <Button variant="outline" className="w-full" onClick={() => setEditing(false)}>
          Done editing
        </Button>
      </div>
    )
  }

  const items: ShareableAnswer[] = prompts.map((prompt, index) => ({
    index,
    prompt,
    answer: answers.data[index]?.trim() ?? '',
  }))
  const anyAnswer = items.some((item) => item.answer !== '')

  return (
    <div className="space-y-4">
      <p className="text-ink-soft">Only you can see these.</p>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.index} className="space-y-2 rounded-2xl bg-cream p-4">
            <p className="font-semibold">{item.prompt}</p>
            {item.answer ? (
              <p className="break-words whitespace-pre-wrap">{item.answer}</p>
            ) : (
              <p className="text-ink-soft italic">No answer written</p>
            )}
            {item.answer && pod.data ? (
              <ShareButton
                answer={item}
                shared={sharing.shared.includes(item.index)}
                onShare={sharing.start}
              />
            ) : null}
          </li>
        ))}
      </ul>

      {anyAnswer && pod.isSuccess && !pod.data ? (
        <p className="text-ink-soft">Once your pod forms, you can share an answer with them.</p>
      ) : null}

      <div className="space-y-2">
        <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>
          <Pencil aria-hidden="true" />
          {anyAnswer ? 'Edit my answers' : 'Write an answer'}
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link to={`/day/${dayNumber}`}>Open Day {dayNumber}</Link>
        </Button>
      </div>

      {pod.data ? (
        <ShareSheet
          key={sharing.sheetKey}
          answer={sharing.open}
          dayNumber={dayNumber}
          podId={pod.data.id}
          onClose={sharing.close}
          onShared={sharing.markShared}
        />
      ) : null}
    </div>
  )
}
