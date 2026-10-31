// Forms pods (PLAN.md 4.2). Run on Nov 13 after freezing sign-ups; docs/RUNBOOK.md has the full sequence.
//
//   pnpm -s pods:form > pods.csv                         dry run: the plan as a CSV, a summary on screen
//   pnpm -s pods:form --seed 3f9a1c2e --commit           write exactly the pods the dry run with that seed showed
//   pnpm -s pods:form --late                             after Nov 13: new sign-ups join the smallest pod in
//   pnpm -s pods:form --late --commit                    their segment (up to 6)
//   add --target staging|prod (default local); prod --commit also needs --yes
//
// Who's placed: participants (not moderators or reviewers) who have confirmed their email with a code and
// aren't in a pod yet. Each segment is shuffled with the seed, packed into pods of 5 (scripts/lib/pods.ts has
// the rules), a facilitator is picked at random in each pod, and each pod gets a unique name. Segments too
// small for a pod are listed for placing by hand. --commit writes everything in one transaction (the
// form_pods SQL function), so a failure writes nothing.
//
// The CSV goes to standard output and the summary to standard error, so `> pods.csv` keeps only the CSV
// (-s stops pnpm adding its own lines).

import { randomBytes } from 'node:crypto'
import { parseArgs } from 'node:util'
import { adminClient, fail, parseTarget } from './lib/target.ts'
import { csvLine, planLate, planPods, type ExistingPod, type Person } from './lib/pods.ts'

const { values: flags } = parseArgs({
  options: {
    target: { type: 'string', default: 'local' },
    seed: { type: 'string' },
    commit: { type: 'boolean', default: false },
    late: { type: 'boolean', default: false },
    yes: { type: 'boolean', default: false },
  },
})

const target = parseTarget(flags.target)
if (target === 'prod' && flags.commit && !flags.yes) {
  fail('Writing pods to prod changes who sees whose messages. Run the dry run first, then add --yes.')
}
const seed = flags.seed ?? randomBytes(4).toString('hex')
const { url, supabase } = adminClient(target)
const host = new URL(url).host
const say = (line = '') => console.error(line)

// Everyone who has confirmed their email (accounts are made when the first code is sent, before it's used).
async function confirmedUserIds(): Promise<Set<string>> {
  const ids = new Set<string>()
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) fail(error.message)
    for (const user of data.users) if (user.email_confirmed_at) ids.add(user.id)
    if (data.users.length < 1000) return ids
  }
}

// PostgREST returns at most 1,000 rows a request, so read in pages.
async function allRows<T>(
  read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await read(from, from + 999)
    if (error) fail(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) return rows
  }
}

const [confirmed, profiles, members, pods] = await Promise.all([
  confirmedUserIds(),
  allRows((from, to) =>
    supabase
      .from('profiles')
      .select('id, display_name, email, segment')
      .eq('role', 'participant')
      .order('id')
      .range(from, to),
  ),
  allRows((from, to) =>
    supabase.from('pod_members').select('pod_id, user_id').order('user_id').range(from, to),
  ),
  allRows((from, to) => supabase.from('pods').select('id, name, segment').order('name').range(from, to)),
])

const inPod = new Set(members.map((m) => m.user_id))
const people: Person[] = profiles
  .filter((p) => confirmed.has(p.id) && !inPod.has(p.id))
  .map((p) => ({ id: p.id, displayName: p.display_name, email: p.email, segment: p.segment }))
const unconfirmed = profiles.filter((p) => !confirmed.has(p.id) && !inPod.has(p.id)).length

say(`\nPods on ${target} (${host}), seed ${seed}`)
say(
  `${people.length} participants to place${unconfirmed ? ` (${unconfirmed} never confirmed their email: left out)` : ''}`,
)

const header = ['pod', 'segment', 'name', 'email', 'facilitator']
const manual = '(place by hand)'

if (flags.late) {
  const sizes = new Map<string, number>()
  for (const m of members) sizes.set(m.pod_id, (sizes.get(m.pod_id) ?? 0) + 1)
  const existing: ExistingPod[] = pods.map((p) => ({ ...p, size: sizes.get(p.id) ?? 0 }))
  const plan = planLate(people, existing, seed)

  console.log(csvLine(header))
  for (const { pod, person } of plan.joins) {
    console.log(csvLine([pod.name, pod.segment, person.displayName, person.email, 'no']))
  }
  for (const person of plan.unplaced) {
    console.log(csvLine([manual, person.segment, person.displayName, person.email, 'no']))
  }

  say(
    `${plan.joins.length} join existing pods; ${plan.unplaced.length} need placing by hand (no pod in their segment has room)`,
  )
  for (const person of plan.unplaced) say(`  · ${person.displayName} <${person.email}> (${person.segment})`)

  if (!flags.commit) {
    say(`\nDry run: nothing written. To write these, run again with --late --commit --seed ${seed}\n`)
    process.exit(0)
  }
  const { error } = await supabase.rpc('form_pods', {
    new_pods: [],
    joiners: plan.joins.map(({ pod, person }) => ({ pod_id: pod.id, user_id: person.id })),
  })
  if (error) fail(`Nothing was written: ${error.message}`)
  say(`\n✓ Added ${plan.joins.length} late sign-ups to their pods on ${target}.\n`)
  process.exit(0)
}

if (pods.length > 0) {
  say(`Note: ${pods.length} pods already exist. For sign-ups after pods are formed, use --late.`)
}

const plan = planPods(
  people,
  seed,
  pods.map((p) => p.name),
)

console.log(csvLine(header))
for (const pod of plan.pods) {
  for (const member of pod.members) {
    console.log(
      csvLine([
        pod.name,
        pod.segment,
        member.displayName,
        member.email,
        member === pod.facilitator ? 'yes' : 'no',
      ]),
    )
  }
}
for (const person of plan.unplaced) {
  console.log(csvLine([manual, person.segment, person.displayName, person.email, 'no']))
}

for (const segment of [...new Set(plan.pods.map((pod) => pod.segment))]) {
  const segmentPods = plan.pods.filter((pod) => pod.segment === segment)
  const sizes = segmentPods.map((pod) => pod.members.length).join(', ')
  say(`  ${segment}: ${segmentPods.length} pods (${sizes})`)
}
say(`${plan.pods.length} pods in all`)
if (plan.unplaced.length > 0) {
  say(`${plan.unplaced.length} to place by hand (segments too small for a pod, or one left over from 7):`)
  for (const person of plan.unplaced) say(`  · ${person.displayName} <${person.email}> (${person.segment})`)
}

if (!flags.commit) {
  say(`\nDry run: nothing written. To write exactly these pods, run again with --commit --seed ${seed}`)
  say('(Only while sign-ups are frozen: anyone new changes the plan.)\n')
  process.exit(0)
}

const { error } = await supabase.rpc('form_pods', {
  new_pods: plan.pods.map((pod) => ({
    name: pod.name,
    segment: pod.segment,
    facilitator: pod.facilitator.id,
    members: pod.members.map((m) => m.id),
  })),
  joiners: [],
})
if (error) fail(`Nothing was written: ${error.message}`)
say(`\n✓ Wrote ${plan.pods.length} pods on ${target}. Next: send the welcome email (docs/RUNBOOK.md).\n`)
