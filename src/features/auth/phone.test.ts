import { describe, expect, it } from 'vitest'
import { normaliseWhatsApp } from './phone'

describe('normaliseWhatsApp', () => {
  it.each([
    ['08031234567', '+2348031234567'],
    ['0803 123 4567', '+2348031234567'],
    ['0803-123-4567', '+2348031234567'],
    ['+234 803 123 4567', '+2348031234567'],
    ['+234 (0) 803 123 4567', '+2348031234567'],
    ['+2340803 123 4567', '+2348031234567'],
    ['2348031234567', '+2348031234567'],
    ['002348031234567', '+2348031234567'],
    ['+44 7700 900123', '+447700900123'],
    ['+1 (415) 555-0100', '+14155550100'],
  ])('%s becomes %s', (input, expected) => {
    expect(normaliseWhatsApp(input)).toBe(expected)
  })

  it.each(['', '12345', '0803123456', 'not a number', '+0123456789', '+12345678901234567'])(
    'rejects %s',
    (input) => {
      expect(normaliseWhatsApp(input)).toBeNull()
    },
  )
})
