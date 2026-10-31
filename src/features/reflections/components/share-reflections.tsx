import { Check, Share2 } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { MAX_MESSAGE_LENGTH, useSendMessage } from '@/features/chat/api'
import { newMessageId } from '@/features/chat/format'
import type { Day } from '@/features/days/api'
import { useProgrammeDay } from '@/features/days/use-programme'
import { useMyPod } from '@/features/pods/api'
import type { ProgrammeDay } from '@/lib/programme'
import { useReflections } from '../api'
import { useShareState, type ShareableAnswer } from '../use-share-state'

/** Where a day's thread is on the pod screen. */
function podThreadLink(dayNumber: number, today: ProgrammeDay): string {
  const isToday = today.phase === 'lesson' && today.day === dayNumber
  return isToday ? '/pod?tab=today' : `/pod?tab=earlier&day=${dayNumber}`
}

/**
 * The share sheet: a preview of the message (the question plus the answer) that the person can edit, then
 * it's sent to that day's thread as a shared reflection. The private answer itself never changes.
 * Give it a new key for each answer (useShareState's sheetKey).
 */
export function ShareSheet({
  answer,
  dayNumber,
  podId,
  onClose,
  onShared,
}: {
  answer: ShareableAnswer | null
  dayNumber: number
  podId: string
  onClose: () => void
  onShared: (index: number) => void
}) {
  const send = useSendMessage()
  const today = useProgrammeDay()
  const [draft, setDraft] = useState(() => (answer ? `${answer.prompt}\n\n${answer.answer}` : ''))
  const fieldId = useId()
  const tooLong = draft.length - MAX_MESSAGE_LENGTH
  const text = draft.trim()

  const share = () => {
    if (!answer || !text || tooLong > 0) return
    const index = answer.index
    send.mutate(
      { id: newMessageId(), podId, day: dayNumber, kind: 'shared_reflection', body: text },
      { onSuccess: () => onShared(index) },
    )
  }

  return (
    <Sheet open={answer !== null} onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[90dvh] max-w-md overflow-y-auto rounded-t-3xl pb-[max(env(safe-area-inset-bottom),1.25rem)] text-base"
      >
        <SheetHeader className="pr-14">
          <SheetTitle className="text-3xl font-bold">
            {send.isSuccess ? 'Shared' : 'Share with your pod?'}
          </SheetTitle>
          <SheetDescription className="text-base text-ink-soft">
            {send.isSuccess
              ? 'Your pod can see it now.'
              : 'Your pod will see this message. Edit it first if you like; your private answer won’t change.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4">
          {send.isSuccess ? (
            <>
              <Button asChild size="lg">
                <Link to={podThreadLink(dayNumber, today)}>See it in your pod</Link>
              </Button>
              <Button size="lg" variant="outline" onClick={onClose}>
                Done
              </Button>
            </>
          ) : (
            <>
              <label htmlFor={fieldId} className="sr-only">
                Message to your pod
              </label>
              <Textarea
                id={fieldId}
                rows={6}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={send.isPending}
                className="max-h-[45dvh]"
              />
              {tooLong > 0 ? (
                <p role="alert" className="text-destructive">
                  That’s {tooLong} {tooLong === 1 ? 'character' : 'characters'} over the 2,000 limit for a pod
                  message. Shorten it to share.
                </p>
              ) : null}
              {send.isPending ? (
                <p role="status" className="text-ink-soft">
                  {send.isPaused
                    ? 'Waiting for a connection. It will send when you’re back online.'
                    : 'Sharing…'}
                </p>
              ) : null}
              {send.isError ? (
                <p role="alert" className="text-destructive">
                  That didn’t send. Check your connection and try again.
                </p>
              ) : null}
              <Button size="lg" disabled={!text || tooLong > 0 || send.isPending} onClick={share}>
                Share with my pod
              </Button>
              <Button size="lg" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** "Share with my pod" on a saved answer, or a tick once it's been shared. */
export function ShareButton({
  answer,
  shared,
  onShare,
}: {
  answer: ShareableAnswer
  shared: boolean
  onShare: (answer: ShareableAnswer) => void
}) {
  return shared ? (
    <p className="flex min-h-11 items-center gap-2 font-semibold text-module-ink">
      <Check aria-hidden="true" className="size-5" />
      Shared with your pod
    </p>
  ) : (
    <Button variant="outline" className="w-full" onClick={() => onShare(answer)}>
      <Share2 aria-hidden="true" />
      Share with my pod
    </Button>
  )
}

/**
 * "Share with my pod" for each saved answer. Sharing sends the pod a copy as a message in that day's
 * thread, after a preview the person can edit. The answer itself stays private: the reflections table is
 * never shown to anyone else.
 */
export function ShareReflections({ day, preview }: { day: Day; preview: boolean }) {
  const pod = useMyPod()
  const answers = useReflections(day.day_number)
  const sharing = useShareState()
  const headingId = useId()

  if (preview || !answers.data) return null
  const saved: ShareableAnswer[] = day.reflection_prompts
    .map((prompt, index) => ({ index, prompt, answer: answers.data[index]?.trim() ?? '' }))
    .filter((item) => item.answer !== '')
  if (saved.length === 0) return null

  if (!pod.data) {
    return pod.isSuccess ? (
      <p className="text-ink-soft">Once your pod forms, you can share one of your answers with them here.</p>
    ) : null
  }

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div>
        <h3 id={headingId} className="text-2xl">
          Share with your pod
        </h3>
        <p className="text-ink-soft">
          If you’d like to, send your pod a copy of an answer. Your answer stays private.
        </p>
      </div>
      <ul className="space-y-3">
        {saved.map((item) => (
          <li key={item.index} className="space-y-2 rounded-2xl border border-border bg-card p-4">
            <p className="text-ink-soft">{item.prompt}</p>
            <p className="line-clamp-3 break-words whitespace-pre-wrap">{item.answer}</p>
            <ShareButton answer={item} shared={sharing.shared.includes(item.index)} onShare={sharing.start} />
          </li>
        ))}
      </ul>

      <ShareSheet
        key={sharing.sheetKey}
        answer={sharing.open}
        dayNumber={day.day_number}
        podId={pod.data.id}
        onClose={sharing.close}
        onShared={sharing.markShared}
      />
    </section>
  )
}
