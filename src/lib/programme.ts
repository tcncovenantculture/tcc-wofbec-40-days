import { TZDate, tz } from '@date-fns/tz'
import { addDays, differenceInCalendarDays } from 'date-fns'

// Every "today" calculation in the app goes through this file. All dates are Africa/Lagos time.

export const TIME_ZONE = 'Africa/Lagos'
export const LESSON_DAYS = 40
export const DAYS_PER_MODULE = 8
export const WOFBEC_DAY = 50

const inLagos = tz(TIME_ZONE)

/** Day 1 starts at 00:00 Lagos time on Nov 14, 2026. */
export const DAY_ONE = new TZDate(2026, 10, 14, TIME_ZONE)

export type ProgrammeDay =
  | { phase: 'before' }
  | { phase: 'lesson'; day: number; module: number }
  | { phase: 'waiting'; day: number }
  | { phase: 'wofbec'; day: number }

export type ProgrammePhase = ProgrammeDay['phase']

/** The curriculum module (1 to 5) that a lesson day belongs to. */
export function moduleFor(day: number): number {
  return Math.ceil(day / DAYS_PER_MODULE)
}

/** Where the programme stands at `now`: before Day 1, a lesson day, a waiting day (41 to 49), or WOFBEC. */
export function programmeDay(now: Date): ProgrammeDay {
  const day = differenceInCalendarDays(now, DAY_ONE, { in: inLagos }) + 1
  if (day < 1) return { phase: 'before' }
  if (day <= LESSON_DAYS) return { phase: 'lesson', day, module: moduleFor(day) }
  if (day < WOFBEC_DAY) return { phase: 'waiting', day }
  return { phase: 'wofbec', day }
}

/** When a day unlocks: 00:00 Lagos time on Nov 13 + day. Used by the content loader for `publish_at`. */
export function publishAtFor(day: number): Date {
  if (!Number.isInteger(day) || day < 1 || day > WOFBEC_DAY) {
    throw new RangeError(`Day must be a whole number from 1 to ${WOFBEC_DAY}, got ${day}`)
  }
  return new Date(addDays(DAY_ONE, day - 1, { in: inLagos }).getTime())
}

/**
 * Formats a date in Lagos time with the browser's Intl (no date-fns format: it would add a locale and
 * formatter bundle to the first load). formatInLagos(d) → "Saturday 14 November".
 */
export function formatInLagos(
  date: Date,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' },
): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, ...options }).format(date)
}

/** Whole calendar days (Lagos) from `now` until Day 1: 0 on Nov 13, negative once it has started. */
export function daysUntilDayOne(now: Date): number {
  return differenceInCalendarDays(DAY_ONE, now, { in: inLagos })
}

// Test clock --------------------------------------------------------------------------------------------
// `?asOf=2026-11-20` pretends it's midday in Lagos on that date. It sticks for the rest of the browser tab
// session, so links inside the app keep it; `?asOf=off` clears it. Only in non-production builds, or when
// VITE_ENABLE_AS_OF is "true" (set on Vercel while it points at staging, so leaders can test on phones).
// The database still hides days until their real unlock time, whatever the app's clock says.

const AS_OF_KEY = 'c40.asOf'

// import.meta.env only exists under Vite: scripts/load-content.ts imports this file from Node, where it's
// undefined, so read it with ?. (the test clock is never used there).
export const asOfEnabled =
  import.meta.env?.MODE !== 'production' || import.meta.env?.VITE_ENABLE_AS_OF === 'true'

/** Parses a YYYY-MM-DD test date as midday Lagos time, or returns null if it isn't a real date. */
export function parseAsOf(value: string | null | undefined): Date | null {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])]
  const date = new TZDate(year, month, day, 12, 0, TIME_ZONE)
  // A date like 2026-11-31 rolls over to Dec 1: reject it rather than guess.
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null
  return new Date(date.getTime())
}

function readStoredAsOf(): string | null {
  try {
    return sessionStorage.getItem(AS_OF_KEY)
  } catch {
    return null
  }
}

function storeAsOf(value: string | null) {
  try {
    if (value) sessionStorage.setItem(AS_OF_KEY, value)
    else sessionStorage.removeItem(AS_OF_KEY)
  } catch {
    // Storage blocked (private mode): the override then lasts only while ?asOf is in the URL.
  }
}

/** The test date in effect, if any. Reads ?asOf from the URL first, then the tab session. */
export function asOfOverride(search: string = globalThis.location?.search ?? ''): Date | null {
  if (!asOfEnabled) return null
  const param = new URLSearchParams(search).get('asOf')
  if (param === 'off') {
    storeAsOf(null)
    return null
  }
  const fromUrl = parseAsOf(param)
  if (fromUrl) {
    storeAsOf(param)
    return fromUrl
  }
  return parseAsOf(readStoredAsOf())
}

/** The current time, or the test date when ?asOf is in effect. */
export function now(): Date {
  return asOfOverride() ?? new Date()
}
