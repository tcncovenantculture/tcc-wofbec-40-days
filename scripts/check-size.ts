// First-load size check, run after `pnpm build`. Fails if a budget is broken:
// - the landing page, where the Nov 8 QR code lands: under 100 KB in total, fonts excluded (PLAN.md 3.1)
// - the signed-in app: under 200 KB of JavaScript, gzipped (CLAUDE.md)
//
//   pnpm build && pnpm size
//
// Text files are measured as Vercel serves them to Chrome (Brotli) and with gzip, for comparison.

import { readFileSync, statSync } from 'node:fs'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

const DIST = 'dist'
const LANDING_BUDGET = 100_000
const APP_JS_BUDGET = 200_000

const read = (file: string) => readFileSync(`${DIST}/${file}`)
const brotli = (file: string) =>
  brotliCompressSync(read(file), { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length
const gzip = (file: string) => gzipSync(read(file), { level: 9 }).length
const raw = (file: string) => statSync(`${DIST}/${file}`).size

const html = read('index.html').toString()
// What the HTML loads straight away: the entry script, its modulepreloads and the stylesheet.
const htmlAssets = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.(?:js|css))"/g)].flatMap((m) =>
  m[1] ? [m[1]] : [],
)
const entry = htmlAssets.find((file) => /^assets\/index-.*\.js$/.test(file))
if (!entry) throw new Error('No entry script in dist/index.html. Run pnpm build first.')

/** A built chunk plus everything it imports statically, followed through. */
function withImports(file: string, found = new Set<string>()): Set<string> {
  if (found.has(file)) return found
  found.add(file)
  for (const match of read(file)
    .toString()
    .matchAll(/(?:from|import)\s*["'`]\.\/([^"'`]+\.js)["'`]/g)) {
    if (match[1]) withImports(`assets/${match[1]}`, found)
  }
  return found
}

// The full app is a dynamic import in the entry (see src/main.tsx). The minifier may quote with backticks.
const entryCode = read(entry).toString()
const appChunk = /import\(["'`]\.\/(App-[^"'`]+\.js)["'`]\)/.exec(entryCode)?.[1]
if (!appChunk) throw new Error('Could not find the App chunk imported by the entry script.')

// The landing page's logo (the full one, not the mark).
const logo = /["'`]\/(assets\/logo-(?!mark)[^"'`]+\.webp)["'`]/.exec(entryCode)?.[1]

const landingText = ['index.html', ...htmlAssets]
const landingImages = [...(logo ? [logo] : []), 'favicon.ico']
const landingServed =
  landingText.reduce((sum, f) => sum + brotli(f), 0) + landingImages.reduce((sum, f) => sum + raw(f), 0)
const landingGzip =
  landingText.reduce((sum, f) => sum + gzip(f), 0) + landingImages.reduce((sum, f) => sum + raw(f), 0)

const appJs = [
  ...new Set([...htmlAssets.filter((f) => f.endsWith('.js')), ...withImports(`assets/${appChunk}`)]),
]
const appGzip = appJs.reduce((sum, f) => sum + gzip(f), 0)
const appServed = appJs.reduce((sum, f) => sum + brotli(f), 0)

const kb = (bytes: number) => `${(bytes / 1000).toFixed(1)} kB`
console.log(
  `\nLanding page: ${kb(landingServed)} as served (gzip ${kb(landingGzip)}), budget ${kb(LANDING_BUDGET)}`,
)
console.log(`  ${[...landingText, ...landingImages].join(', ')}`)
console.log(`Signed-in app JS: ${kb(appGzip)} gzipped (served ${kb(appServed)}), budget ${kb(APP_JS_BUDGET)}`)
console.log(`  ${appJs.length} files\n`)

const over = [
  landingServed > LANDING_BUDGET && 'the landing page',
  appGzip > APP_JS_BUDGET && 'the signed-in app',
].filter(Boolean)
if (over.length > 0) {
  console.error(`✗ Over budget: ${over.join(' and ')}\n`)
  process.exit(1)
}
console.log('✓ Within budget\n')
