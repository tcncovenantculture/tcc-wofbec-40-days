// The welcome email, sent once to each person when their pod is formed (PLAN.md 4.3): their pod's name,
// the others' first names, when Day 1 is, and a link to the app. Pure, so Vitest can test it.

import { buttonLink, emailPage, escapeHtml, firstNames, paragraph } from './html.ts'

export type WelcomeEmailInput = {
  name: string
  podName: string
  /** Everyone else in the pod, facilitator first */
  podMates: string[]
  isFacilitator: boolean
  /** The programme day when it's sent (lagosDayNumber): 0 or less before Day 1 */
  day: number
  siteUrl: string
}

export function welcomeEmail(input: WelcomeEmailInput): { subject: string; text: string; html: string } {
  const first = firstNames([input.name])
  const mates = input.podMates.length > 0 ? firstNames(input.podMates) : null
  const subject = `Welcome to the ${input.podName} pod`
  const when =
    input.day <= -1
      ? 'Day 1 opens on Saturday 14 November.'
      : input.day === 0
        ? 'Day 1 opens tomorrow, Saturday 14 November.'
        : input.day === 1
          ? 'Day 1 is open today.'
          : input.day <= 40
            ? `The 40 days have begun: start with Day 1 whenever you’re ready, and take it at your own pace.`
            : 'Your pod is open to talk, and every day is there to read whenever you like.'
  const facilitator = input.isFacilitator
    ? 'You’ve been picked at random as your pod’s facilitator. There’s nothing extra you have to do: you can pin a post, hide a message if you ever need to, and set up a WhatsApp group if your pod would like one.'
    : null
  const link = `${input.siteUrl}/pod`
  const smallPrint =
    'You’re getting this because you joined Covenant Culture 40 Days. It’s a one-off: we only send other emails if you asked for reminders.'

  const text = [
    `Hi ${first},`,
    '',
    `Your pod has formed: you’re in ${input.podName}${mates ? `, with ${mates}` : ''}.`,
    when,
    'Each day takes about 10 to 15 minutes, and your pod is where you talk it through together.',
    ...(facilitator ? ['', facilitator] : []),
    '',
    `Say hello to your pod: ${link}`,
    '',
    smallPrint,
  ].join('\n')

  const html = emailPage(
    [
      paragraph(`Hi ${escapeHtml(first)},`),
      paragraph(
        `Your pod has formed: you’re in <strong>${escapeHtml(input.podName)}</strong>${mates ? `, with ${escapeHtml(mates)}` : ''}.`,
      ),
      paragraph(escapeHtml(when)),
      paragraph('Each day takes about 10 to 15 minutes, and your pod is where you talk it through together.'),
      facilitator ? paragraph(escapeHtml(facilitator)) : '',
      buttonLink(link, 'Say hello to your pod'),
    ].join('\n'),
    escapeHtml(smallPrint),
  )

  return { subject, text, html }
}
