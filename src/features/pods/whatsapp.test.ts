import { describe, expect, it } from 'vitest'
import { extractInviteLink, whatsAppShareLink } from './whatsapp'

describe('extractInviteLink', () => {
  const clean = 'https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv'

  it('keeps a plain invite link', () => {
    expect(extractInviteLink(clean)).toBe(clean)
  })

  it('drops the tracking suffix', () => {
    expect(extractInviteLink(`${clean}?mode=ems_copy_t`)).toBe(clean)
  })

  it('finds the link inside WhatsApp’s own share text', () => {
    expect(extractInviteLink(`Follow this link to join my WhatsApp group: ${clean}`)).toBe(clean)
  })

  it('accepts a link pasted without https or with /invite/', () => {
    expect(extractInviteLink('chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv')).toBe(clean)
    expect(extractInviteLink('https://chat.whatsapp.com/invite/AbCdEfGhIjKlMnOpQrStUv')).toBe(clean)
  })

  it('rejects anything that is not a group invite', () => {
    expect(extractInviteLink('https://example.com/AbCdEfGhIjKlMnOpQrStUv')).toBeNull()
    expect(extractInviteLink('https://wa.me/2348031234567')).toBeNull()
    expect(extractInviteLink('https://chat.whatsapp.com/')).toBeNull()
    expect(extractInviteLink('')).toBeNull()
  })
})

describe('whatsAppShareLink', () => {
  it('encodes the text', () => {
    expect(whatsAppShareLink('Day 3: what’s one thing? & more')).toBe(
      'https://wa.me/?text=Day%203%3A%20what%E2%80%99s%20one%20thing%3F%20%26%20more',
    )
  })
})
