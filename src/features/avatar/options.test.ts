import { describe, expect, it } from 'vitest'
import { moduleAccents } from '@/theme/tokens'
import { avatarFor, parseAvatar, randomAvatar, seededAvatar, type AvatarChoice } from './options'
import { avatarDataUri } from './render'

const sample: AvatarChoice = {
  v: 1,
  skin: '8c5a2b',
  hair: 'braids',
  hairColour: '220f00',
  accessory: 'glasses',
  eyes: 'cheery',
  mouth: 'openedSmile',
  background: 3,
}

describe('parseAvatar', () => {
  it('accepts a saved avatar', () => {
    expect(parseAvatar(sample)).toEqual(sample)
  })

  it('drops unknown fields', () => {
    expect(parseAvatar({ ...sample, extra: 'x' })).toEqual(sample)
  })

  it('rejects anything outside the offered options', () => {
    expect(parseAvatar(null)).toBeNull()
    expect(parseAvatar('braids')).toBeNull()
    expect(parseAvatar({ ...sample, v: 2 })).toBeNull()
    expect(parseAvatar({ ...sample, accessory: 'clownNose' })).toBeNull()
    expect(parseAvatar({ ...sample, eyes: 'angry' })).toBeNull()
    expect(parseAvatar({ ...sample, skin: '000000' })).toBeNull()
    expect(parseAvatar({ ...sample, background: 6 })).toBeNull()
    expect(parseAvatar({ ...sample, background: '3' })).toBeNull()
  })
})

describe('seededAvatar', () => {
  it('gives the same avatar for the same seed', () => {
    const id = 'a1000000-0000-4000-8000-000000000001'
    expect(seededAvatar(id)).toEqual(seededAvatar(id))
  })

  it('always gives a valid avatar, and varies between people', () => {
    const avatars = Array.from({ length: 200 }, (_, n) => seededAvatar(`user-${n}`))
    for (const avatar of avatars) expect(parseAvatar(avatar)).toEqual(avatar)
    expect(new Set(avatars.map((a) => a.skin)).size).toBeGreaterThanOrEqual(6)
    expect(new Set(avatars.map((a) => a.hair)).size).toBeGreaterThanOrEqual(10)
    expect(new Set(avatars.map((a) => a.background)).size).toBe(5)
  })
})

describe('randomAvatar', () => {
  it('gives a valid avatar for any random number', () => {
    for (const r of [0, 0.25, 0.5, 0.999999]) {
      const avatar = randomAvatar(() => r)
      expect(parseAvatar(avatar)).toEqual(avatar)
    }
  })
})

describe('avatarFor', () => {
  it('uses the saved avatar, or the seeded one when there is none', () => {
    expect(avatarFor(sample, 'someone')).toEqual(sample)
    expect(avatarFor(null, 'someone')).toEqual(seededAvatar('someone'))
    expect(avatarFor({ broken: true }, 'someone')).toEqual(seededAvatar('someone'))
  })
})

describe('avatarDataUri', () => {
  it('draws an SVG on the chosen module colour, once per avatar', () => {
    const uri = avatarDataUri(sample)
    expect(uri.startsWith('data:image/svg+xml')).toBe(true)
    expect(decodeURIComponent(uri).toLowerCase()).toContain(moduleAccents[3].base.toLowerCase())
    expect(avatarDataUri({ ...sample })).toBe(uri)
  })
})
