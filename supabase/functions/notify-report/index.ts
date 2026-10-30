// Emails every moderator when a message is reported (PLAN.md 4.1). Called by a Database Webhook on inserts
// into public.reports: set up in the dashboard on staging and prod, and by supabase/seed.sql locally.
//
// No auth header is needed (verify_jwt is off in config.toml): each report is emailed about at most once,
// because notified_at is claimed in the database before sending, so a repeated or direct call can't spam.
//
// Secrets: RESEND_API_KEY and NOTIFY_FROM to send through Resend, SITE_URL for the link to /mod. Locally,
// MAILPIT_URL sends to Mailpit instead (config.toml, [edge_runtime.secrets]). With neither, it only logs.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { reportEmail, type ReportReason } from '../_shared/report-email.ts'

type Claimed = {
  id: string
  reason: ReportReason
  details: string | null
  message: {
    body: string
    day_number: number | null
    created_at: string
    author: { display_name: string } | null
    pod: { name: string } | null
  } | null
}

type Email = { subject: string; text: string; html: string }

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'POST only' }, 405)
  const payload = (await request.json().catch(() => null)) as { record?: { id?: unknown } } | null
  const reportId = payload?.record?.id
  if (typeof reportId !== 'string') return json({ error: 'Expected a webhook payload with record.id' }, 400)

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) return json({ error: 'Missing Supabase environment' }, 500)
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  // Claim the report: only the first call gets the row back, so each report is emailed once.
  const { data, error } = await supabase
    .from('reports')
    .update({ notified_at: new Date().toISOString() })
    .eq('id', reportId)
    .is('notified_at', null)
    .select(
      'id, reason, details, message:messages(body, day_number, created_at, author:profiles!messages_author_id_fkey(display_name), pod:pods(name))',
    )
    .maybeSingle()
  if (error) return json({ error: error.message }, 500)
  const claimed = data as Claimed | null
  if (!claimed?.message) return json({ skipped: 'Unknown report, or already emailed' }, 200)

  // If sending doesn't happen, let a later call try again.
  const release = () => supabase.from('reports').update({ notified_at: null }).eq('id', claimed.id)

  const { data: moderators, error: moderatorsError } = await supabase
    .from('profiles')
    .select('email')
    .eq('role', 'moderator')
  if (moderatorsError) {
    await release()
    return json({ error: moderatorsError.message }, 500)
  }
  const to = (moderators as { email: string }[]).map((m) => m.email)
  if (to.length === 0) {
    await release()
    console.warn(`Report ${claimed.id}: no moderators to email. Set role = 'moderator' on their profiles.`)
    return json({ skipped: 'No moderators yet' }, 202)
  }

  const site = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '')
  const email = reportEmail({
    reason: claimed.reason,
    details: claimed.details,
    body: claimed.message.body,
    authorName: claimed.message.author?.display_name ?? null,
    podName: claimed.message.pod?.name ?? null,
    day: claimed.message.day_number,
    sentAt: claimed.message.created_at,
    modUrl: `${site}/mod`,
  })

  try {
    const sentBy = await send(to, email)
    if (!sentBy) {
      await release()
      return json({ skipped: 'No email service configured; logged instead' }, 202)
    }
    return json({ sent: to.length, by: sentBy }, 200)
  } catch (sendError) {
    await release()
    console.error(`Report ${claimed.id}: sending failed`, sendError)
    return json({ error: String(sendError) }, 502)
  }
})

/** Sends one email per moderator. Returns which service sent them, or null if none is configured. */
async function send(to: string[], email: Email): Promise<'resend' | 'mailpit' | null> {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('NOTIFY_FROM')
  if (resendKey && from) {
    const response = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(to.map((address) => ({ from, to: [address], ...email }))),
    })
    if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`)
    return 'resend'
  }

  const mailpit = Deno.env.get('MAILPIT_URL')
  if (mailpit) {
    for (const address of to) {
      const response = await fetch(`${mailpit}/api/v1/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          From: { Email: 'moderation@localhost', Name: 'Covenant Culture 40 Days' },
          To: [{ Email: address }],
          Subject: email.subject,
          Text: email.text,
          HTML: email.html,
        }),
      })
      if (!response.ok) throw new Error(`Mailpit ${response.status}: ${await response.text()}`)
    }
    return 'mailpit'
  }

  console.log(`No email service configured. Would have sent "${email.subject}" to ${to.length} moderator(s).`)
  return null
}
