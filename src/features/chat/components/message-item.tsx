import { Flag, MoreHorizontal, Pin, Quote, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { reasonLabel, type ReportReason } from '@/features/moderation/api'
import { cn } from '@/lib/utils'
import type { Message, MessageKind, PendingMessage } from '../api'
import { formatMessageTime } from '../format'

const kindLabels: Partial<Record<MessageKind, { label: string; icon: LucideIcon }>> = {
  pinned: { label: 'Pinned', icon: Pin },
  shared_reflection: { label: 'Shared a reflection', icon: Quote },
}

function KindLabel({ kind }: { kind: MessageKind }) {
  const found = kindLabels[kind]
  if (!found) return null
  const { label, icon: Icon } = found
  return (
    <p className="flex items-center gap-1.5 font-semibold text-module-ink">
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </p>
  )
}

function Body({ kind, children }: { kind: MessageKind; children: ReactNode }) {
  return (
    <p
      className={cn(
        'break-words whitespace-pre-wrap',
        kind === 'shared_reflection' && 'border-l-2 border-module pl-3',
      )}
    >
      {children}
    </p>
  )
}

export function MessageItem({
  message,
  author,
  avatar,
  mine,
  now,
  reportedReasons,
  onOptions,
}: {
  message: Message
  author: string
  /** Shown beside other people's messages */
  avatar?: ReactNode
  mine: boolean
  now: Date
  /** Shown to the facilitator when the message has open reports. */
  reportedReasons?: ReportReason[]
  onOptions?: () => void
}) {
  return (
    <li className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
      {avatar}
      <article
        className={cn(
          'relative w-fit max-w-[85%] min-w-40 space-y-1 rounded-2xl px-4 py-3 shadow-card',
          mine ? 'bg-orange/10' : 'bg-card',
          reportedReasons && 'ring-2 ring-destructive',
          onOptions && 'pr-12',
        )}
      >
        {reportedReasons ? (
          <p className="flex items-center gap-1.5 font-semibold text-destructive">
            <Flag aria-hidden="true" className="size-4" />
            Reported: {reportedReasons.map(reasonLabel).join(', ')}
          </p>
        ) : null}
        <header className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold">{author}</span>
          <time dateTime={message.createdAt} className="text-ink-soft">
            {formatMessageTime(message.createdAt, now)}
          </time>
        </header>
        {message.hidden ? (
          <p className="text-ink-soft italic">Message hidden</p>
        ) : (
          <>
            <KindLabel kind={message.kind} />
            <Body kind={message.kind}>{message.body}</Body>
          </>
        )}
        {onOptions ? (
          <button
            type="button"
            onClick={onOptions}
            aria-label={`Options for ${mine ? 'your' : `${author}’s`} message`}
            className="absolute top-1 right-1 grid size-11 place-items-center rounded-full text-ink-soft"
          >
            <MoreHorizontal aria-hidden="true" className="size-5" />
          </button>
        ) : null}
      </article>
    </li>
  )
}

/** A message on its way: sending, waiting for a signal, or failed with a retry. */
export function PendingItem({
  item,
  onRetry,
  onDiscard,
}: {
  item: PendingMessage
  onRetry: () => void
  onDiscard: () => void
}) {
  const status = item.failed ? 'Not sent.' : item.waiting ? 'Waiting for a connection…' : 'Sending…'
  return (
    <li className="flex justify-end">
      <article className="w-fit max-w-[85%] min-w-40 space-y-1 rounded-2xl bg-orange/10 px-4 py-3">
        <header className="font-semibold">You</header>
        <KindLabel kind={item.message.kind} />
        <Body kind={item.message.kind}>{item.message.body}</Body>
        <p role="status" className={cn('font-semibold', item.failed ? 'text-destructive' : 'text-ink-soft')}>
          {status}
        </p>
        {item.failed ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={onRetry}>
              Try again
            </Button>
            <Button size="sm" variant="ghost" onClick={onDiscard}>
              Remove
            </Button>
          </div>
        ) : null}
      </article>
    </li>
  )
}
