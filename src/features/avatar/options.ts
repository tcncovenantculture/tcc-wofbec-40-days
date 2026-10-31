import type { ModuleNumber } from '@/theme/tokens'

// What someone picks in the avatar builder, stored as profiles.avatar (jsonb). The style is DiceBear's
// "Big Smile" (design by Ashley Seo, CC BY 4.0; credited on /privacy). Chosen for its range: eight skin
// tones from light to deep brown, and hair that includes braids, a fro bun and curly cuts.
//
// Only a friendly subset of the style is offered: no sad or angry faces, and no joke accessories (clown
// nose, sleep mask, the cartoon crown). The background is one of the five module accents, stored as the
// module number so its colour always comes from the theme tokens.

export const skinTones = [
  'ffe4c0',
  'f5d7b1',
  'efcc9f',
  'e2ba87',
  'c99c62',
  'a47539',
  '8c5a2b',
  '643d19',
] as const

export const hairStyles = [
  'shortHair',
  'curlyShortHair',
  'shavedHead',
  'halfShavedHead',
  'mohawk',
  'froBun',
  'braids',
  'curlyBob',
  'wavyBob',
  'bunHair',
  'straightHair',
  'bangs',
  'bowlCutHair',
] as const

// The style's natural hair colours: black, dark brown, brown and blonde.
export const hairColours = ['220f00', '3a1a00', '71472d', 'e2ba87'] as const

export const accessories = ['none', 'glasses', 'sunglasses', 'mustache'] as const

export const eyeStyles = ['cheery', 'normal', 'winking'] as const
export const mouthStyles = ['openedSmile', 'teethSmile', 'gapSmile', 'kawaii'] as const

export const backgrounds = [1, 2, 3, 4, 5] as const satisfies readonly ModuleNumber[]

export type AvatarChoice = {
  /** Shape version, in case the options change after launch */
  v: 1
  skin: (typeof skinTones)[number]
  hair: (typeof hairStyles)[number]
  hairColour: (typeof hairColours)[number]
  accessory: (typeof accessories)[number]
  eyes: (typeof eyeStyles)[number]
  mouth: (typeof mouthStyles)[number]
  background: ModuleNumber
}

/** The parts the builder lets people pick, each with its options. */
export const builderRows = [
  { key: 'skin', label: 'Skin', options: skinTones },
  { key: 'hair', label: 'Hair', options: hairStyles },
  { key: 'hairColour', label: 'Hair colour', options: hairColours },
  { key: 'accessory', label: 'Extras', options: accessories },
  { key: 'background', label: 'Background', options: backgrounds },
] as const

function oneOf<T>(options: readonly T[], value: unknown): value is T {
  return options.includes(value as T)
}

/** A stored avatar, or null if it's missing or doesn't match the current options. */
export function parseAvatar(value: unknown): AvatarChoice | null {
  if (typeof value !== 'object' || value === null) return null
  const a = value as Record<string, unknown>
  if (
    a.v === 1 &&
    oneOf(skinTones, a.skin) &&
    oneOf(hairStyles, a.hair) &&
    oneOf(hairColours, a.hairColour) &&
    oneOf(accessories, a.accessory) &&
    oneOf(eyeStyles, a.eyes) &&
    oneOf(mouthStyles, a.mouth) &&
    oneOf(backgrounds, a.background)
  ) {
    return {
      v: 1,
      skin: a.skin,
      hair: a.hair,
      hairColour: a.hairColour,
      accessory: a.accessory,
      eyes: a.eyes,
      mouth: a.mouth,
      background: a.background,
    }
  }
  return null
}

/** A whole number from a string, the same every time (FNV-1a). */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

function pick<T>(options: readonly T[], index: number): T {
  const value = options[index % options.length]
  if (value === undefined) throw new Error('No options to pick from')
  return value
}

function build(choose: <T>(options: readonly T[], part: string) => T): AvatarChoice {
  return {
    v: 1,
    skin: choose(skinTones, 'skin'),
    hair: choose(hairStyles, 'hair'),
    hairColour: choose(hairColours, 'hairColour'),
    // No extras half the time.
    accessory: choose(['none', 'none', 'none', ...accessories.slice(1)] as const, 'accessory'),
    eyes: choose(eyeStyles, 'eyes'),
    mouth: choose(mouthStyles, 'mouth'),
    background: choose(backgrounds, 'background'),
  }
}

/** The avatar for someone who skipped the builder (or hasn't seen it): the same for a seed every time. */
export function seededAvatar(seed: string): AvatarChoice {
  return build((options, part) => pick(options, hash(`${seed}:${part}`)))
}

/** "Surprise me" */
export function randomAvatar(random: () => number = Math.random): AvatarChoice {
  return build((options) => pick(options, Math.floor(random() * options.length)))
}

/** What to draw for a person: their saved avatar, or the seeded one from their user id. */
export function avatarFor(stored: unknown, userId: string): AvatarChoice {
  return parseAvatar(stored) ?? seededAvatar(userId)
}

const hairLabels: Record<AvatarChoice['hair'], string> = {
  shortHair: 'Short',
  curlyShortHair: 'Short curls',
  shavedHead: 'Shaved',
  halfShavedHead: 'Half shaved',
  mohawk: 'Mohawk',
  froBun: 'Fro bun',
  braids: 'Braids',
  curlyBob: 'Curly bob',
  wavyBob: 'Wavy bob',
  bunHair: 'Bun',
  straightHair: 'Long and straight',
  bangs: 'Fringe',
  bowlCutHair: 'Bowl cut',
}

const hairColourLabels: Record<AvatarChoice['hairColour'], string> = {
  '220f00': 'Black',
  '3a1a00': 'Dark brown',
  '71472d': 'Brown',
  e2ba87: 'Blonde',
}

const accessoryLabels: Record<AvatarChoice['accessory'], string> = {
  none: 'No extras',
  glasses: 'Glasses',
  sunglasses: 'Sunglasses',
  mustache: 'Moustache',
}

const backgroundLabels: Record<ModuleNumber, string> = {
  1: 'Orange',
  2: 'Purple',
  3: 'Green',
  4: 'Coral',
  5: 'Amber',
}

/** What a screen reader says for an option in the builder. */
export function optionLabel(row: (typeof builderRows)[number]['key'], option: string | number): string {
  switch (row) {
    case 'skin':
      return `Skin tone ${skinTones.indexOf(option as AvatarChoice['skin']) + 1} of ${skinTones.length}`
    case 'hair':
      return hairLabels[option as AvatarChoice['hair']]
    case 'hairColour':
      return hairColourLabels[option as AvatarChoice['hairColour']]
    case 'accessory':
      return accessoryLabels[option as AvatarChoice['accessory']]
    case 'background':
      return backgroundLabels[option as ModuleNumber]
  }
}
