import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMessageTime } from '@/features/chat/format'
import { cn } from '@/lib/utils'
import { reasonLabel, useModerationContext, useResolveReports, type QueueItem } from '../api'

/** One reported message in the moderators' queue, with its reports, its thread and the decision. */
export function QueueCard({ item, now }: { item: QueueItem; now: Date }) {
  const resolve = useResolveReports()
  const [showContext, setShowContext] = useState(false)
  const context = useModerationContext(item.messageId, showContext)

  const where = [item.podName ?? 'Announcement', item.day === null ? 'General' : `Day ${item.day}`].join(
    ' · ',
  )
  const decide = (outcome: 'hide' | 'dismiss') =>
    resolve.mutate(
      { messageId: item.messageId, outcome },
      { onSuccess: () => toast(outcome === 'hide' ? 'Message hidden' : 'Reports dismissed') },
    )

  return (
    <article className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
      <div className="space-y-1">
        <p className="font-semibold text-ink-soft">{where}</p>
        <p>
          Reported {item.reports === 1 ? 'once' : `${item.reports} times`}, last at{' '}
          {formatMessageTime(item.lastReportedAt, now)}
        </p>
        <ul aria-label="Reasons" className="flex flex-wrap gap-2 pt-1">
          {item.reasons.map((reason) => (
            <li
              key={reason}
              className={cn(
                'rounded-full px-3 py-1 font-semibold',
                reason === 'unsafe' ? 'bg-destructive/10 text-destructive' : 'bg-shimmer text-ink',
              )}
            >
              {reasonLabel(reason)}
            </li>
          ))}
        </ul>
      </div>

      {item.details.length > 0 ? (
        <div className="space-y-2">
          <p className="font-semibold">What they said</p>
          {item.details.map((words) => (
            <blockquote key={words} className="border-l-2 border-border pl-3 break-words whitespace-pre-wrap">
              {words}
            </blockquote>
          ))}
        </div>
      ) : null}

      <figure className="space-y-1 rounded-2xl border-l-4 border-destructive bg-cream p-4">
        <figcaption className="text-ink-soft">
          {item.authorName ?? 'Former member'} · {formatMessageTime(item.sentAt, now)}
          {item.hidden ? ' · hidden' : ''}
        </figcaption>
        <p className="break-words whitespace-pre-wrap">{item.body}</p>
      </figure>

      <div>
        <Button variant="link" className="px-0" onClick={() => setShowContext((open) => !open)}>
          {showContext ? 'Hide the thread' : 'See it in its thread'}
        </Button>
        {showContext ? (
          context.isPending ? (
            <Skeleton className="h-24 rounded-2xl" />
          ) : context.isError ? (
            <p role="alert" className="text-destructive">
              Couldn’t load the thread. Try again in a moment.
            </p>
          ) : (
            <ol className="space-y-2">
              {context.data.map((message) => (
                <li
                  key={message.id}
                  className={cn(
                    'rounded-2xl px-4 py-2',
                    message.id === item.messageId ? 'bg-destructive/10' : 'bg-shimmer',
                  )}
                >
                  <p className="text-ink-soft">
                    {message.authorName ?? 'Former member'} · {formatMessageTime(message.createdAt, now)}
                    {message.hidden ? ' · hidden' : ''}
                  </p>
                  <p className="break-words whitespace-pre-wrap">{message.body}</p>
                </li>
              ))}
            </ol>
          )
        ) : null}
      </div>

      {resolve.isError ? (
        <p role="alert" className="text-destructive">
          That didn’t work. Check your connection and try again.
        </p>
      ) : null}
      <div className="flex gap-3">
        {item.hidden ? (
          <Button className="flex-1" disabled={resolve.isPending} onClick={() => decide('hide')}>
            Keep hidden
          </Button>
        ) : (
          <>
            <Button className="flex-1" disabled={resolve.isPending} onClick={() => decide('hide')}>
              Hide message
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={resolve.isPending}
              onClick={() => decide('dismiss')}
            >
              Dismiss
            </Button>
          </>
        )}
      </div>
    </article>
  )
}
