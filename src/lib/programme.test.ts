import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { asOfOverride, moduleFor, parseAsOf, programmeDay, publishAtFor } from './programme'

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
