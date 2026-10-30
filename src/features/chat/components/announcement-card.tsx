import { Megaphone } from 'lucide-react'
import { useNow } from '@/features/days/use-programme'
import { useLatestAnnouncement } from '../api'
import { formatMessageTime } from '../format'

/** The latest announcement from the church moderators, pinned above the pod's tabs. */
export function AnnouncementCard() {
  const announcement = useLatestAnnouncement()
  const now = useNow()
  if (!announcement.data) return null
  const { body, createdAt } = announcement.data

  return (
    <section
      aria-labelledby="announcement-heading"
      className="space-y-1 rounded-2xl border-l-4 border-purple bg-card p-4 shadow-card"
    >
      <h2
        id="announcement-heading"
        className="flex items-center gap-2 font-sans text-base font-semibold tracking-normal text-purple"
      >
        <Megaphone aria-hidden="true" className="size-5" />
        From the church team
      </h2>
      <p className="break-words whitespace-pre-wrap">{body}</p>
      <p className="text-ink-soft">
        <time dateTime={createdAt}>{formatMessageTime(createdAt, now)}</time>
      </p>
    </section>
  )
}
