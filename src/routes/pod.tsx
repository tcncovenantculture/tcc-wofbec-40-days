import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUserId } from '@/features/auth/use-auth'
import { PlaceholderAvatar, UserAvatar } from '@/features/avatar/components/user-avatar'
import { chatKeys } from '@/features/chat/api'
import { AnnouncementCard } from '@/features/chat/components/announcement-card'
import { Composer } from '@/features/chat/components/composer'
import { Thread } from '@/features/chat/components/thread'
import { usePodLive } from '@/features/chat/use-pod-live'
import { usePullToRefresh } from '@/features/chat/use-pull-to-refresh'
import { useDay, useDaySummaries } from '@/features/days/api'
import { useProgrammeDay } from '@/features/days/use-programme'
import { usePodReportedMessages } from '@/features/moderation/api'
import { useMyPod, usePodRoster, usePodThreadCounts, usePodTotals, type MyPod } from '@/features/pods/api'
import { ReportedNotice } from '@/features/pods/components/reported-notice'
import { NoPod } from '@/features/pods/components/no-pod'
import { PodHeader } from '@/features/pods/components/pod-header'
import { WhatsAppCard } from '@/features/pods/components/whatsapp-card'
import { podKeys } from '@/features/pods/keys'
import { whatsAppShareLink } from '@/features/pods/whatsapp'
import { moduleFor, unlockedThrough, type ProgrammePhase } from '@/lib/programme'

const tabs = ['today', 'earlier', 'general'] as const
type Tab = (typeof tabs)[number]
const isTab = (value: string | null): value is Tab => tabs.some((tab) => tab === value)

export default function PodRoute() {
  const pod = useMyPod()
  if (pod.isPending) return pod.fetchStatus === 'paused' ? <Offline /> : <PodSkeleton />
  if (pod.isError) return <LoadError onRetry={() => void pod.refetch()} />
  return pod.data ? <PodScreen pod={pod.data} /> : <NoPod />
}

function PodScreen({ pod }: { pod: MyPod }) {
  const today = useProgrammeDay()
  const me = useUserId()
  const roster = usePodRoster()
  const lessonDay = today.phase === 'lesson' ? today.day : null
  const totals = usePodTotals(lessonDay)
  const reportedMessages = usePodReportedMessages(pod.isFacilitator)
  const [params, setParams] = useSearchParams()
  const queryClient = useQueryClient()

  usePodLive(pod.id)
  const { indicatorRef, refreshing } = usePullToRefresh(() =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: podKeys.all }),
      queryClient.invalidateQueries({ queryKey: chatKeys.all }),
    ]),
  )

  // ?tab= picks the tab (Today during the 40 days, General otherwise); ?day= opens an earlier day's thread.
  const requested = params.get('tab')
  const tab: Tab = isTab(requested) ? requested : lessonDay ? 'today' : 'general'
  const lastOpen = unlockedThrough(today)
  const dayParam = Number(params.get('day'))
  const openDay =
    tab === 'earlier' && Number.isInteger(dayParam) && dayParam >= 1 && dayParam <= lastOpen ? dayParam : null

  // The thread the composer writes to: undefined when the tab shows no thread.
  const composerDay =
    tab === 'today' ? (lessonDay ?? undefined) : tab === 'general' ? null : (openDay ?? undefined)

  const members = new Map(roster.data?.map((member) => [member.userId, member]))
  const authorName = (authorId: string | null) =>
    (authorId ? members.get(authorId)?.displayName : undefined) ?? (roster.isPending ? '…' : 'Former member')
  const authorAvatar = (authorId: string | null) => {
    const member = authorId ? members.get(authorId) : undefined
    return member ? (
      <UserAvatar avatar={member.avatar} userId={member.userId} className="size-9" />
    ) : (
      <PlaceholderAvatar />
    )
  }
  const reported = new Map(reportedMessages.data?.map((r) => [r.messageId, r.reasons]))
  const threadProps = { podId: pod.id, me, authorName, authorAvatar, canHide: pod.isFacilitator, reported }

  return (
    <main
      data-module={lessonDay ? moduleFor(lessonDay) : undefined}
      className="flex flex-col gap-5 py-2 pb-28"
    >
      <div
        ref={indicatorRef}
        aria-hidden="true"
        className="group -mb-5 flex h-0 items-end justify-center overflow-hidden text-ink-soft"
      >
        <RefreshCw className="mb-2 size-5 transition-transform group-data-[ready=true]:rotate-180" />
      </div>
      {refreshing ? (
        <p role="status" className="text-center text-ink-soft">
          Refreshing…
        </p>
      ) : null}

      <PodHeader pod={pod} roster={roster.data} me={me} totals={lessonDay ? totals.data : undefined} />
      <ReportedNotice reported={reportedMessages.data ?? []} lessonDay={lessonDay} />
      <WhatsAppCard pod={pod} />
      <AnnouncementCard />

      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value })}>
        <TabsList className="w-full">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="earlier">Earlier</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="pt-3">
          {lessonDay ? (
            <Thread
              {...threadProps}
              day={lessonDay}
              intro={<DayPrompt day={lessonDay} label="Today’s question" />}
              empty="Nobody has replied yet. Short and honest is perfect."
            />
          ) : (
            <NoDayToday phase={today.phase} />
          )}
        </TabsContent>

        <TabsContent value="earlier" className="pt-3">
          {openDay ? (
            <div className="flex flex-col gap-4">
              <Link
                to="?tab=earlier"
                className="flex min-h-11 items-center gap-1 font-semibold text-ink-soft"
              >
                <ChevronLeft aria-hidden="true" className="size-5" />
                All days
              </Link>
              <Thread
                key={openDay}
                {...threadProps}
                day={openDay}
                intro={<DayPrompt day={openDay} label={`Day ${openDay}’s question`} />}
                empty="No messages on this day."
              />
            </div>
          ) : (
            <EarlierDays lastDay={lessonDay ? lessonDay - 1 : lastOpen} />
          )}
        </TabsContent>

        <TabsContent value="general" className="pt-3">
          <Thread
            {...threadProps}
            day={null}
            intro={<p className="text-ink-soft">For anything that isn’t about a particular day.</p>}
            empty="Nothing here yet. Say hello!"
          />
        </TabsContent>
      </Tabs>

      {composerDay !== undefined ? (
        <Composer
          key={`${tab}-${composerDay ?? 'general'}`}
          podId={pod.id}
          day={composerDay}
          canPin={pod.isFacilitator}
          placeholder={
            tab === 'general'
              ? 'Say something to your pod…'
              : tab === 'today'
                ? 'Reply to today’s question…'
                : `Add to Day ${composerDay}…`
          }
        />
      ) : null}
    </main>
  )
}

