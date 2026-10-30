import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  asOfOverride,
  daysUntilDayOne,
  formatInLagos,
  moduleFor,
  nextOpenDay,
  parseAsOf,
  programmeDay,
  publishAtFor,
} from './programme'

// Inputs are UTC instants. Lagos is UTC+1 all year, so Lagos midnight is 23:00 UTC the evening before.
const at = (iso: string) => new Date(iso)

describe('programmeDay', () => {
  it.each([
    ['Nov 13, 23:59 Lagos', '2026-11-13T22:59:00Z', { phase: 'before' }],
    ['Nov 14, 00:00 Lagos', '2026-11-13T23:00:00Z', { phase: 'lesson', day: 1, module: 1 }],
    ['Nov 14, 23:59 Lagos', '2026-11-14T22:59:00Z', { phase: 'lesson', day: 1, module: 1 }],
    ['Day 8 (Nov 21)', '2026-11-21T10:00:00Z', { phase: 'lesson', day: 8, module: 1 }],
    ['Day 9 (Nov 22)', '2026-11-22T10:00:00Z', { phase: 'lesson', day: 9, module: 2 }],
    ['Day 15, The Convergence (Nov 28)', '2026-11-28T10:00:00Z', { phase: 'lesson', day: 15, module: 2 }],
    ['Day 40 (Dec 23)', '2026-12-23T10:00:00Z', { phase: 'lesson', day: 40, module: 5 }],
    ['Dec 23, 23:59 Lagos', '2026-12-23T22:59:00Z', { phase: 'lesson', day: 40, module: 5 }],
    ['Dec 24, 00:00 Lagos', '2026-12-23T23:00:00Z', { phase: 'waiting', day: 41 }],
    ['Jan 1 (day 49)', '2027-01-01T10:00:00Z', { phase: 'waiting', day: 49 }],
    ['Jan 2 (day 50, WOFBEC)', '2027-01-02T10:00:00Z', { phase: 'wofbec', day: 50 }],
    ['Jan 2, 00:00 Lagos', '2027-01-01T23:00:00Z', { phase: 'wofbec', day: 50 }],
    ['well after', '2027-03-01T10:00:00Z', { phase: 'wofbec', day: 108 }],
    ['weeks before', '2026-10-30T10:00:00Z', { phase: 'before' }],
  ])('%s', (_label, iso, expected) => {
    expect(programmeDay(at(iso))).toEqual(expected)
  })

  it('does not treat UTC midnight as Lagos midnight', () => {
    // 00:30 UTC on Nov 14 is already 01:30 on Day 1 in Lagos...
    expect(programmeDay(at('2026-11-14T00:30:00Z'))).toEqual({ phase: 'lesson', day: 1, module: 1 })
    // ...and 23:30 UTC on Nov 14 is 00:30 on Day 2 in Lagos, not still Day 1.
    expect(programmeDay(at('2026-11-14T23:30:00Z'))).toEqual({ phase: 'lesson', day: 2, module: 1 })
  })
})

describe('moduleFor', () => {
  it.each([
    [1, 1],
    [8, 1],
    [9, 2],
    [16, 2],
    [17, 3],
    [32, 4],
    [33, 5],
    [40, 5],
  ])('day %i is in module %i', (day, module) => {
    expect(moduleFor(day)).toBe(module)
  })
})

describe('publishAtFor', () => {
  it('unlocks each day at 00:00 Lagos time on Nov 13 + day', () => {
    expect(publishAtFor(1).toISOString()).toBe('2026-11-13T23:00:00.000Z')
    expect(publishAtFor(15).toISOString()).toBe('2026-11-27T23:00:00.000Z')
    expect(publishAtFor(40).toISOString()).toBe('2026-12-22T23:00:00.000Z')
    expect(publishAtFor(50).toISOString()).toBe('2027-01-01T23:00:00.000Z')
  })

  it('agrees with programmeDay at every unlock moment', () => {
    for (let day = 1; day <= 40; day++) {
      const unlock = publishAtFor(day)
      expect(programmeDay(unlock)).toMatchObject({ phase: 'lesson', day })
      expect(programmeDay(new Date(unlock.getTime() - 1))).not.toMatchObject({ day })
    }
  })

  it.each([0, 51, 1.5, Number.NaN])('rejects %s', (day) => {
    expect(() => publishAtFor(day)).toThrow(RangeError)
  })
})

