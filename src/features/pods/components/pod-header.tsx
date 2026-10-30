import { CheckCircle2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/features/avatar/components/user-avatar'
import { cn } from '@/lib/utils'
import type { MyPod, PodMember } from '../api'
import { firstName, podNames } from '../names'

/** Pod name, everyone's avatar, and today's total ("4 of 5 done today"): a count, never names. */
export function PodHeader({
  pod,
  roster,
  me,
  totals,
}: {
  pod: MyPod
  roster: PodMember[] | undefined
  me: string
  totals: { members: number; completed: number } | undefined
}) {
  const facilitator = roster?.find((member) => member.isFacilitator)

  return (
    <header className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
      <div>
        <p className="font-semibold text-ink-soft">Your pod</p>
        <h1 className="text-5xl leading-none">{pod.name}</h1>
      </div>

      {roster ? (
        <div className="space-y-2">
          {/* The faces overlap so a pod of six still fits on one row; the names below are what's read out. */}
          <div aria-hidden="true" className="flex">
            {roster.map((member, index) => (
              <UserAvatar
                key={member.userId}
                avatar={member.avatar}
                userId={member.userId}
                className={cn('ring-4 ring-card', index > 0 && '-ml-2')}
              />
            ))}
          </div>
          <p>{podNames(roster, me)}</p>
        </div>
      ) : (
        <Skeleton aria-hidden="true" className="h-20 rounded-2xl" />
      )}

      {facilitator ? (
        <p className="text-ink-soft">
          {facilitator.userId === me
            ? 'You’re the facilitator: you can pin a post and hide a message if you need to.'
            : `${firstName(facilitator.displayName)} is your facilitator.`}
        </p>
      ) : null}

      {totals ? (
        <p className="flex items-center gap-2 font-semibold text-module-ink">
          <CheckCircle2 aria-hidden="true" className="size-5" />
          {totals.completed} of {totals.members} done today
        </p>
      ) : null}
    </header>
  )
}
