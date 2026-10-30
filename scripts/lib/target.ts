// Shared by the content scripts: which Supabase project to talk to, and its service role client.
// The service role key is only ever used here in scripts/, never in src/.

import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '../../src/lib/database.types.ts'

export const targets = ['local', 'staging', 'prod'] as const
export type Target = (typeof targets)[number]

export function fail(message: string): never {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

export function parseTarget(value: string | undefined): Target {
  const target = targets.find((t) => t === value)
  if (!target) fail(`--target must be one of ${targets.join(', ')}`)
  return target
}

/** URL and service role key: local reads `supabase status`; staging and prod read `.env.<target>`. */
export function credentials(target: Target): { url: string; key: string } {
  if (target === 'local') {
    // Local keys are the CLI's fixed development keys.
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

export function adminClient(target: Target) {
  const { url, key } = credentials(target)
  return { url, supabase: createClient<Database>(url, key, { auth: { persistSession: false } }) }
}
