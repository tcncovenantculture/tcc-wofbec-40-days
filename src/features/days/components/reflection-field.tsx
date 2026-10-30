import { useEffect, useRef, useState } from 'react'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { useSaveReflection } from '@/features/reflections/api'

const SAVE_AFTER_MS = 800
const MAX_LENGTH = 5000 // matches the database check

/**
 * One private answer box. Saves 800 ms after typing stops, when the box loses focus, and when the screen
 * closes. In preview mode it can be typed in but never saves.
 */
export function ReflectionField({
  dayNumber,
  index,
  prompt,
  initial,
  preview = false,
}: {
  dayNumber: number
  index: number
  prompt: string
  initial: string
  preview?: boolean
}) {
  const [value, setValue] = useState(initial)
  const { mutate, status, isPaused } = useSaveReflection(dayNumber, index)
  const saved = useRef(initial)
  const latest = useRef(value)
  const id = `reflection-${dayNumber}-${index}`

  useEffect(() => {
    latest.current = value
  })

  const save = (body: string) => {
    if (preview || body === saved.current) return
    saved.current = body
    mutate(body)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!preview && latest.current !== saved.current) {
        saved.current = latest.current
        mutate(latest.current)
      }
    }, SAVE_AFTER_MS)
    return () => clearTimeout(timer)
  }, [value, mutate, preview])

  // Leaving the screen within 800 ms of typing still saves.
  useEffect(
    () => () => {
      if (!preview && latest.current !== saved.current) mutate(latest.current)
    },
    [mutate, preview],
  )

  const message = preview
    ? 'Preview: answers aren’t saved.'
    : isPaused
      ? 'Waiting for a connection to save…'
      : status === 'pending'
        ? 'Saving…'
        : status === 'error'
          ? 'Couldn’t save just now. Keep typing and we’ll try again.'
          : status === 'success'
            ? 'Saved'
            : ' '

  return (
    <Field>
      <FieldLabel htmlFor={id} className="text-base leading-snug font-semibold">
        {prompt}
      </FieldLabel>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => save(value)}
        maxLength={MAX_LENGTH}
        rows={5}
        className="min-h-32 text-base"
        aria-describedby={`${id}-status`}
      />
      <FieldDescription id={`${id}-status`} aria-live="polite" className="text-base">
        {message}
      </FieldDescription>
    </Field>
  )
}
