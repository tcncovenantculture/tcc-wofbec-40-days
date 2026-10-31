// The morning reminder (PLAN.md 4.3), only for people who asked for it and haven't done today's day yet.
// Encouraging, never shaming (CLAUDE.md): no "you missed", no "behind", no counts, no streaks. A few
// wordings, picked by day and person so it doesn't read the same every morning. Pure, so Vitest can test it.

import { buttonLink, emailPage, escapeHtml, firstNames, paragraph } from './html.ts'

export type ReminderEmailInput = {
  name: string
  day: number
  title: string
  minutes: number
  siteUrl: string
  unsubscribeUrl: string
  /** Picks the wording; the same person gets a different one each day */
  variant: number
}

type Wording = { subject: string; lines: string[] }

const wordings = (first: string, day: number, title: string, minutes: number): Wording[] => [
  {
    subject: `Day ${day} is ready when you are`,
    lines: [
      `Good morning, ${first}.`,
      `Today’s day, “${title}”, takes about ${minutes} minutes. Find a quiet moment, and your pod will be glad to hear what you think.`,
    ],
  },
  {
    subject: 'A few minutes with Jesus today',
    lines: [
      `Morning, ${first}!`,
      `Day ${day}, “${title}”, is open. Read it slowly, think it through, and try one small thing today.`,
    ],
  },
  {
    subject: `Day ${day}: ${title}`,
    lines: [`Hi ${first},`, `Today’s day is ready for you. It’s about ${minutes} minutes, wherever you are.`],
  },
  {
    subject: 'Good morning from the 40 days',
    lines: [
      `Good morning, ${first}.`,
      `“${title}” is waiting for you today. Take your time with it, and share what stands out with your pod if you’d like to.`,
    ],
  },
]

export const reminderWordingCount = 4

/** A variant number from the day and the person, so wordings rotate. */
export function reminderVariant(day: number, userId: string): number {
  let hash = 0
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return (hash + day) % reminderWordingCount
}

export function reminderEmail(input: ReminderEmailInput): {
  subject: string
  text: string
  html: string
  headers: Record<string, string>
} {
  const first = firstNames([input.name])
  const all = wordings(first, input.day, input.title, input.minutes)
  const wording = all[input.variant % all.length] ?? all[0]
  if (!wording) throw new Error('No reminder wording')
  const link = `${input.siteUrl}/day/${input.day}`
  const smallPrint = 'You’re getting this because you asked for a morning reminder.'

  const text = [
    ...wording.lines,
    '',
    `Open Day ${input.day}: ${link}`,
    '',
    smallPrint,
    `Stop these emails: ${input.unsubscribeUrl} (or turn them off in Settings).`,
  ].join('\n')

  const html = emailPage(
    [
      ...wording.lines.map((line) => paragraph(escapeHtml(line))),
      buttonLink(link, `Open Day ${input.day}`),
    ].join('\n'),
    `${escapeHtml(smallPrint)} <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#5C5149">Stop these emails</a>, or turn them off in Settings.`,
  )

  return {
    subject: wording.subject,
    text,
    html,
    // Lets mail apps show their own "Unsubscribe" link.
    headers: { 'List-Unsubscribe': `<${input.unsubscribeUrl}>` },
  }
}