/** A day's pod prompt, at the top of its thread. */
function DayPrompt({ day, label }: { day: number; label: string }) {
  const content = useDay(day)
  const prompt = content.data?.pod_prompt

  return (
    <section data-module={moduleFor(day)} className="space-y-2 rounded-3xl bg-card p-5 shadow-card">
      <p className="font-semibold text-module-ink">{label}</p>
      {prompt ? (
        <>
          <p className="font-heading text-3xl leading-tight font-semibold">{prompt}</p>
          <a
            href={whatsAppShareLink(`Day ${day} of the 40 days: ${prompt}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center font-semibold text-module-ink underline"
          >
            Share this question on WhatsApp
          </a>
        </>
      ) : content.isPending ? (
        <Skeleton className="h-16 rounded-xl" />
      ) : (
        <p className="text-ink-soft">The question for this day is on its way.</p>
      )}
    </section>
  )
}

function NoDayToday({ phase }: { phase: ProgrammePhase }) {
  return (
    <section className="space-y-4 rounded-3xl bg-card p-6 shadow-card">
      <p>
        {phase === 'before'
          ? 'Day 1 opens on 14 November. Until then, say hello in General.'
          : 'There’s no new day today. Your pod is still here: keep talking in General.'}
      </p>
      <Button asChild variant="outline" className="w-full">
        <Link to="?tab=general">Go to General</Link>
      </Button>
    </section>
  )
}

/** Days before today, newest first, with how many messages each thread has. */
function EarlierDays({ lastDay }: { lastDay: number }) {
  const days = useDaySummaries()
  const counts = usePodThreadCounts()

  if (lastDay < 1) {
    return (
      <p className="rounded-3xl bg-card p-6 text-ink-soft shadow-card">
        Earlier days will show here from Day 2.
      </p>
    )
  }
  if (days.isPending) return <Skeleton className="h-48 rounded-2xl" />
  if (days.isError) {
    return (
      <div role="alert" className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
        <p>We couldn’t load the days. Check your connection, then try again.</p>
        <Button variant="outline" className="w-full" onClick={() => void days.refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  const list = days.data.filter((d) => d.day_number <= lastDay).reverse()
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-card">
      {list.map((d) => {
        const count = counts.data?.[d.day_number] ?? 0
        return (
          <li key={d.day_number} data-module={d.module_number}>
            <Link
              to={`?tab=earlier&day=${d.day_number}`}
              className="flex min-h-16 items-center gap-3 px-4 py-3"
            >
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-module" />
              <span className="flex-1">
                <span className="block font-semibold">
                  Day {d.day_number} · {d.title}
                </span>
                <span className="block text-ink-soft">
                  {count === 0 ? 'No messages yet' : count === 1 ? '1 message' : `${count} messages`}
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 text-ink-soft" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function PodSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-5 py-2">
      <Skeleton className="h-52 rounded-3xl" />
      <Skeleton className="h-12 rounded-xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  )
}

function Offline() {
  return (
    <section role="status" className="space-y-2 rounded-3xl bg-card p-6 shadow-card">
      <h1 className="text-4xl">You’re offline</h1>
      <p className="text-ink-soft">Your pod will appear as soon as you’re back online.</p>
    </section>
  )
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <section role="alert" className="space-y-4 rounded-3xl bg-card p-6 shadow-card">
      <h1 className="text-4xl">We couldn’t load your pod</h1>
      <p className="text-ink-soft">Check your connection, then try again.</p>
      <Button variant="outline" className="w-full" onClick={onRetry}>
        Try again
      </Button>
    </section>
  )
}
