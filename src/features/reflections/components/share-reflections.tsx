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
import { useReflections } from '../api'

type Answer = { index: number; prompt: string; answer: string }

/**
 * "Share with my pod" for each saved answer. Sharing sends the pod a copy as a message in that day's
 * thread, after a preview the person can edit. The answer itself stays private: the reflections table is
 * never shown to anyone else.
 */
export function ShareReflections({ day, preview }: { day: Day; preview: boolean }) {
  const pod = useMyPod()
  const answers = useReflections(day.day_number)
  const today = useProgrammeDay()
  const send = useSendMessage()
  const [open, setOpen] = useState<Answer | null>(null)
  const [draft, setDraft] = useState('')
  const [shared, setShared] = useState<number[]>([])
  const fieldId = useId()

  if (preview || !answers.data) return null
  const saved: Answer[] = day.reflection_prompts
    .map((prompt, index) => ({ index, prompt, answer: answers.data[index]?.trim() ?? '' }))
    .filter((item) => item.answer !== '')
  if (saved.length === 0) return null

  if (!pod.data) {
    return pod.isSuccess ? (
      <p className="text-ink-soft">Once your pod forms, you can share one of your answers with them here.</p>
    ) : null
  }

  const podId = pod.data.id
  const isToday = today.phase === 'lesson' && today.day === day.day_number
  const podLink = isToday ? '/pod?tab=today' : `/pod?tab=earlier&day=${day.day_number}`
  const tooLong = draft.length - MAX_MESSAGE_LENGTH
  const text = draft.trim()

  const start = (item: Answer) => {
    send.reset()
    setDraft(`${item.prompt}\n\n${item.answer}`)
    setOpen(item)
  }
  const share = () => {
    if (!open || !text || tooLong > 0) return
    const index = open.index
    send.mutate(
      { id: newMessageId(), podId, day: day.day_number, kind: 'shared_reflection', body: text },
      { onSuccess: () => setShared((done) => [...done, index]) },
    )
  }

  return (
    <section aria-labelledby={`${fieldId}-heading`} className="space-y-3">
      <div>
        <h3 id={`${fieldId}-heading`} className="text-2xl">
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
            {shared.includes(item.index) ? (
              <p className="flex min-h-11 items-center gap-2 font-semibold text-module-ink">
                <Check aria-hidden="true" className="size-5" />
                Shared with your pod
              </p>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => start(item)}>
                <Share2 aria-hidden="true" />
                Share with my pod
              </Button>
            )}
          </li>
        ))}
      </ul>

      <Sheet open={open !== null} onOpenChange={(isOpen) => (isOpen ? undefined : setOpen(null))}>
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
                  <Link to={podLink}>See it in your pod</Link>
                </Button>
                <Button size="lg" variant="outline" onClick={() => setOpen(null)}>
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
                    That’s {tooLong} {tooLong === 1 ? 'character' : 'characters'} over the 2,000 limit for a
                    pod message. Shorten it to share.
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
                <Button size="lg" variant="outline" onClick={() => setOpen(null)}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}
