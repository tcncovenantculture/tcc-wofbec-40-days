import { readFileSync } from 'node:fs'
import { moduleFileSchema, type ModuleFile } from '../../src/features/days/schema.ts'
import { fail } from './target.ts'

/** Reads and validates a module file, or exits with a plain list of what's wrong. */
export function readModuleFile(file: string): { module: ModuleFile; raw: unknown } {
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    fail(`Couldn't read ${file}: ${error instanceof Error ? error.message : String(error)}`)
  }
  const result = moduleFileSchema.safeParse(raw)
  if (result.success) return { module: result.data, raw }

  const lines = result.error.issues.map((issue) => {
    const message =
      issue.code === 'invalid_type' && issue.message.endsWith('received undefined')
        ? 'is missing'
        : issue.message
    return `  • ${issue.path.join('.') || '(file)'}: ${message}`
  })
  // Order checks (day numbers, kinds) only run once every day has the right fields, so fixing these can
  // reveal more on the next run.
  fail(`${file} has ${result.error.issues.length} problem(s):\n${lines.join('\n')}`)
}

export type { ModuleFile }

/** A media file compress-media has already processed: named with a hash of its contents. */
export const PROCESSED_MEDIA = /-[0-9a-f]{8}\.(webp|mp3)$/

/** True when an image or audio item still points at an unprocessed local file. */
export function needsCompressing(item: { type: string; url: string }): boolean {
  return item.type !== 'video' && !/^https?:\/\//.test(item.url) && !PROCESSED_MEDIA.test(item.url)
}
