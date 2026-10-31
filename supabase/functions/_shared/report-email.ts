// The email every moderator gets when a message is reported. Pure (no Deno or Node APIs), so Vitest can
// test it: supabase/functions/_shared/report-email.test.ts.

import { escapeHtml } from './html.ts'

export { escapeHtml }

export type ReportReason = 'unkind' | 'unsafe' | 'spam' | 'other'

export type ReportEmailInput = {
  reason: ReportReason
  details: string | null
  body: string
  authorName: string | null
  /** Null for an announcement, which belongs to no pod. */
  podName: string | null
  /** Null for general chat. */
  day: number | null
  sentAt: string
  modUrl: string
}

const reasons: Record<ReportReason, string> = {
  unkind: 'Unkind',
  unsafe: 'Unsafe',
  spam: 'Spam',
  other: 'Something else',
}

const lagos = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Lagos',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function reportEmail(input: ReportEmailInput): { subject: string; text: string; html: string } {
  const where = input.podName
    ? `the ${input.podName} pod (${input.day === null ? 'general chat' : `Day ${input.day}`})`
    : 'the announcements'
  const reason = reasons[input.reason]
  const author = input.authorName ?? 'a former member'
  const when = lagos.format(new Date(input.sentAt))
  const subject = `${input.reason === 'unsafe' ? 'Unsafe: a' : 'A'} message was reported in ${
    input.podName ? `the ${input.podName} pod` : 'the announcements'
  }`

  const text = [
    `Someone reported a message in ${where}.`,
    `Reason: ${reason}`,
    ...(input.details ? [`What they said: ${input.details}`] : []),
    '',
    `The message, from ${author} on ${when}:`,
    input.body,
    '',
    `Review it and decide: ${input.modUrl}`,
    '',
    'You’re getting this because you’re a moderator for Covenant Culture 40 Days.',
  ].join('\n')

  const paragraph = (content: string) => `<p style="margin:0 0 12px;line-height:1.5">${content}</p>`
  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#FBF5EE;font-family:Arial,sans-serif;color:#1B1714;font-size:16px">
<div style="max-width:480px;margin:0 auto;background:#FFFDF9;border-radius:16px;padding:24px">
${paragraph(`Someone reported a message in ${escapeHtml(where)}.`)}
${paragraph(`<strong>Reason:</strong> ${escapeHtml(reason)}`)}
${input.details ? paragraph(`<strong>What they said:</strong> ${escapeHtml(input.details)}`) : ''}
${paragraph(`The message, from ${escapeHtml(author)} on ${escapeHtml(when)}:`)}
<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:4px solid #C2343E;background:#FBF5EE;white-space:pre-wrap">${escapeHtml(input.body)}</blockquote>
<p style="margin:0 0 20px"><a href="${escapeHtml(input.modUrl)}" style="display:inline-block;background:#BC4B16;color:#FFFFFF;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:12px">Review it and decide</a></p>
<p style="margin:0;color:#5C5149;font-size:14px">You’re getting this because you’re a moderator for Covenant Culture 40 Days.</p>
</div>
</body></html>`

  return { subject, text, html }
}
