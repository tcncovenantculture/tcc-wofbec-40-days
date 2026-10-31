// Sends emails for the edge functions: through Resend when RESEND_API_KEY and NOTIFY_FROM are set, to
// Mailpit when MAILPIT_URL is (local, in config.toml), otherwise it only logs. REPLY_TO, if set, is where
// replies go (a church inbox).

export type OutgoingEmail = {
  to: string
  subject: string
  text: string
  html: string
  headers?: Record<string, string>
}

// Resend takes up to 100 emails per batch call and, on the default plan, about two calls a second.
const BATCH = 100
const PAUSE_MS = 600

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Sends each email. Returns which service sent them, or null if none is configured. Throws on the first
 * failure; emails in earlier batches have gone by then, and the caller says which ones (see `onSent`).
 */
export async function sendEmails(
  emails: OutgoingEmail[],
  onSent: (sent: OutgoingEmail[]) => void = () => {},
): Promise<'resend' | 'mailpit' | null> {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('NOTIFY_FROM')
  const replyTo = Deno.env.get('REPLY_TO')

  if (resendKey && from) {
    for (let start = 0; start < emails.length; start += BATCH) {
      const batch = emails.slice(start, start + BATCH)
      if (start > 0) await pause(PAUSE_MS)
      const response = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(
          batch.map((email) => ({
            from,
            to: [email.to],
            subject: email.subject,
            text: email.text,
            html: email.html,
            ...(replyTo ? { reply_to: replyTo } : {}),
            ...(email.headers ? { headers: email.headers } : {}),
          })),
        ),
      })
      if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`)
      onSent(batch)
    }
    return 'resend'
  }

  const mailpit = Deno.env.get('MAILPIT_URL')
  if (mailpit) {
    for (const email of emails) {
      const response = await fetch(`${mailpit}/api/v1/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          From: { Email: 'hello@localhost', Name: 'Covenant Culture 40 Days' },
          To: [{ Email: email.to }],
          ...(replyTo ? { ReplyTo: [{ Email: replyTo }] } : {}),
          Subject: email.subject,
          Text: email.text,
          HTML: email.html,
          ...(email.headers ? { Headers: email.headers } : {}),
        }),
      })
      if (!response.ok) throw new Error(`Mailpit ${response.status}: ${await response.text()}`)
      onSent([email])
    }
    return 'mailpit'
  }

  for (const email of emails) console.log(`No email service configured. Would have sent "${email.subject}".`)
  return null
}

export const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
