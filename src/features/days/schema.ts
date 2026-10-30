import { z } from 'zod'
import { Constants } from '../../lib/database.types.ts'
import { DAYS_PER_MODULE } from '../../lib/programme.ts'
import { youtubeId } from './youtube.ts'

export { youtubeId }

// The content file format (content/module-N.json), shared by scripts/load-content.ts and the app.
// Imports here are relative with .ts extensions so Node can run the loader without a bundler.

const text = (what: string) => z.string().trim().min(1, `${what} can't be empty`)

const aiGenerated = z.boolean({ error: 'Say whether this is AI-generated: "ai_generated": true or false' })

export const imageSchema = z.strictObject({
  type: z.literal('image'),
  url: text('Image url'),
  alt: text('Every image needs alt text, and it'),
  ai_generated: aiGenerated,
})

export const audioSchema = z.strictObject({
  type: z.literal('audio'),
  url: text('Audio url'),
  caption: text('Caption').optional(),
  // Text-only mode shows the transcript instead of the audio, and it's there for people who can't hear it.
  transcript: text('Every audio clip needs a transcript, and it'),
  ai_generated: aiGenerated,
})

export const videoSchema = z.strictObject({
  type: z.literal('video'),
  url: z.string().refine((url) => youtubeId(url) !== null, 'Videos are YouTube links (unlisted is fine)'),
  caption: text('Video caption'),
  transcript: text('Every video needs a transcript, and it'),
  ai_generated: aiGenerated,
})

export const mediaSchema = z.discriminatedUnion('type', [imageSchema, audioSchema, videoSchema])
export const mediaListSchema = z.array(mediaSchema)

export type Media = z.infer<typeof mediaSchema>

export const dayContentSchema = z.strictObject({
  day_number: z.number().int().min(1).max(40),
  kind: z.enum(Constants.public.Enums.day_kind),
  title: text('Title'),
  introduction: text('Introduction'),
  scripture_ref: text('Scripture reference'),
  scripture_text: text('Scripture text').nullish(),
  scripture_url: z.url().nullish(),
  body_md: text('Body'),
  media: mediaListSchema.default([]),
  reflection_prompts: z
    .array(text('A reflection prompt'))
    .min(1, 'Add at least one reflection prompt')
    .max(3, 'Keep it to three reflection prompts or fewer'),
  practical_action: text('Practical action'),
  action_dimension: z.enum(Constants.public.Enums.dimension),
  pod_prompt: text('Pod prompt'),
  est_minutes: z.number().int().min(5, 'At least 5 minutes').max(20, 'At most 20 minutes'),
  status: z.enum(['draft', 'published']),
  // Usually left out: the loader works it out from the day number.
  publish_at: z.iso.datetime({ offset: true }).optional(),
})

export type DayContent = z.infer<typeof dayContentSchema>

/** What kind of day the nth day of a module (1 to 8) must be. */
export function expectedKind(positionInModule: number): DayContent['kind'] {
  if (positionInModule === 1) return 'intro'
  if (positionInModule === DAYS_PER_MODULE) return 'synthesis'
  return 'developmental'
}

export const moduleFileSchema = z
  .strictObject({
    module_number: z.number().int().min(1).max(5),
    module_title: text('Module title'),
    days: z.array(dayContentSchema).length(DAYS_PER_MODULE, 'A module file needs all eight days, in order'),
  })
  .superRefine((module, ctx) => {
    const firstDay = (module.module_number - 1) * DAYS_PER_MODULE + 1
    module.days.forEach((day, index) => {
      const position = index + 1
      const expectedDay = firstDay + index
      if (day.day_number !== expectedDay) {
        ctx.addIssue({
          code: 'custom',
          path: ['days', index, 'day_number'],
          message: `Day ${position} of module ${module.module_number} should be day_number ${expectedDay}, not ${day.day_number}`,
        })
      }
      const kind = expectedKind(position)
      if (day.kind !== kind) {
        ctx.addIssue({
          code: 'custom',
          path: ['days', index, 'kind'],
          message: `Day ${position} of a module is "${kind}", not "${day.kind}"`,
        })
      }
    })
  })

export type ModuleFile = z.infer<typeof moduleFileSchema>
