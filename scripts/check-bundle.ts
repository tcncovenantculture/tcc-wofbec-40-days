// Checks the built app for secrets, run after `pnpm build` (PLAN.md Phase 5, security pass). The service
// role key and email keys must never reach the browser (CLAUDE.md rule 4).
//
//   pnpm build && pnpm check:bundle

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'

// What a leaked secret looks like in built code.
const patterns: { name: string; pattern: RegExp }[] = [
  { name: 'a Supabase secret key', pattern: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  // "role":"service_role" inside a legacy JWT's payload, base64-encoded at any of its three alignments.
  {
    name: 'a service role JWT',
    pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*(c2VydmljZV9yb2xl|NlcnZpY2Vfcm9sZ|zZXJ2aWNlX3JvbG)/,
  },
  { name: 'a Resend API key', pattern: /\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}/ },
  { name: 'a service role variable name', pattern: /SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY/ },
  { name: 'a database password variable', pattern: /SUPABASE_DB_PASSWORD/ },
]

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

let all: string[]
try {
  all = files(DIST).filter((file) => /\.(js|html|css|json|webmanifest|txt|map)$/.test(file))
} catch {
  console.error(`\n✗ No ${DIST}/ folder. Run pnpm build first.\n`)
  process.exit(1)
}

const found: string[] = []
for (const file of all) {
  const text = readFileSync(file, 'utf8')
  for (const { name, pattern } of patterns) {
    if (pattern.test(text)) found.push(`${file}: looks like ${name}`)
  }
}

if (found.length > 0) {
  console.error(`\n✗ Possible secrets in the build:\n  ${found.join('\n  ')}\n`)
  process.exit(1)
}
console.log(`\n✓ No secrets in ${all.length} built files\n`)
