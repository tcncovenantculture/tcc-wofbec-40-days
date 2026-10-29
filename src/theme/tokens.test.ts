import { describe, expect, it } from 'vitest'
import css from '../index.css?raw'
import { moduleAccents, palette, shadows, type ModuleNumber } from './tokens'

// Keeps tokens.ts in step with index.css, and checks text colours meet the 4.5:1 contrast rule.

function declarations(block: string) {
  const vars = new Map<string, string>()
  for (const [, name, value] of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    if (name && value && !vars.has(name)) vars.set(name, value.trim())
  }
  return vars
}

const rootVars = declarations(css)

// card, border, muted and destructive come through shadcn's semantic names in index.css
const cssNameFor: Record<keyof typeof palette, string> = {
  orange: '--color-orange',
  orangeInk: '--color-orange-ink',
  orangeDeep: '--color-orange-deep',
  amber: '--color-amber',
  yellow: '--color-yellow',
  green: '--color-green',
  purple: '--color-purple',
  coral: '--color-coral',
  cream: '--color-cream',
  card: '--card',
  ink: '--color-ink',
  inkSoft: '--color-ink-soft',
  muted: '--muted-foreground',
  border: '--border',
  overlay: '--color-overlay',
  shimmer: '--color-shimmer',
  destructive: '--destructive',
}

function moduleVars(module: ModuleNumber) {
  const match = new RegExp(`\\[data-module=["']${module}["']\\]\\s*\\{([^}]*)\\}`).exec(css)
  if (!match?.[1]) throw new Error(`No [data-module="${module}"] block in index.css`)
  return declarations(match[1])
}

function luminance(hex: string) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r = 0, g = 0, b = 0] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

const modules = [1, 2, 3, 4, 5] as const

describe('theme tokens', () => {
  it.each(Object.entries(cssNameFor))('%s matches index.css', (key, cssName) => {
    expect(rootVars.get(cssName)?.toLowerCase()).toBe(palette[key as keyof typeof palette].toLowerCase())
  })

  it('shadows match index.css', () => {
    const normalise = (value: string | undefined) => value?.replace(/\s+/g, '').replace(/0\./g, '.')
    expect(normalise(rootVars.get('--shadow-card'))).toBe(normalise(shadows.card))
    expect(normalise(rootVars.get('--shadow-cta'))).toBe(normalise(shadows.cta))
  })

  it.each(modules)('module %i accent matches index.css', (module) => {
    const vars = moduleVars(module)
    const accent = moduleAccents[module]
    expect(vars.get('--accent')?.toLowerCase()).toBe(accent.base.toLowerCase())
    expect(vars.get('--accent-display')?.toLowerCase()).toBe(accent.display.toLowerCase())
    expect(vars.get('--accent-ink')?.toLowerCase()).toBe(accent.ink.toLowerCase())
  })
})

describe('text contrast', () => {
  const backgrounds = { cream: palette.cream, card: palette.card }

  it.each(Object.entries(backgrounds))('small-text colours reach 4.5:1 on %s', (_, background) => {
    const textColours = [palette.ink, palette.inkSoft, palette.muted, palette.orangeInk, palette.destructive]
    for (const colour of textColours) expect(contrast(colour, background)).toBeGreaterThanOrEqual(4.5)
    for (const module of modules) {
      expect(contrast(moduleAccents[module].ink, background)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it.each(Object.entries(backgrounds))('display shades reach 3:1 (large text) on %s', (_, background) => {
    for (const module of modules) {
      expect(contrast(moduleAccents[module].display, background)).toBeGreaterThanOrEqual(3)
    }
  })
})
