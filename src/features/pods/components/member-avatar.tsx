import { cn } from '@/lib/utils'
import { avatarModule, initials } from '../initials'

/** Initials on a module colour (white on each module's ink shade is at least 4.5:1). Phase 3 swaps in
 * the person's DiceBear avatar. */
export function MemberAvatar({
  name,
  userId,
  className,
}: {
  name: string
  userId: string
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      data-module={avatarModule(userId)}
      className={cn(
        'grid size-12 shrink-0 place-items-center rounded-full bg-module-ink font-semibold text-white',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
