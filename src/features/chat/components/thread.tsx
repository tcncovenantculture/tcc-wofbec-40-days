import { MoreHorizontal, Pin } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNow } from '@/features/days/use-programme'
import { usePendingMessages, usePinned, useThread, type Message } from '../api'
import { MessageActions } from './message-actions'
import { MessageItem, PendingItem } from './message-item'

/** True when the page is scrolled to (or very near) the bottom. */
function atPageBottom() {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120
}

/** One conversation: a day's thread, or general chat (day null). */
export function Thread({
  podId,
  day,
  me,
  authorName,
  canHide,
  intro,
  empty,
}: {
  podId: string
  day: number | null
  me: string
  authorName: (authorId: string | null) => string
  canHide: boolean
  intro?: ReactNode
  empty: string
}) {
  const thread = useThread(podId, day)
  const pinned = usePinned(podId, day)
  const { pending, retry, discard } = usePendingMessages(podId, day)
  const now = useNow()
  const [options, setOptions] = useState<Message | null>(null)

  const pinnedPost = pinned.data ?? null
  const pinnedId = pinnedPost?.id
  // Pages come newest first; the screen reads oldest to newest. The pinned post shows above, not twice.
  const messages = useMemo(
    () => [...(thread.data?.pages.flat() ?? [])].reverse().filter((message) => message.id !== pinnedId),
    [thread.data, pinnedId],
  )

  // Chat-style scrolling: open at the newest message, follow new ones while the reader is at the bottom,
  // and always go down after sending. Someone reading older messages higher up is left where they are.
  const following = useRef(true)
  const sending = useRef(pending.length)
  useEffect(() => {
    const onScroll = () => {
      following.current = atPageBottom()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const newestId = pending.at(-1)?.message.id ?? messages.at(-1)?.id
  useLayoutEffect(() => {
    if (!thread.isSuccess) return
    const justSent = pending.length > sending.current
    sending.current = pending.length
    if (following.current || justSent) window.scrollTo({ top: document.documentElement.scrollHeight })
  }, [thread.isSuccess, newestId, pending.length])

  // Older messages load when "Load earlier messages" scrolls into view (or is tapped).
  const loadEarlier = useRef<HTMLButtonElement>(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = thread
  useEffect(() => {
    const button = loadEarlier.current
    if (!button || !hasNextPage) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage()
    })
    observer.observe(button)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const nameFor = (message: Message) => (message.authorId === me ? 'You' : authorName(message.authorId))
  // Someone else's message: report it (and hide it, for the facilitator). Your own: hide, facilitator only.
  const optionsFor = (message: Message) =>
    !message.hidden && (message.authorId !== me || canHide) ? () => setOptions(message) : undefined

  return (
    <section className="flex flex-col gap-4">
      {intro}

      {pinnedPost ? (
        <PinnedPost
          message={pinnedPost}
          author={pinnedPost.authorId === me ? 'you' : authorName(pinnedPost.authorId)}
          onOptions={optionsFor(pinnedPost)}
        />
      ) : null}

      {hasNextPage ? (
        <Button
          ref={loadEarlier}
          variant="outline"
          disabled={isFetchingNextPage}
          onClick={() => void fetchNextPage()}
        >
          {isFetchingNextPage ? 'Loading…' : 'Load earlier messages'}
        </Button>
      ) : null}

      {thread.isPending ? (
        thread.fetchStatus === 'paused' ? (
          <p role="status" className="text-ink-soft">
            You’re offline. Messages will load when you’re back online.
          </p>
        ) : (
          <ThreadSkeleton />
        )
      ) : null}

      {thread.isError ? (
        <div role="alert" className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
          <p>We couldn’t load the messages. Check your connection, then try again.</p>
          <Button variant="outline" className="w-full" onClick={() => void thread.refetch()}>
            Try again
          </Button>
        </div>
      ) : null}

      <ol role="log" aria-label="Messages" className="flex flex-col gap-3">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            author={nameFor(message)}
            mine={message.authorId === me}
            now={now}
            onOptions={optionsFor(message)}
          />
        ))}
        {pending.map((item) => (
          <PendingItem
            key={item.message.id}
            item={item}
            onRetry={() => retry(item)}
            onDiscard={() => discard(item)}
          />
        ))}
      </ol>

      {thread.isSuccess && messages.length === 0 && pending.length === 0 && !pinnedPost ? (
        <p className="py-2 text-center text-ink-soft">{empty}</p>
      ) : null}

      <MessageActions message={options} canHide={canHide} onClose={() => setOptions(null)} />
    </section>
  )
}

function PinnedPost({
  message,
  author,
  onOptions,
}: {
  message: Message
  author: string
  onOptions?: () => void
}) {
  return (
    <section
      aria-label="Pinned post"
      className="relative space-y-1 rounded-2xl border-2 border-module bg-card p-4 pr-12 shadow-card"
    >
      <p className="flex items-center gap-1.5 font-semibold text-module-ink">
        <Pin aria-hidden="true" className="size-4" />
        Pinned by {author}
      </p>
      <p className="break-words whitespace-pre-wrap">{message.body}</p>
      {onOptions ? (
        <button
          type="button"
          onClick={onOptions}
          aria-label="Options for the pinned post"
          className="absolute top-1 right-1 grid size-11 place-items-center rounded-full text-ink-soft"
        >
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </button>
      ) : null}
    </section>
  )
}

function ThreadSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading messages" className="flex flex-col gap-3">
      <Skeleton className="h-20 w-3/4 rounded-2xl" />
      <Skeleton className="ml-auto h-16 w-2/3 rounded-2xl" />
      <Skeleton className="h-20 w-4/5 rounded-2xl" />
    </div>
  )
}
