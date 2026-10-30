// Pod formation logic for scripts/form-pods.ts (PLAN.md 4.2). Pure functions, so Vitest covers them.

export const MIN_POD = 4
export const MAX_POD = 6
export const POD_SIZE = 5

/**
 * How to split one segment's n people into pods: sizes largest first, plus how many are left for someone
 * to place by hand. Pods of 5; the remainder r goes:
 *   r = 1 → one pod of 6
 *   r = 2 → two pods of 6 (with only one pod of 5, n = 7, that pod becomes 6 and one person is left over)
 *   r = 3 → two pods of 4: the plan says "one pod of that size", but a pod of 3 is below the minimum of 4,
 *           so one pod of 5 gives a person to the 3
 *   r = 4 → one pod of 4
 * Fewer than 4 people: nobody is placed.
 */
export function podSizes(n: number): { sizes: number[]; unplaced: number } {
  if (!Number.isInteger(n) || n < 0) throw new Error(`Not a number of people: ${n}`)
  if (n < MIN_POD) return { sizes: [], unplaced: n }
  const full = Math.floor(n / POD_SIZE)
  const r = n % POD_SIZE
  const fives = (count: number) => Array.from({ length: count }, () => POD_SIZE)
  switch (r) {
    case 0:
      return { sizes: fives(full), unplaced: 0 }
    case 1:
      return { sizes: [6, ...fives(full - 1)], unplaced: 0 }
    case 2:
      return full >= 2 ? { sizes: [6, 6, ...fives(full - 2)], unplaced: 0 } : { sizes: [6], unplaced: 1 }
    case 3:
      return { sizes: [...fives(full - 1), 4, 4], unplaced: 0 }
    default:
      return { sizes: [...fives(full), 4], unplaced: 0 }
  }
}

/** A repeatable random number generator (mulberry32) from a text seed, so a run can be reproduced. */
export function seededRandom(seed: string): () => number {
  let state = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) state = Math.imul(state ^ seed.charCodeAt(i), 0x01000193) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A shuffled copy (Fisher–Yates). */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const a = copy[i] as T
    copy[i] = copy[j] as T
    copy[j] = a
  }
  return copy
}

// Friendly, plain pod names: things from the land, the house and the gospels (Rooftop is Mark 2:4). More
// than the 100 pods 500 sign-ups would need; if they run out, names get a number ("Cedar 2").
export const podNameWords = [
  'Acacia',
  'Almond',
  'Anchor',
  'Arbor',
  'Aspen',
  'Baobab',
  'Beacon',
  'Birch',
  'Bloom',
  'Breeze',
  'Bridge',
  'Brook',
  'Canopy',
  'Candle',
  'Cedar',
  'Clay',
  'Compass',
  'Cove',
  'Cypress',
  'Dawn',
  'Delta',
  'Dove',
  'Ember',
  'Fern',
  'Field',
  'Fig',
  'Flame',
  'Flint',
  'Forest',
  'Fountain',
  'Garden',
  'Gate',
  'Glade',
  'Grove',
  'Harbour',
  'Harvest',
  'Haven',
  'Hearth',
  'Hill',
  'Horizon',
  'Iris',
  'Iroko',
  'Ivy',
  'Jasmine',
  'Juniper',
  'Keystone',
  'Lamp',
  'Lantern',
  'Laurel',
  'Lighthouse',
  'Lily',
  'Linen',
  'Mango',
  'Maple',
  'Meadow',
  'Mint',
  'Morning',
  'Myrtle',
  'Oak',
  'Oasis',
  'Olive',
  'Orchard',
  'Palm',
  'Pebble',
  'Pillar',
  'Pine',
  'Prism',
  'Rain',
  'Reed',
  'Ridge',
  'River',
  'Rock',
  'Rooftop',
  'Rose',
  'Sage',
  'Sail',
  'Salt',
  'Shore',
  'Sparrow',
  'Spring',
  'Star',
  'Stone',
  'Summit',
  'Sunrise',
  'Sycamore',
  'Tamarind',
  'Terrace',
  'Thyme',
  'Timber',
  'Torch',
  'Tower',
  'Trellis',
  'Valley',
  'Vine',
  'Well',
  'Wheat',
  'Willow',
  'Window',
  'Wren',
  'Yarrow',
  'Ash',
  'Bay',
  'Coast',
  'Daybreak',
  'Hazel',
  'Lagoon',
  'Lark',
  'Pathway',
  'Quill',
  'Rowan',
] as const

