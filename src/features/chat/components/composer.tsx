import { SendHorizontal } from 'lucide-react'
import { useId, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { MAX_MESSAGE_LENGTH, useSendMessage } from '../api'
import { newMessageId } from '../format'

// Tapping send or the pin box mustn't take focus from the text box: the keyboard would close, and on a
// phone the bottom nav comes back when the text box loses focus, moving the button mid-tap.
const keepFocus = (event: PointerEvent) => event.preventDefault()

/** Write to the pod. Fixed above the bottom nav; on a phone, typing hides the nav to make room. */
export function Composer({
  podId,
  day,
  placeholder,
  canPin,
}: {
  podId: string
  day: number | null
  placeholder: string
  canPin: boolean
}) {
  const send = useSendMessage()
  const [body, setBody] = useState('')
  const [pin, setPin] = useState(false)
  const id = useId()
  const text = body.trim()
  const left = MAX_MESSAGE_LENGTH - body.length

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!text) return
    send.mutate({ id: newMessageId(), podId, day, kind: pin ? 'pinned' : 'message', body: text })
    setBody('')
    setPin(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) submit()
  }

  return (
    <form
      onSubmit={submit}
      className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t border-border bg-card pointer-coarse:has-[textarea:focus]:bottom-0"
    >
      <div className="mx-auto max-w-md space-y-1 px-4 py-2">
        {canPin && text ? (
          <label className="flex min-h-11 items-center gap-3 font-semibold" onPointerDown={keepFocus}>
            <Checkbox checked={pin} onCheckedChange={(checked) => setPin(checked === true)} />
            Pin to the top of this thread
          </label>
        ) : null}
        <div className="flex items-end gap-2">
          <label htmlFor={id} className="sr-only">
            Message
          </label>
          <Textarea
            id={id}
            data-composer=""
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            value={body}
            onChange={(event) => {
              setBody(event.target.value)
              // The pin box only shows while there's text; clearing the text clears the pin too.
              if (!event.target.value.trim()) setPin(false)
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="max-h-40 min-h-11 resize-none py-2.5"
          />
          <Button type="submit" size="icon" aria-label="Send" disabled={!text} onPointerDown={keepFocus}>
            <SendHorizontal aria-hidden="true" />
          </Button>
        </div>
        {left <= 200 ? (
          <p aria-live="polite" className="text-ink-soft">
            {left} {left === 1 ? 'character' : 'characters'} left
          </p>
        ) : null}
      </div>
    </form>
  )
}
