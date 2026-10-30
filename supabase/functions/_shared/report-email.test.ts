import { describe, expect, it } from 'vitest'
import { escapeHtml, reportEmail, type ReportEmailInput } from './report-email.ts'

const base: ReportEmailInput = {
  reason: 'unkind',
  details: 'It felt aimed at me',
  body: 'The message text',
  authorName: 'Dayo',
  podName: 'Rooftop',
  day: 3,
  sentAt: '2026-11-16T08:42:00Z', // 09:42 in Lagos
  modUrl: 'https://40days.example/mod',
}

describe('reportEmail', () => {
  it('says where, why, what and from whom, with a link to /mod', () => {
    const { subject, text } = reportEmail(base)
    expect(subject).toBe('A message was reported in the Rooftop pod')
    expect(text).toContain('Someone reported a message in the Rooftop pod (Day 3).')
    expect(text).toContain('Reason: Unkind')
    expect(text).toContain('What they said: It felt aimed at me')
    expect(text).toContain('The message, from Dayo on 16 Nov, 09:42:')
    expect(text).toContain('Review it and decide: https://40days.example/mod')
  })

  it('flags unsafe reports in the subject', () => {
    expect(reportEmail({ ...base, reason: 'unsafe' }).subject).toBe(
      'Unsafe: a message was reported in the Rooftop pod',
    )
  })

  it('handles general chat, announcements, no details and former members', () => {
    const { text, subject } = reportEmail({
      ...base,
      podName: null,
      day: null,
      details: null,
      authorName: null,
    })
    expect(subject).toBe('A message was reported in the announcements')
    expect(text).toContain('Someone reported a message in the announcements.')
    expect(text).not.toContain('What they said')
    expect(text).toContain('from a former member')
    expect(reportEmail({ ...base, day: null }).text).toContain('(general chat)')
  })

  it('never lets what people typed become HTML', () => {
    const { html } = reportEmail({
      ...base,
      body: '<script>alert(1)</script>',
      details: '<img src=x onerror=alert(1)>',
      authorName: 'Eve <b>',
    })
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('Eve &lt;b&gt;')
  })
})

describe('escapeHtml', () => {
  it('escapes the five special characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;')
  })
})
