import { UserRound } from 'lucide-react'
import { memo } from 'react'
import { cn } from '@/lib/utils'
import { avatarFor } from '../options'
import { avatarDataUri } from '../render'

/**
 * A person's avatar: the one they made, or a seeded one from their user id if they skipped the builder.
 * Decorative (alt=""): their name is always written next to it.
 */
export const UserAvatar = memo(function UserAvatar({
  avatar,
  userId,
  className,
}: {
  /** profiles.avatar as stored; anything invalid falls back to the seeded avatar */
  avatar: unknown
  userId: string
  className?: string
}) {
  return (
    <img
      src={avatarDataUri(avatarFor(avatar, userId))}
      alt=""
      width={48}
      height={48}
      decoding="async"
      className={cn('size-12 shrink-0 rounded-full', className)}
    />
  )
})

/** A plain circle for someone who has left (a "Former member"), or while the roster loads. */
export function PlaceholderAvatar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('grid size-9 shrink-0 place-items-center rounded-full bg-border', className)}
    >
      <UserRound className="size-5 text-ink-soft" />
    </span>
  )
}
