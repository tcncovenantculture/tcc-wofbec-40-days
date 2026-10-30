import { EyeOff, Flag } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useHideMessage, type Message } from '../api'

/**
 * What someone can do with a message. Report is listed but switched off until Phase 4 adds the report
 * form and the email to moderators; Hide is for the pod's facilitator (and moderators).
 */
export function MessageActions({
  message,
  canHide,
  onClose,
}: {
  message: Message | null
  canHide: boolean
  onClose: () => void
}) {
  const hide = useHideMessage()
  const [confirming, setConfirming] = useState(false)

  const close = () => {
    setConfirming(false)
    hide.reset()
    onClose()
  }

  return (
    <Sheet open={message !== null} onOpenChange={(open) => (open ? undefined : close())}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-md rounded-t-3xl pb-[max(env(safe-area-inset-bottom),1.25rem)] text-base"
      >
        <SheetHeader className="pr-14">
          <SheetTitle className="text-3xl font-bold">
            {confirming ? 'Hide this message?' : 'Message options'}
          </SheetTitle>
          <SheetDescription className="text-base text-ink-soft">
            {confirming
              ? 'Everyone in your pod will see “Message hidden” instead. Church moderators can still read it.'
              : 'Choose what to do with this message.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4">
          {confirming ? (
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
              <Button size="lg" variant="outline" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Button size="lg" variant="outline" disabled className="justify-start">
                  <Flag aria-hidden="true" />
                  Report
                </Button>
                <p className="text-ink-soft">
                  Reporting opens before launch. Until then, if something here worries you, tell a church
                  leader.
                </p>
              </div>
              {canHide ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="justify-start"
                  onClick={() => setConfirming(true)}
                >
                  <EyeOff aria-hidden="true" />
                  Hide message
                </Button>
              ) : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
