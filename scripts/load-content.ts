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

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { moduleFileSchema, type ModuleFile } from '../src/features/days/schema.ts'
import type { TablesInsert, Database } from '../src/lib/database.types.ts'
import { publishAtFor, TIME_ZONE } from '../src/lib/programme.ts'

const targets = ['local', 'staging', 'prod'] as const
type Target = (typeof targets)[number]

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    target: { type: 'string', default: 'local' },
    'dry-run': { type: 'boolean', default: false },
    'publish-now': { type: 'boolean', default: false },
    yes: { type: 'boolean', default: false },
  },
})

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

const file = positionals[0]
if (!file) fail('Pass a module file, e.g. pnpm content:load content/module-1.json')

const target = flags.target as Target
if (!targets.includes(target)) fail(`--target must be one of ${targets.join(', ')}`)
if (target === 'prod' && flags['publish-now']) fail('--publish-now is for testing and is refused for prod')

// Validate --------------------------------------------------------------------------------------------

let module: ModuleFile
try {
  module = moduleFileSchema.parse(JSON.parse(readFileSync(file, 'utf8')))
} catch (error) {
  if (error instanceof z.ZodError) {
    const lines = error.issues.map((issue) => {
      const message =
        issue.code === 'invalid_type' && issue.message.endsWith('received undefined')
          ? 'is missing'
          : issue.message
      return `  • ${issue.path.join('.') || '(file)'}: ${message}`
    })
    // Order checks (day numbers, kinds) only run once every day has the right fields, so fixing these
    // can reveal more on the next run.
    fail(`${file} has ${error.issues.length} problem(s):\n${lines.join('\n')}`)
  }
  fail(`Couldn't read ${file}: ${error instanceof Error ? error.message : String(error)}`)
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

// Connect ---------------------------------------------------------------------------------------------

function credentials(target: Target): { url: string; key: string } {
  if (target === 'local') {
    // Local keys are the CLI's fixed development keys: read them from `supabase status`.
    const status = z
      .object({ API_URL: z.string(), SECRET_KEY: z.string() })
      .parse(
        JSON.parse(execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { encoding: 'utf8' })),
      )
    return { url: status.API_URL, key: status.SECRET_KEY }
  }
  try {
    process.loadEnvFile(`.env.${target}`)
  } catch {
    fail(`Missing .env.${target}. It needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`)
  }
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) fail(`.env.${target} needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY`)
  return { url, key }
}

const { url, key } = credentials(target)
const supabase = createClient<Database>(url, key, { auth: { persistSession: false } })

const { data, error } = await supabase
  .from('days')
  .upsert(rows, { onConflict: 'day_number' })
  .select('day_number')
if (error) fail(`Upload failed: ${error.message}`)

console.log(`✓ Loaded ${data.length} days into ${target} (${new URL(url).host}).\n`)
