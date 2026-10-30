import { describe, expect, it } from 'vitest'
import { moduleFileSchema, youtubeId, type ModuleFile } from './schema'

function day(dayNumber: number, kind: string, extra: Record<string, unknown> = {}) {
  return {
    day_number: dayNumber,
    kind,
    title: `Day ${dayNumber}`,
    introduction: 'Intro',
    scripture_ref: 'Acts 1:3',
    scripture_text: 'Text',
    scripture_url: null,
    body_md: 'Body',
    media: [],
    reflection_prompts: ['Prompt'],
    practical_action: 'Act',
    action_dimension: 'character',
    pod_prompt: 'Pod?',
    est_minutes: 12,
    status: 'draft',
    ...extra,
  }
}

function moduleFile(moduleNumber = 2): Record<string, unknown> & { days: Record<string, unknown>[] } {
  const first = (moduleNumber - 1) * 8 + 1
  return {
    module_number: moduleNumber,
    module_title: 'Module',
    days: Array.from({ length: 8 }, (_, i) =>
      day(first + i, i === 0 ? 'intro' : i === 7 ? 'synthesis' : 'developmental'),
    ),
  }
}

function issues(input: unknown): string[] {
  const result = moduleFileSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
}

function withDay(index: number, changes: Record<string, unknown>) {
  const file = moduleFile()
  file.days[index] = { ...file.days[index], ...changes }
  return file
}

describe('moduleFileSchema', () => {
  it('accepts a complete module', () => {
    const parsed: ModuleFile = moduleFileSchema.parse(moduleFile())
    expect(parsed.days.map((d) => d.day_number)).toEqual([9, 10, 11, 12, 13, 14, 15, 16])
  })

  it('needs all eight days', () => {
    const file = moduleFile()
    file.days = file.days.slice(0, 7)
    expect(issues(file)).toEqual(['days: A module file needs all eight days, in order'])
  })

  it('needs day numbers that match the module, in order', () => {
    const file = moduleFile()
    file.days = [file.days[1], file.days[0], ...file.days.slice(2)].map((d, i) => ({
      ...d,
      kind: i === 0 ? 'intro' : i === 7 ? 'synthesis' : 'developmental',
    }))
    expect(issues(file)).toEqual([
      'days.0.day_number: Day 1 of module 2 should be day_number 9, not 10',
      'days.1.day_number: Day 2 of module 2 should be day_number 10, not 9',
    ])
  })

  it('needs intro first, synthesis eighth and developmental between', () => {
    expect(issues(withDay(0, { kind: 'developmental' }))).toEqual([
      'days.0.kind: Day 1 of a module is "intro", not "developmental"',
    ])
    expect(issues(withDay(7, { kind: 'developmental' }))).toEqual([
      'days.7.kind: Day 8 of a module is "synthesis", not "developmental"',
    ])
    expect(issues(withDay(3, { kind: 'synthesis' }))).toEqual([
      'days.3.kind: Day 4 of a module is "developmental", not "synthesis"',
    ])
  })

  it('needs one to three reflection prompts', () => {
    expect(issues(withDay(1, { reflection_prompts: [] }))).toEqual([
      'days.1.reflection_prompts: Add at least one reflection prompt',
    ])
    expect(issues(withDay(1, { reflection_prompts: ['a', 'b', 'c', 'd'] }))).toEqual([
      'days.1.reflection_prompts: Keep it to three reflection prompts or fewer',
    ])
  })

  it('keeps est_minutes between 5 and 20', () => {
    expect(issues(withDay(1, { est_minutes: 4 }))).toEqual(['days.1.est_minutes: At least 5 minutes'])
    expect(issues(withDay(1, { est_minutes: 21 }))).toEqual(['days.1.est_minutes: At most 20 minutes'])
  })

  it('needs a transcript on every video', () => {
    const video = { type: 'video', url: 'https://youtu.be/dQw4w9WgXcQ', caption: 'Clip', ai_generated: false }
    expect(issues(withDay(1, { media: [video] }))).toEqual([
      'days.1.media.0.transcript: Invalid input: expected string, received undefined',
    ])
    expect(issues(withDay(1, { media: [{ ...video, transcript: '  ' }] }))).toEqual([
      "days.1.media.0.transcript: Every video needs a transcript, and it can't be empty",
    ])
  })

  it('needs alt text on every image', () => {
    expect(
      issues(withDay(1, { media: [{ type: 'image', url: 'a.webp', alt: '', ai_generated: false }] })),
    ).toEqual(["days.1.media.0.alt: Every image needs alt text, and it can't be empty"])
  })

  it('needs ai_generated on every media item', () => {
    expect(issues(withDay(1, { media: [{ type: 'image', url: 'a.webp', alt: 'A tree' }] }))).toEqual([
      'days.1.media.0.ai_generated: Say whether this is AI-generated: "ai_generated": true or false',
    ])
  })

  it('needs a transcript on audio too', () => {
    expect(
      issues(withDay(1, { media: [{ type: 'audio', url: 'a.mp3', ai_generated: false }] })),
    ).toHaveLength(1)
  })

  it('only takes YouTube links for video', () => {
    const video = {
      type: 'video',
      url: 'https://vimeo.com/1',
      caption: 'C',
      transcript: 'T',
      ai_generated: false,
    }
    expect(issues(withDay(1, { media: [video] }))).toEqual([
      'days.1.media.0.url: Videos are YouTube links (unlisted is fine)',
    ])
  })

  it('rejects misspelled fields', () => {
    expect(issues(withDay(1, { reflection_prompt: ['typo'] }))[0]).toMatch(
      /Unrecognized key: "reflection_prompt"/,
    )
  })
})

describe('youtubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=10', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=VIDEO_ID', null],
    ['https://vimeo.com/123', null],
    ['not a url', null],
  ])('%s', (url, expected) => {
    expect(youtubeId(url)).toBe(expected)
  })
})
