// The morning reminder (PLAN.md 4.3), called by the pg_cron job `daily-reminder` at 06:30 in Lagos (see the
// emails migration). Emails everyone who asked for reminders and hasn't done today's day; nothing on waiting
// days or before today's day is published. The wording rotates and never shames (_shared/reminder-email.ts).
//
// No key is needed (verify_jwt is off in config.toml): claim_daily_reminders() marks each person as reminded
// today as it picks them, so a second call, or one from someone else, can't send anyone two reminders. It
// also only runs between 06:00 and 12:00 in Lagos, so nobody can trigger reminders in the middle of the night.
// Locally, ALLOW_AS_OF lets the body choose the time: {"asOf": "2026-11-17T06:30:00+01:00"}.
//
// Secrets: RESEND_API_KEY and NOTIFY_FROM (Resend), REPLY_TO (optional), SITE_URL for the links. Locally,
// MAILPIT_URL sends to Mailpit (config.toml).

import { createClient } from 'npm:@supabase/supabase-js@2'
import { reminderEmail, reminderVariant } from '../_shared/reminder-email.ts'
import { json, sendEmails, type OutgoingEmail } from '../_shared/send-email.ts'

type Claimed = {
  user_id: string
  email: string
  display_name: string
  unsubscribe_token: string
  day_number: number
  title: string
  est_minutes: number
}

/** The hour in Lagos (UTC+1 all year). */
const lagosHour = (at: Date) => (at.getUTCHours() + 1) % 24

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'POST only' }, 405)

  const body = (await request.json().catch(() => ({}))) as { asOf?: unknown }
  const testing = Deno.env.get('ALLOW_AS_OF') === 'true' && typeof body.asOf === 'string'
  const at = testing ? new Date(body.asOf as string) : new Date()
  if (Number.isNaN(at.getTime())) return json({ error: 'asOf is not a date' }, 400)
  if (!testing && (lagosHour(at) < 6 || lagosHour(at) >= 12)) {
    return json({ sent: 0, skipped: 'Reminders only go out between 06:00 and 12:00 in Lagos' }, 200)
  }

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) return json({ error: 'Missing Supabase environment' }, 500)
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data, error } = await supabase.rpc('claim_daily_reminders', { at: at.toISOString() })
  if (error) return json({ error: error.message }, 500)
  const people = (data ?? []) as Claimed[]
  if (people.length === 0) return json({ sent: 0, skipped: 'Nobody to remind today' }, 200)

  const site = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '')
  const emails: OutgoingEmail[] = people.map((person) => ({
    to: person.email,
    ...reminderEmail({
      name: person.display_name,
      day: person.day_number,
      title: person.title,
      minutes: person.est_minutes,
      siteUrl: site,
      unsubscribeUrl: `${site}/unsubscribe?token=${person.unsubscribe_token}`,
      variant: reminderVariant(person.day_number, person.user_id),
    }),
  }))

  const sent = new Set<string>()
  // Anyone not emailed is released (their last_reminded_on cleared), so a later call today tries again.
  const releaseUnsent = async () => {
    const unsent = people.filter((person) => !sent.has(person.email)).map((person) => person.user_id)
    if (unsent.length > 0) await supabase.from('profiles').update({ last_reminded_on: null }).in('id', unsent)
    return unsent.length
  }

  try {
    const by = await sendEmails(emails, (batch) => batch.forEach((email) => sent.add(email.to)))
    if (!by) {
      await releaseUnsent()
      return json({ sent: 0, skipped: 'No email service configured; logged instead' }, 202)
    }
    return json({ sent: sent.size, day: people[0]?.day_number, by }, 200)
  } catch (sendError) {
    const released = await releaseUnsent()
    console.error('Daily reminders: sending failed', sendError)
    return json({ sent: sent.size, released, error: String(sendError) }, 502)
  }
})
