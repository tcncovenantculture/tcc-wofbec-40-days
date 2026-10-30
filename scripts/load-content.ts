// Loads a curriculum module file into the days table.
//
//   pnpm content:load content/module-1.json                    # local Supabase
//   pnpm content:load content/module-1.json --target staging   # needs .env.staging
//   pnpm content:load content/module-1.json --target prod --yes
//   pnpm content:load content/module-1.json --dry-run          # validate only
//   pnpm content:load content/samples/module-1.json --target staging --publish-now
//
// Validates the file, fills publish_at from the day number (unless the file gives one), upserts by
// day_number and prints a summary. --publish-now sets every day's publish_at to now, so testers can open
// days early with ?asOf; it's refused for prod. Uses the service role key, so it only ever runs here.
// Run pnpm media:compress first if the file has local media.

import { parseArgs } from 'node:util'
import type { TablesInsert } from '../src/lib/database.types.ts'
import { publishAtFor, TIME_ZONE } from '../src/lib/programme.ts'
import { needsCompressing, readModuleFile } from './lib/module-file.ts'
import { adminClient, fail, parseTarget } from './lib/target.ts'

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    target: { type: 'string', default: 'local' },
    'dry-run': { type: 'boolean', default: false },
    'publish-now': { type: 'boolean', default: false },
    yes: { type: 'boolean', default: false },
  },
})

const file = positionals[0]
if (!file) fail('Pass a module file, e.g. pnpm content:load content/module-1.json')

const target = parseTarget(flags.target)
if (target === 'prod' && flags['publish-now']) fail('--publish-now is for testing and is refused for prod')

const { module } = readModuleFile(file)

const unprocessed = module.days.flatMap((day) => day.media.filter(needsCompressing))
if (unprocessed.length > 0) {
  fail(`Some media hasn't been uploaded yet (${unprocessed[0]?.url}). Run pnpm media:compress ${file} first.`)
}

const now = new Date().toISOString()
const rows: TablesInsert<'days'>[] = module.days.map((day) => ({
  ...day,
  module_number: module.module_number,
  scripture_text: day.scripture_text ?? null,
  scripture_url: day.scripture_url ?? null,
  publish_at: flags['publish-now'] ? now : (day.publish_at ?? publishAtFor(day.day_number).toISOString()),
}))

const lagos = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  dateStyle: 'medium',
  timeStyle: 'short',
})

console.log(
  `\nModule ${module.module_number}: ${module.module_title}  →  ${target}${flags['dry-run'] ? ' (dry run)' : ''}`,
)
console.table(
  rows.map((row) => ({
    day: row.day_number,
    kind: row.kind,
    status: row.status,
    'unlocks (Lagos)': lagos.format(new Date(row.publish_at)),
    minutes: row.est_minutes,
    media: Array.isArray(row.media) ? row.media.length : 0,
    title: row.title.length > 40 ? `${row.title.slice(0, 39)}…` : row.title,
  })),
)

if (flags['dry-run']) {
  console.log('✓ Valid. Nothing written (dry run).\n')
  process.exit(0)
}

if (target === 'prod' && !flags.yes)
  fail('Loading to prod writes live content. Run again with --yes to confirm.')

const { url, supabase } = adminClient(target)
const { data, error } = await supabase
  .from('days')
  .upsert(rows, { onConflict: 'day_number' })
  .select('day_number')
if (error) fail(`Upload failed: ${error.message}`)

console.log(`✓ Loaded ${data.length} days into ${target} (${new URL(url).host}).\n`)
