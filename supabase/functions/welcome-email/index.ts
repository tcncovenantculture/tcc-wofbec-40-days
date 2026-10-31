// Sends the welcome email to everyone in a pod who hasn't had it (PLAN.md 4.3). Run once on Nov 13 straight
// after `pnpm pods:form --commit`, and again after each `--late --commit` (docs/RUNBOOK.md):
//
//   curl -X POST https://<project>.supabase.co/functions/v1/welcome-email
//
// No key is needed (verify_jwt is off in config.toml): claim_welcome_emails() marks each person welcomed as
// it picks them, so calling this twice, or by someone else, never sends anyone a second welcome. If sending
// fails, the people not yet emailed are released so the next call tries them again.
//
// Secrets: RESEND_API_KEY and NOTIFY_FROM (Resend), REPLY_TO (optional), SITE_URL for the link. Locally,
// MAILPIT_URL sends to Mailpit (config.toml).

import { createClient } from 'npm:@supabase/supabase-js@2'
import { lagosDayNumber } from '../_shared/html.ts'
import { json, sendEmails, type OutgoingEmail } from '../_shared/send-email.ts'
import { welcomeEmail } from '../_shared/welcome-email.ts'

type Claimed = {
  user_id: string
  email: string
  display_name: string
  pod_name: string
  is_facilitator: boolean
  pod_mates: string[]
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'POST only' }, 405)

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) return json({ error: 'Missing Supabase environment' }, 500)
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data, error } = await supabase.rpc('claim_welcome_emails')
  if (error) return json({ error: error.message }, 500)
  const people = (data ?? []) as Claimed[]
  if (people.length === 0) return json({ sent: 0, skipped: 'Everyone in a pod has been welcomed' }, 200)

  const site = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '')
  const day = lagosDayNumber(new Date())
  const emails: OutgoingEmail[] = people.map((person) => ({
    to: person.email,
    ...welcomeEmail({
      name: person.display_name,
      podName: person.pod_name,
      podMates: person.pod_mates,
      isFacilitator: person.is_facilitator,
      day,
      siteUrl: site,
    }),
  }))

  const sent = new Set<string>()
  // Anyone not emailed (failure, or no email service) is released for the next call.
  const releaseUnsent = async () => {
    const unsent = people.filter((person) => !sent.has(person.email)).map((person) => person.user_id)
    if (unsent.length > 0) await supabase.from('profiles').update({ welcome_sent_at: null }).in('id', unsent)
    return unsent.length
  }

  try {
    const by = await sendEmails(emails, (batch) => batch.forEach((email) => sent.add(email.to)))
    if (!by) {
      await releaseUnsent()
      return json({ sent: 0, skipped: 'No email service configured; logged instead' }, 202)
    }
    return json({ sent: sent.size, by }, 200)
  } catch (sendError) {
    const released = await releaseUnsent()
    console.error('Welcome emails: sending failed', sendError)
    return json({ sent: sent.size, released, error: String(sendError) }, 502)
  }
})
