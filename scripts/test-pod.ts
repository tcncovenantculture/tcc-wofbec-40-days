// Puts named people into one pod on local or staging, so the pod screen can be tried before real pods are
// formed on Nov 13 (pnpm pods:form, Phase 4). Everyone must have signed up on that target first.
//
//   pnpm pods:test --target staging --name "Leaders" first@example.com second@example.com ...
//   pnpm pods:test --target staging --list
//   pnpm pods:test --target staging --remove "Leaders"
//
// The first email is the facilitator. Anyone already in a pod is moved. A pod of one is allowed, as the
// "other pod" when checking that pods can't see each other. Refused for prod.

import { parseArgs } from 'node:util'
import { adminClient, fail, parseTarget } from './lib/target.ts'

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    target: { type: 'string', default: 'local' },
    name: { type: 'string' },
    list: { type: 'boolean', default: false },
    remove: { type: 'string' },
  },
})

const target = parseTarget(flags.target)
if (target === 'prod') fail('Test pods are for local and staging only. Real pods come from pnpm pods:form.')
const { url, supabase } = adminClient(target)
const host = new URL(url).host

if (flags.list) {
  const { data, error } = await supabase
    .from('pods')
    .select('name, segment, whatsapp_invite_link, pod_members(is_facilitator, profiles(display_name, email))')
    .order('name')
  if (error) fail(error.message)
  if (data.length === 0) console.log(`\nNo pods on ${target} (${host}).\n`)
  for (const pod of data) {
    console.log(`\n${pod.name} (${pod.segment})${pod.whatsapp_invite_link ? ' · WhatsApp linked' : ''}`)
    for (const member of pod.pod_members) {
      const person = member.profiles
      console.log(
        `  ${member.is_facilitator ? '★' : '·'} ${person?.display_name ?? '?'} <${person?.email ?? '?'}>`,
      )
    }
  }
  console.log('')
  process.exit(0)
}

if (flags.remove) {
  const { data, error } = await supabase.from('pods').delete().eq('name', flags.remove).select('id')
  if (error) fail(error.message)
  if (data.length === 0) fail(`No pod called "${flags.remove}" on ${target}.`)
  console.log(`\n✓ Removed the pod "${flags.remove}" and its messages from ${target} (${host}).\n`)
  process.exit(0)
}

const name = flags.name?.trim()
const emails = positionals.map((email) => email.trim().toLowerCase())
if (!name || emails.length === 0) {
  fail('Pass --name and one or more emails; the first is the facilitator. Or use --list or --remove.')
}

const { data: people, error: lookupError } = await supabase
  .from('profiles')
  .select('id, email, display_name, segment')
  .in('email', emails)
if (lookupError) fail(lookupError.message)
const missing = emails.filter((email) => !people.some((person) => person.email === email))
if (missing.length > 0) fail(`No account for ${missing.join(', ')}. Sign up on ${target} first.`)

const facilitator = people.find((person) => person.email === emails[0])
if (!facilitator) fail('Could not find the facilitator.')

const { data: pod, error: podError } = await supabase
  .from('pods')
  .insert({ name, segment: facilitator.segment })
  .select('id')
  .single()
if (podError) {
  fail(
    podError.code === '23505'
      ? `There's already a pod called "${name}". Pick another name.`
      : podError.message,
  )
}

const ids = people.map((person) => person.id)
const { error: moveError } = await supabase.from('pod_members').delete().in('user_id', ids)
if (moveError) fail(moveError.message)
const { error: joinError } = await supabase.from('pod_members').insert(
  people.map((person) => ({
    pod_id: pod.id,
    user_id: person.id,
    is_facilitator: person.id === facilitator.id,
  })),
)
if (joinError) fail(joinError.message)

console.log(`\n✓ Pod "${name}" on ${target} (${host}):`)
for (const email of emails) {
  const person = people.find((p) => p.email === email)
  console.log(`  ${person?.id === facilitator.id ? '★ facilitator' : '·'} ${person?.display_name} <${email}>`)
}
console.log('')
