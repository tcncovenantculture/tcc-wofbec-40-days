import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProfile } from '@/features/auth/api'
import { useNow } from '@/features/days/use-programme'
import { useModerationQueue } from '@/features/moderation/api'
import { Announcements } from '@/features/moderation/components/announcements'
import { QueueCard } from '@/features/moderation/components/queue-card'

/** For church moderators (role set by hand in Supabase Studio): every report, and announcements. */
export default function ModRoute() {
  const profile = useProfile()

  if (profile.isPending) return <Skeleton className="mt-4 h-64 rounded-3xl" />
  if (profile.data?.role !== 'moderator') {
    return (
      <main className="flex flex-col gap-6 py-2">
        <BackLink />
        <section className="space-y-2 rounded-3xl bg-card p-6 shadow-card">
          <h1 className="text-4xl">This page is for church moderators</h1>
          <p className="text-ink-soft">
            If you’re worried about something in your pod, use Report on the message (⋯).
          </p>
        </section>
      </main>
    )
  }
  return <Moderation />
}

function Moderation() {
  const queue = useModerationQueue()
  const now = useNow()

  return (
    <main className="flex flex-col gap-8 py-2">
      <BackLink />
      <header className="space-y-1">
        <h1 className="text-5xl leading-none">Moderation</h1>
        <p className="text-ink-soft">Reports from every pod, and announcements to all of them.</p>
      </header>

      <section aria-labelledby="queue-heading" className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="queue-heading" className="text-3xl">
            Reported messages
          </h2>
          <Button variant="link" className="px-0" onClick={() => void queue.refetch()}>
            Refresh
          </Button>
        </div>
        {queue.isPending ? (
          <Skeleton className="h-48 rounded-3xl" />
        ) : queue.isError ? (
          <div role="alert" className="space-y-3 rounded-3xl bg-card p-5 shadow-card">
            <p>We couldn’t load the reports. Check your connection, then try again.</p>
            <Button variant="outline" className="w-full" onClick={() => void queue.refetch()}>
              Try again
            </Button>
          </div>
        ) : queue.data.length === 0 ? (
          <p className="rounded-3xl bg-card p-5 text-ink-soft shadow-card">
            Nothing to review. Thank you for looking after the pods.
          </p>
        ) : (
          queue.data.map((item) => <QueueCard key={item.messageId} item={item} now={now} />)
        )}
      </section>

      <Announcements now={now} />
    </main>
  )
}

function BackLink() {
  return (
    <Link to="/settings" className="flex min-h-11 items-center gap-1 font-semibold text-ink-soft">
      <ChevronLeft aria-hidden="true" className="size-5" />
      Settings
    </Link>
  )
}
