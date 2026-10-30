// Compresses a module file's media and uploads it to the Storage bucket `media`.
//
//   pnpm media:compress content/module-1.json                    # local Supabase
//   pnpm media:compress content/module-1.json --target staging
//   pnpm media:compress content/module-1.json --dry-run          # show what would happen; change nothing
//
// Put source files under content/media/ and point at them from the module file, e.g.
// "url": "media/module-1/day-3.jpg". For each image or audio file this:
//   - images: resizes to at most 1200px wide as WebP, lowering quality until it's 150 KB or less
//   - audio: re-encodes to 64 kbps mono MP3 (needs ffmpeg: brew install ffmpeg)
//   - writes the result next to the source, named with a hash of its contents (day-3-1a2b3c4d.webp), so it
//     can be cached for a year and a replaced file never shows stale
//   - uploads it and rewrites the url in the module file to the bucket path ("media/module-1/day-3-….webp")
//
// The app turns a bucket path into the right URL for each environment, so one module file works for
// local, staging and prod: run this once per target. Files already named with a hash are uploaded as they
// are. Videos are YouTube links and are left alone.

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { parseArgs } from 'node:util'
import sharp from 'sharp'
import { PROCESSED_MEDIA, readModuleFile } from './lib/module-file.ts'
import { adminClient, fail, parseTarget } from './lib/target.ts'

const MAX_WIDTH = 1200
const TARGET_BYTES = 150_000
const QUALITIES = [80, 72, 64, 56, 48, 40]
const BUCKET = 'media'

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    target: { type: 'string', default: 'local' },
    'dry-run': { type: 'boolean', default: false },
  },
})

const file = positionals[0]
if (!file) fail('Pass a module file, e.g. pnpm media:compress content/module-1.json')
const target = parseTarget(flags.target)
const contentDir = path.dirname(file)

// Validate first. Rewrite the raw JSON afterwards so nothing else in the file changes.
const { raw } = readModuleFile(file)
type RawMedia = { type: string; url: string }
const days = (raw as { days: { day_number: number; media?: RawMedia[] }[] }).days

const kb = (bytes: number) => `${Math.round(bytes / 1000)} KB`
const shortHash = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex').slice(0, 8)

async function compressImage(source: string): Promise<{ buffer: Buffer; note: string }> {
  // rotate() applies the camera's orientation; sharp drops EXIF (including GPS) by default.
  const resized = sharp(source, { failOn: 'error' })
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
  let buffer = Buffer.alloc(0)
  let quality = 0
  for (quality of QUALITIES) {
    buffer = await resized.clone().webp({ quality, effort: 5 }).toBuffer()
    if (buffer.length <= TARGET_BYTES) break
  }
  const over = buffer.length > TARGET_BYTES ? `, still over ${kb(TARGET_BYTES)}` : ''
  return { buffer, note: `WebP q${quality}${over}` }
}

function compressAudio(source: string): { buffer: Buffer; note: string } {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
  } catch {
    fail('Audio needs ffmpeg. Install it (brew install ffmpeg) and run again.')
  }
  const dir = mkdtempSync(path.join(tmpdir(), 'c40-audio-'))
  const out = path.join(dir, 'out.mp3')
  try {
    execFileSync('ffmpeg', [
      '-v',
      'error',
      '-y',
      '-i',
      source,
      '-ac',
      '1',
      '-b:a',
      '64k',
      '-codec:a',
      'libmp3lame',
      out,
    ])
    return { buffer: readFileSync(out), note: 'MP3 64 kbps mono' }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const admin = flags['dry-run'] ? null : adminClient(target)
const summary: Record<string, string | number>[] = []
let changed = false

for (const day of days) {
  for (const item of day.media ?? []) {
    if (item.type === 'video' || /^https?:\/\//.test(item.url)) continue
    if (!item.url.startsWith(`${BUCKET}/`)) {
      fail(`Day ${day.day_number}: media files go under content/media/ (url "media/…"), not "${item.url}"`)
    }
    const source = path.join(contentDir, item.url)
    if (!existsSync(source)) fail(`Day ${day.day_number}: can't find ${source}`)

    let buffer: Buffer
    let note: string
    let url = item.url
    if (PROCESSED_MEDIA.test(item.url)) {
      buffer = readFileSync(source)
      note = 'already compressed'
    } else {
      const result = item.type === 'image' ? await compressImage(source) : compressAudio(source)
      buffer = result.buffer
      note = result.note
      const ext = item.type === 'image' ? 'webp' : 'mp3'
      const base = path.basename(item.url, path.extname(item.url))
      url = path.posix.join(path.posix.dirname(item.url), `${base}-${shortHash(buffer)}.${ext}`)
      if (!flags['dry-run']) writeFileSync(path.join(contentDir, url), buffer)
    }

    if (admin) {
      const { error } = await admin.supabase.storage
        .from(BUCKET)
        .upload(url.slice(BUCKET.length + 1), buffer, {
          contentType: item.type === 'image' ? 'image/webp' : 'audio/mpeg',
          cacheControl: '31536000',
          upsert: true,
        })
      if (error) fail(`Day ${day.day_number}: upload of ${url} failed: ${error.message}`)
    }

    if (url !== item.url && !flags['dry-run']) {
      item.url = url
      changed = true
    }
    summary.push({
      day: day.day_number,
      type: item.type,
      before: kb(readFileSync(source).length),
      after: kb(buffer.length),
      note,
      url,
    })
  }
}

if (summary.length === 0) {
  console.log('\nNo local media in this file. Nothing to do.\n')
  process.exit(0)
}

console.table(summary)
if (changed) writeFileSync(file, `${JSON.stringify(raw, null, 2)}\n`)
console.log(
  flags['dry-run']
    ? `✓ Dry run: ${summary.length} file(s) would be uploaded. Nothing written or uploaded.\n`
    : `✓ Uploaded ${summary.length} file(s) to ${target}${changed ? ' and updated the module file' : ''}.\n`,
)
