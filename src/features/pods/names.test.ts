import { describe, expect, it } from 'vitest'
import { avatarModule, firstName, podNames } from './names'

describe('avatarModule', () => {
  it('is stable and between 1 and 5', () => {
    const id = 'a1000000-0000-4000-8000-000000000001'
    expect(avatarModule(id)).toBe(avatarModule(id))
    for (let n = 0; n < 50; n++) {
      const value = avatarModule(`user-${n}`)
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(5)
    }
  })

  it('spreads people across the colours', () => {
    const used = new Set(Array.from({ length: 50 }, (_, n) => avatarModule(`user-${n}`)))
    expect(used.size).toBe(5)
  })
})

describe('podNames', () => {
  const pod = [
    { userId: 'a', displayName: 'Ada Obi' },
    { userId: 'b', displayName: 'Bola' },
    { userId: 'c', displayName: 'Chidi' },
  ]

  it('lists first names with the reader last', () => {
    expect(podNames(pod, 'b')).toBe('Ada, Chidi and you')
  })

  it('leaves the reader out if they are not in the list', () => {
    expect(podNames(pod, 'z')).toBe('Ada, Bola and Chidi')
  })

  it('capitalises a lone "you"', () => {
    expect(podNames([{ userId: 'b', displayName: 'Bola' }], 'b')).toBe('You')
  })
})

describe('firstName', () => {
  it('returns the first word', () => {
    expect(firstName('Rev Reviewer')).toBe('Rev')
    expect(firstName('Jide')).toBe('Jide')
  })
})
