import { TIME_ZONE } from '@/lib/programme'

const clock = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' })
const shortDate = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'short' })
const calendarDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** "09:42" for a message sent today (Lagos time), "12 Nov, 09:42" for anything earlier. */
export function formatMessageTime(sentAt: string, now: Date): string {
  const at = new Date(sentAt)
  const time = clock.format(at)
  return calendarDay.format(at) === calendarDay.format(now) ? time : `${shortDate.format(at)}, ${time}`
}

/** A random id for a message being sent, so retrying it can't post it twice. */
export function newMessageId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // Older phone browsers: build a version 4 UUID by hand.
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
