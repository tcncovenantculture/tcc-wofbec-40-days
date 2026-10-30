import { EyeOff, Flag } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
  MAX_REPORT_DETAILS,
  reportReasons,
  useReportMessage,
  type ReportReason,
} from '@/features/moderation/api'
import { useHideMessage, type Message } from '../api'

type Step = 'menu' | 'hide' | 'report' | 'reported'

const titles: Record<Step, string> = {
  menu: 'Message options',
  hide: 'Hide this message?',
  report: 'Report this message',
  reported: 'Thanks for telling us',
}

/**
 * What someone can do with a message: report it (anyone but its author), and hide it (the pod's
 * facilitator, and moderators). Reports go to the church's moderators; the author is never told who
 * reported them.
 */
export function MessageActions({
  message,
  canHide,
  canReport,
  onClose,
}: {
  message: Message | null
  canHide: boolean
  canReport: boolean
  onClose: () => void
}) {
  const hide = useHideMessage()
  const report = useReportMessage()
  const [step, setStep] = useState<Step>('menu')
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const detailsId = useId()

  const close = () => {
    setStep('menu')
    setReason(null)
    setDetails('')
    hide.reset()
    report.reset()
    onClose()
  }

  const descriptions: Record<Step, string> = {
    menu: 'Choose what to do with this message.',
    hide: 'Everyone in your pod will see “Message hidden” instead. Church moderators can still read it.',
    report: 'A church leader will look at it. The person who wrote it won’t be told who reported it.',
    reported:
      report.data === 'already'
        ? 'You’ve already reported this message. A church leader will look at it.'
        : 'A church leader will look at this message soon.',
  }

  return (
    <Sheet open={message !== null} onOpenChange={(open) => (open ? undefined : close())}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[90dvh] max-w-md overflow-y-auto rounded-t-3xl pb-[max(env(safe-area-inset-bottom),1.25rem)] text-base"
      >
        <SheetHeader className="pr-14">
          <SheetTitle className="text-3xl font-bold">{titles[step]}</SheetTitle>
          <SheetDescription className="text-base text-ink-soft">{descriptions[step]}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4">
          {step === 'menu' ? (
            <>
              {canReport ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="justify-start"
                  onClick={() => setStep('report')}
                >
                  <Flag aria-hidden="true" />
                  Report
                </Button>
              ) : null}
              {canHide ? (
                <Button size="lg" variant="outline" className="justify-start" onClick={() => setStep('hide')}>
                  <EyeOff aria-hidden="true" />
                  Hide message
                </Button>
              ) : null}
            </>
          ) : null}

          {step === 'hide' ? (
            <>
              <Button
                size="lg"
                disabled={hide.isPending}
                onClick={() => {
                  if (!message) return
                  hide.mutate(message, {
                    onSuccess: () => {
                      toast('Message hidden')
                      close()
                    },
                  })
                }}
              >
                {hide.isPending ? 'Hiding…' : 'Hide message'}
              </Button>
              {hide.isError ? (
                <p role="alert" className="text-destructive">
                  That didn’t work. Check your connection and try again.
                </p>
              ) : null}
              <Button size="lg" variant="outline" onClick={() => setStep('menu')}>
                Cancel
              </Button>
            </>
          ) : null}

          {step === 'report' ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (!message || !reason) return
                report.mutate(
                  { messageId: message.id, reason, details },
                  { onSuccess: () => setStep('reported') },
                )
              }}
            >
              <fieldset className="space-y-2">
                <legend className="mb-2 font-semibold">What’s wrong with it?</legend>
                <div className="flex flex-wrap gap-2">
                  {reportReasons.map((option) => (
                    <label
                      key={option.value}
                      className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-card px-4 font-semibold has-checked:border-orange-ink has-checked:bg-orange/10 has-checked:text-orange-ink has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={option.value}
                        checked={reason === option.value}
                        onChange={() => setReason(option.value)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-1">
                <label htmlFor={detailsId} className="font-semibold">
                  Anything a church leader should know? (optional)
                </label>
                <Textarea
                  id={detailsId}
                  rows={3}
                  maxLength={MAX_REPORT_DETAILS}
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                />
              </div>
              {report.isError ? (
                <p role="alert" className="text-destructive">
                  That didn’t send. Check your connection and try again.
                </p>
              ) : null}
              <Button type="submit" size="lg" disabled={!reason || report.isPending}>
                {report.isPending ? 'Sending…' : 'Send report'}
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => setStep('menu')}>
                Cancel
              </Button>
            </form>
          ) : null}

          {step === 'reported' ? (
            <>
              {reason === 'unsafe' ? (
                <p className="font-semibold">
                  If someone could be in danger right now, please also speak to a church leader directly.
                </p>
              ) : null}
              <Button size="lg" onClick={close}>
                Done
              </Button>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
