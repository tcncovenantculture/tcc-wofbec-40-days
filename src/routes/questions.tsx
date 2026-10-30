import { useId, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useBaselineAnswered, useSaveBaseline, type BaselineAnswers } from '@/features/baseline/api'
import { baselineQuestions, MAX_NOTE, scaleEnds, type BaselineKey } from '@/features/baseline/questions'
import { cn } from '@/lib/utils'

const scale = [1, 2, 3, 4, 5] as const

/**
 * The baseline questions (PLAN.md 3.4), right after the avatar step on first sign-in: three optional
 * 1-to-5 questions and an optional note. Skipping is as easy as answering. Phase 6 asks again after Day 40.
 */
export default function QuestionsRoute() {
  const answered = useBaselineAnswered('start')
  const save = useSaveBaseline('start')
  const navigate = useNavigate()
  const noteId = useId()
  const [answers, setAnswers] = useState<BaselineAnswers>({
    career: null,
    character: null,
    community: null,
    note: '',
  })
  const goHome = () => void navigate('/home', { replace: true })
  const anything = baselineQuestions.some((q) => answers[q.key] !== null) || answers.note.trim() !== ''

  if (answered.data === true && !save.isSuccess) {
    return (
      <main className="flex flex-1 flex-col justify-center gap-4">
        <h1 className="text-5xl leading-none">Thanks, you’ve answered these</h1>
        <Button asChild size="lg">
          <Link to="/home" replace>
            Go to today
          </Link>
        </Button>
      </main>
    )
  }

  const pick = (key: BaselineKey, value: number) =>
    setAnswers((current) => ({ ...current, [key]: current[key] === value ? null : value }))

  return (
    <main className="flex flex-col gap-6 py-2">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-5xl leading-none">Three quick questions</h1>
          <Button variant="ghost" onClick={goHome} className="-mr-3 shrink-0">
            Skip
          </Button>
        </div>
        <p className="text-ink-soft">
          Optional. Where are you as the 40 days begin? Only the project team sees your answers, as totals, to
          learn how the 40 days help. Answer any, all or none.
        </p>
      </header>

      {baselineQuestions.map((question) => (
        <fieldset key={question.key} className="space-y-3 rounded-3xl bg-card p-5 shadow-card">
          <legend className="sr-only">{question.question}</legend>
          <p aria-hidden="true" className="font-semibold text-ink-soft">
            {question.dimension}
          </p>
          <p aria-hidden="true" className="font-heading text-2xl leading-tight font-bold">
            {question.question}
          </p>
          <div className="flex gap-2">
            {scale.map((value) => (
              <label
                key={value}
                className={cn(
                  'grid h-12 flex-1 cursor-pointer place-items-center rounded-xl border border-border bg-cream text-lg font-semibold has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                  answers[question.key] === value && 'border-orange-ink bg-orange/10 text-orange-ink',
                )}
              >
                <input
                  type="radio"
                  name={question.key}
                  value={value}
                  checked={answers[question.key] === value}
                  onChange={() => pick(question.key, value)}
                  // Tapping the chosen number again clears it, so every question stays optional.
                  onClick={() => (answers[question.key] === value ? pick(question.key, value) : undefined)}
                  aria-label={`${value} of 5${value === 1 ? `, ${scaleEnds.low}` : value === 5 ? `, ${scaleEnds.high}` : ''}`}
                  className="sr-only"
                />
                {value}
              </label>
            ))}
          </div>
          <div aria-hidden="true" className="flex justify-between text-ink-soft">
            <span>{scaleEnds.low}</span>
            <span>{scaleEnds.high}</span>
          </div>
        </fieldset>
      ))}

      <div className="space-y-1">
        <label htmlFor={noteId} className="font-semibold">
          Anything you’d like to add? (optional)
        </label>
        <Textarea
          id={noteId}
          rows={3}
          maxLength={MAX_NOTE}
          value={answers.note}
          onChange={(event) => setAnswers((current) => ({ ...current, note: event.target.value }))}
        />
      </div>

      <div className="space-y-2">
        {save.isError ? (
          <p role="alert" className="text-destructive">
            That didn’t save. Check your connection and try again, or skip for now.
          </p>
        ) : null}
        <Button
          size="lg"
          disabled={!anything || save.isPending}
          onClick={() => save.mutate(answers, { onSuccess: goHome })}
        >
          {save.isPending ? 'Saving…' : 'Save my answers'}
        </Button>
        <Button size="lg" variant="outline" disabled={save.isPending} onClick={goHome}>
          Skip
        </Button>
      </div>
    </main>
  )
}
