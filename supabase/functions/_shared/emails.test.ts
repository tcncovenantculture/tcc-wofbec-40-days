import { describe, expect, it } from 'vitest'
import { firstNames, lagosDayNumber } from './html.ts'
import {
  reminderEmail,
  reminderVariant,
  reminderWordingCount,
  type ReminderEmailInput,
} from './reminder-email.ts'
import { welcomeEmail, type WelcomeEmailInput } from './welcome-email.ts'

describe('lagosDayNumber', () => {
  it('counts days in Lagos time, not UTC', () => {
    expect(lagosDayNumber(new Date('2026-11-13T12:00:00Z'))).toBe(0)
    expect(lagosDayNumber(new Date('2026-11-13T22:59:00Z'))).toBe(0) // 23:59 in Lagos
    expect(lagosDayNumber(new Date('2026-11-13T23:00:00Z'))).toBe(1) // midnight in Lagos
    expect(lagosDayNumber(new Date('2026-11-12T10:00:00Z'))).toBe(-1)
    expect(lagosDayNumber(new Date('2026-12-23T05:30:00Z'))).toBe(40)
    expect(lagosDayNumber(new Date('2027-01-02T05:30:00Z'))).toBe(50)
  })
})

describe('firstNames', () => {
  it('lists first names', () => {
    expect(firstNames(['Ada Obi', 'Bola', 'Chidi Eze'])).toBe('Ada, Bola and Chidi')
    expect(firstNames(['Ada Obi'])).toBe('Ada')
  })
})

const welcome: WelcomeEmailInput = {
  name: 'Dayo Adeyemi',
  podName: 'Cedar',
  podMates: ['Ada Obi', 'Bola', 'Efe', 'Funmi'],
  isFacilitator: false,
  day: 0,
  siteUrl: 'https://40days.example',
}

describe('welcomeEmail', () => {
  it('names the pod and the others, says when Day 1 is, and links to the pod', () => {
    const { subject, text, html } = welcomeEmail(welcome)
    expect(subject).toBe('Welcome to the Cedar pod')
    expect(text).toContain('Hi Dayo,')
    expect(text).toContain('you’re in Cedar, with Ada, Bola, Efe and Funmi.')
    expect(text).toContain('Day 1 opens tomorrow, Saturday 14 November.')
    expect(text).toContain('https://40days.example/pod')
    expect(text).not.toContain('facilitator')
    expect(html).toContain('<strong>Cedar</strong>')
  })

  it('tells the facilitator what it means, without asking more of them', () => {
    expect(welcomeEmail({ ...welcome, isFacilitator: true }).text).toContain(
      'You’ve been picked at random as your pod’s facilitator. There’s nothing extra you have to do',
    )
  })

  it('fits the day it’s sent, for late joiners', () => {
    expect(welcomeEmail({ ...welcome, day: -2 }).text).toContain('Day 1 opens on Saturday 14 November.')
    expect(welcomeEmail({ ...welcome, day: 1 }).text).toContain('Day 1 is open today.')
    const later = welcomeEmail({ ...welcome, day: 12 }).text
    expect(later).toContain('start with Day 1 whenever you’re ready')
    expect(later).not.toMatch(/behind|missed|catch up/i)
  })

  it('escapes names in the HTML', () => {
    const { html } = welcomeEmail({ ...welcome, name: '<b>Eve</b>', podMates: ['<i>x</i>'] })
    expect(html).not.toContain('<b>Eve')
    expect(html).toContain('&lt;b&gt;Eve&lt;/b&gt;')
    expect(html).not.toContain('<i>x')
  })
})

const reminder: ReminderEmailInput = {
  name: 'Halima Bello',
  day: 12,
  title: 'Sample: Trust',
  minutes: 11,
  siteUrl: 'https://40days.example',
  unsubscribeUrl: 'https://40days.example/unsubscribe?token=abc',
  variant: 0,
}

describe('reminderEmail', () => {
  it('links to the day and to unsubscribing, in the body and the header', () => {
    const email = reminderEmail(reminder)
    expect(email.subject).toBe('Day 12 is ready when you are')
    expect(email.text).toContain('Good morning, Halima.')
    expect(email.text).toContain('https://40days.example/day/12')
    expect(email.text).toContain('Stop these emails: https://40days.example/unsubscribe?token=abc')
    expect(email.html).toContain('href="https://40days.example/unsubscribe?token=abc"')
    expect(email.headers['List-Unsubscribe']).toBe('<https://40days.example/unsubscribe?token=abc>')
  })

  it('never shames: no missed days, no "behind", no streaks, no counts of days done', () => {
    for (let variant = 0; variant < reminderWordingCount; variant++) {
      const { subject, text } = reminderEmail({ ...reminder, variant })
      expect(`${subject}\n${text}`).not.toMatch(
        /miss|behind|streak|late|haven’t|haven't|catch up|days? (done|left)/i,
      )
    }
  })

  it('has a few different wordings, rotating by day for each person', () => {
    const subjects = new Set(
      Array.from(
        { length: reminderWordingCount },
        (_, variant) => reminderEmail({ ...reminder, variant }).subject,
      ),
    )
    expect(subjects.size).toBe(reminderWordingCount)
    const id = 'a1000000-0000-4000-8000-000000000001'
    expect(reminderVariant(13, id)).toBe((reminderVariant(12, id) + 1) % reminderWordingCount)
  })
})