/** Pod names in a shuffled order, skipping names already taken, numbered once the list runs out. */
export function podNames(count: number, taken: Iterable<string>, random: () => number): string[] {
  const used = new Set(Array.from(taken, (name) => name.toLowerCase()))
  const words = shuffle(podNameWords, random)
  const names: string[] = []
  for (let round = 1; names.length < count; round++) {
    for (const word of words) {
      if (names.length === count) break
      const name = round === 1 ? word : `${word} ${round}`
      if (used.has(name.toLowerCase())) continue
      used.add(name.toLowerCase())
      names.push(name)
    }
  }
  return names
}

export type Person = { id: string; displayName: string; email: string; segment: string }
export type PlannedPod = { name: string; segment: string; facilitator: Person; members: Person[] }
export type Plan = { pods: PlannedPod[]; unplaced: Person[] }

/**
 * Pods for everyone without one: grouped by segment, shuffled, packed by podSizes, a facilitator picked at
 * random in each, and a unique name. Segments are handled in a fixed order so the same seed gives the same
 * pods.
 */
export function planPods(people: readonly Person[], seed: string, takenNames: Iterable<string> = []): Plan {
  const random = seededRandom(seed)
  const segments = [...new Set(people.map((p) => p.segment))].sort()
  const pods: Omit<PlannedPod, 'name'>[] = []
  const unplaced: Person[] = []

  for (const segment of segments) {
    // Sorted first so the result depends only on who's there and the seed, not the database's order.
    const group = shuffle(
      people.filter((p) => p.segment === segment).sort((a, b) => a.id.localeCompare(b.id)),
      random,
    )
    const { sizes, unplaced: left } = podSizes(group.length)
    let start = 0
    for (const size of sizes) {
      const members = group.slice(start, start + size)
      start += size
      const facilitator = members[Math.floor(random() * members.length)]
      if (!facilitator) throw new Error('A pod with no members')
      pods.push({ segment, facilitator, members })
    }
    unplaced.push(...group.slice(group.length - left))
  }

  const names = podNames(pods.length, takenNames, random)
  return { pods: pods.map((pod, i) => ({ ...pod, name: names[i] ?? `Pod ${i + 1}` })), unplaced }
}

export type ExistingPod = { id: string; name: string; segment: string; size: number }
export type LatePlan = { joins: { pod: ExistingPod; person: Person }[]; unplaced: Person[] }

/**
 * Late sign-ups (after Nov 13): each joins the smallest pod in their segment that has room (up to 6),
 * ties broken at random. Anyone with no pod to join is left for placing by hand.
 */
export function planLate(people: readonly Person[], pods: readonly ExistingPod[], seed: string): LatePlan {
  const random = seededRandom(seed)
  const sizes = new Map(pods.map((pod) => [pod.id, pod.size]))
  const joins: LatePlan['joins'] = []
  const unplaced: Person[] = []

  for (const person of shuffle(
    [...people].sort((a, b) => a.id.localeCompare(b.id)),
    random,
  )) {
    const open = pods.filter((pod) => pod.segment === person.segment && (sizes.get(pod.id) ?? 0) < MAX_POD)
    const smallest = Math.min(...open.map((pod) => sizes.get(pod.id) ?? 0))
    const candidates = open.filter((pod) => sizes.get(pod.id) === smallest)
    const pod = candidates[Math.floor(random() * candidates.length)]
    if (!pod) {
      unplaced.push(person)
      continue
    }
    sizes.set(pod.id, (sizes.get(pod.id) ?? 0) + 1)
    joins.push({ pod, person })
  }
  return { joins, unplaced }
}

/** One CSV line, quoting fields that need it. */
export function csvLine(fields: readonly string[]): string {
  return fields
    .map((field) => (/[",\n\r]/.test(field) ? `"${field.replaceAll('"', '""')}"` : field))
    .join(',')
}