describe('nextOpenDay', () => {
  const lesson = (day: number) => ({ phase: 'lesson' as const, day, module: moduleFor(day) })
  const all = Array.from({ length: 40 }, (_, i) => i + 1)

  it('points to the earliest open day not done yet', () => {
    expect(nextOpenDay({ current: 7, today: lesson(7), done: new Set([1, 2, 4]), available: all })).toBe(3)
  })

  it('points to today after catching up on an older day', () => {
    expect(
      nextOpenDay({ current: 6, today: lesson(7), done: new Set([1, 2, 3, 4, 5]), available: all }),
    ).toBe(7)
  })

  it('is null when everything open is done', () => {
    expect(
      nextOpenDay({ current: 7, today: lesson(7), done: new Set([1, 2, 3, 4, 5, 6]), available: all }),
    ).toBeNull()
  })

  it('never points to a day that is still locked or not loaded', () => {
    expect(nextOpenDay({ current: 2, today: lesson(3), done: new Set([1]), available: [1, 2] })).toBeNull()
    expect(
      nextOpenDay({ current: 1, today: { phase: 'before' }, done: new Set(), available: all }),
    ).toBeNull()
  })

  it('treats all 40 days as open during the waiting days', () => {
    expect(
      nextOpenDay({ current: 40, today: { phase: 'waiting', day: 43 }, done: new Set(), available: all }),
    ).toBe(1)
  })
})

describe('daysUntilDayOne', () => {
  it.each([
    ['Oct 30', '2026-10-30T10:00:00Z', 15],
    ['00:00 Nov 13, Lagos', '2026-11-12T23:00:00Z', 1],
    ['23:59 Nov 13, Lagos', '2026-11-13T22:59:00Z', 1],
    ['00:00 Nov 14, Lagos (Day 1)', '2026-11-13T23:00:00Z', 0],
    ['Nov 15', '2026-11-15T10:00:00Z', -1],
  ])('%s → %i', (_label, iso, expected) => {
    // + 0 turns a -0 from date-fns into 0
    expect(daysUntilDayOne(new Date(iso)) + 0).toBe(expected)
  })
})

describe('formatInLagos', () => {
  it('formats in Lagos time, not the machine timezone', () => {
    // 23:30 UTC on Nov 13 is already Saturday Nov 14 in Lagos.
    const lateNov13Utc = new Date('2026-11-13T23:30:00Z')
    expect(formatInLagos(lateNov13Utc)).toBe('Saturday 14 November')
    expect(formatInLagos(lateNov13Utc, { hour: '2-digit', minute: '2-digit' })).toBe('00:30')
  })
})

describe('parseAsOf', () => {
  it('reads a date as midday Lagos time', () => {
    expect(parseAsOf('2026-11-20')?.toISOString()).toBe('2026-11-20T11:00:00.000Z')
  })

  it.each([null, undefined, '', 'tomorrow', '2026-11-31', '2026-13-01', '20-11-2026', '2026-11-20T10:00'])(
    'rejects %s',
    (value) => {
      expect(parseAsOf(value)).toBeNull()
    },
  )
})

describe('asOfOverride', () => {
  // Vitest runs in Node, which has no sessionStorage: stand in a minimal one.
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses ?asOf and keeps it for the tab session', () => {
    expect(asOfOverride('?asOf=2026-11-14')?.toISOString()).toBe('2026-11-14T11:00:00.000Z')
    expect(asOfOverride('')?.toISOString()).toBe('2026-11-14T11:00:00.000Z')
  })

  it('clears with ?asOf=off', () => {
    asOfOverride('?asOf=2026-11-14')
    expect(asOfOverride('?asOf=off')).toBeNull()
    expect(asOfOverride('')).toBeNull()
  })

  it('ignores an invalid date and keeps the stored one', () => {
    asOfOverride('?asOf=2026-11-14')
    expect(asOfOverride('?asOf=nonsense')?.toISOString()).toBe('2026-11-14T11:00:00.000Z')
  })
})
