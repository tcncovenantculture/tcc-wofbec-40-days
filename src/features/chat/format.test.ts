import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatMessageTime, newMessageId } from './format'

describe('formatMessageTime', () => {
  // 10:00 on 20 Nov in Lagos (UTC+1).
  const now = new Date('2026-11-20T09:00:00Z')

  it('shows only the time for a message sent today in Lagos', () => {
    expect(formatMessageTime('2026-11-20T06:42:00Z', now)).toBe('07:42')
  })

  it('counts days in Lagos time, not the phone’s', () => {
    // 23:30 UTC on 19 Nov is 00:30 on 20 Nov in Lagos: still today.
    expect(formatMessageTime('2026-11-19T23:30:00Z', now)).toBe('00:30')
  })

  it('adds the date for anything earlier', () => {
    expect(formatMessageTime('2026-11-19T22:30:00Z', now)).toBe('19 Nov, 23:30')
  })
})

describe('newMessageId', () => {
  afterEach(() => vi.unstubAllGlobals())

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

  it('returns a version 4 UUID', () => {
    expect(newMessageId()).toMatch(uuid)
  })

  it('builds one by hand where randomUUID is missing', () => {
    const real = globalThis.crypto
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array<ArrayBuffer>) => real.getRandomValues(bytes),
    })
    const ids = new Set(Array.from({ length: 20 }, () => newMessageId()))
    expect(ids.size).toBe(20)
    for (const id of ids) expect(id).toMatch(uuid)
  })
})
