import { Flag } from 'lucide-react'
import { Link } from 'react-router'
import type { ReportedMessage } from '@/features/moderation/api'

/**
 * For the facilitator: messages in their pod that someone reported (the brief's escalation path to
 * facilitators). Never says who reported them. Each links to its thread, where the message is marked.
 */
export function ReportedNotice({
  reported,
  lessonDay,
}: {
  reported: ReportedMessage[]
  lessonDay: number | null
}) {
  if (reported.length === 0) return null
  const threads = [...new Set(reported.map((r) => r.day))].sort((a, b) => (a ?? 0) - (b ?? 0))
  const link = (day: number | null) =>
    day === null ? '?tab=general' : day === lessonDay ? '?tab=today' : `?tab=earlier&day=${day}`

  return (
    <section
      aria-labelledby="reported-heading"
      className="space-y-2 rounded-2xl border-l-4 border-destructive bg-card p-4 shadow-card"
    >
      <h2
        id="reported-heading"
        className="flex items-center gap-2 font-sans text-base font-semibold tracking-normal text-destructive"
      >
        <Flag aria-hidden="true" className="size-5" />
        {reported.length === 1
          ? 'A message in your pod was reported'
          : `${reported.length} messages in your pod were reported`}
      </h2>
      <p>
        A church leader will look at {reported.length === 1 ? 'it' : 'them'}. If something shouldn’t stay up,
        you can hide it from its options (⋯).
      </p>
      <ul className="flex flex-wrap gap-x-4">
        {threads.map((day) => (
          <li key={day ?? 'general'}>
            <Link
              to={link(day)}
              className="inline-flex min-h-11 items-center font-semibold text-module-ink underline"
            >
              {day === null ? 'General' : `Day ${day}`}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
