// Mirrors the theme tokens in src/index.css. Use Tailwind classes in components; use these only where a
// raw colour is needed in code (confetti, avatar backgrounds, canvas). tokens.test.ts keeps the two in sync.

export const palette = {
  // brand
  orange: '#E86F36',
  orangeInk: '#BC4B16',
  orangeDeep: '#D2551F',
  amber: '#F0942F',
  yellow: '#F6CA35', // decoration only, never text
  green: '#106635',
  purple: '#892B89',
  coral: '#EF545C',
  // neutrals
  cream: '#FBF5EE',
  card: '#FFFDF9',
  ink: '#1B1714',
  inkSoft: '#5C5149',
  muted: '#7A6E65', // text; in CSS this is text-muted-foreground
  border: '#EADFD3',
  overlay: 'rgba(27, 23, 20, 0.45)',
  shimmer: '#F6EDE2',
  destructive: '#C2343E',
} as const

export const shadows = {
  card: '0 18px 50px -12px rgba(120, 60, 20, 0.18), 0 2px 8px rgba(120, 60, 20, 0.06)',
  cta: '0 10px 24px -8px rgba(210, 85, 31, 0.55)',
} as const

export type ModuleNumber = 1 | 2 | 3 | 4 | 5

export interface ModuleAccent {
  name: string
  /** Bars, dots and glows */
  base: string
  /** Large titles only (about 3:1 on cream) */
  display: string
  /** Small text (at least 4.5:1 on cream and card) */
  ink: string
}

export const moduleAccents: Record<ModuleNumber, ModuleAccent> = {
  1: { name: 'Orange', base: '#E86F36', display: '#E76629', ink: '#BC4B16' },
  2: { name: 'Purple', base: '#892B89', display: '#892B89', ink: '#892B89' },
  3: { name: 'Green', base: '#106635', display: '#106635', ink: '#106635' },
  4: { name: 'Coral', base: '#EF545C', display: '#EF545C', ink: '#C2343E' },
  5: { name: 'Amber', base: '#F0942F', display: '#D3750F', ink: '#A15D0A' },
}

/** Logo strip and bouncing-dots loader, in order */
export const logoStripColours = [
  palette.purple,
  palette.green,
  palette.yellow,
  palette.amber,
  palette.coral,
] as const
