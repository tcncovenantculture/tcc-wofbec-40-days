import { describe, expect, it } from 'vitest'
import {
  csvLine,
  MAX_POD,
  MIN_POD,
  planLate,
  planPods,
  podNames,
  podNameWords,
  podSizes,
  seededRandom,
  shuffle,
  type ExistingPod,
  type Person,
} from './pods.ts'

describe('podSizes', () => {
  // Every size from 1 to 23, as the plan asks.
  const expected: Record<number, { sizes: number[]; unplaced: number }> = {
    1: { sizes: [], unplaced: 1 },
    2: { sizes: [], unplaced: 2 },
    3: { sizes: [], unplaced: 3 },
    4: { sizes: [4], unplaced: 0 },
    5: { sizes: [5], unplaced: 0 },
    6: { sizes: [6], unplaced: 0 },
    7: { sizes: [6], unplaced: 1 },
    8: { sizes: [4, 4], unplaced: 0 },
    9: { sizes: [5, 4], unplaced: 0 },
    10: { sizes: [5, 5], unplaced: 0 },
    11: { sizes: [6, 5], unplaced: 0 },
    12: { sizes: [6, 6], unplaced: 0 },
    13: { sizes: [5, 4, 4], unplaced: 0 },
    14: { sizes: [5, 5, 4], unplaced: 0 },
    15: { sizes: [5, 5, 5], unplaced: 0 },
    16: { sizes: [6, 5, 5], unplaced: 0 },
    17: { sizes: [6, 6, 5], unplaced: 0 },
    18: { sizes: [5, 5, 4, 4], unplaced: 0 },
    19: { sizes: [5, 5, 5, 4], unplaced: 0 },
    20: { sizes: [5, 5, 5, 5], unplaced: 0 },
    21: { sizes: [6, 5, 5, 5], unplaced: 0 },
    22: { sizes: [6, 6, 5, 5], unplaced: 0 },
    23: { sizes: [5, 5, 5, 4, 4], unplaced: 0 },
  }

  for (let n = 1; n <= 23; n++) {
    it(`packs ${n}`, () => {
      expect(podSizes(n)).toEqual(expected[n])
    })
  }

  it('keeps every pod between 4 and 6 and accounts for everyone, up to 600', () => {
    for (let n = 0; n <= 600; n++) {
      const { sizes, unplaced } = podSizes(n)
      expect(sizes.reduce((sum, size) => sum + size, 0) + unplaced).toBe(n)
      for (const size of sizes) {
        expect(size).toBeGreaterThanOrEqual(MIN_POD)
        expect(size).toBeLessThanOrEqual(MAX_POD)
      }
      // Only tiny segments, and 7, leave anyone out.
      expect(unplaced).toBe(n < 4 ? n : n === 7 ? 1 : 0)
    }
  })

  it('rejects nonsense', () => {
    expect(() => podSizes(-1)).toThrow()
    expect(() => podSizes(2.5)).toThrow()
  })
})

describe('seededRandom and shuffle', () => {
  it('repeats for the same seed and differs for another', () => {
    const items = Array.from({ length: 30 }, (_, i) => i)
    expect(shuffle(items, seededRandom('abc'))).toEqual(shuffle(items, seededRandom('abc')))
    expect(shuffle(items, seededRandom('abc'))).not.toEqual(shuffle(items, seededRandom('abd')))
    expect([...shuffle(items, seededRandom('abc'))].sort((a, b) => a - b)).toEqual(items)
  })

  it('stays between 0 and 1', () => {
    const random = seededRandom('range')
    for (let i = 0; i < 1000; i++) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('podNames', () => {
  it('gives unique names that avoid the ones taken, in any letter case', () => {
    const names = podNames(20, ['rooftop', 'Lantern'], seededRandom('n'))
    expect(new Set(names).size).toBe(20)
    expect(names).not.toContain('Rooftop')
    expect(names).not.toContain('Lantern')
  })

  it('has room for 100 pods, then numbers the names', () => {
    expect(new Set(podNameWords).size).toBe(podNameWords.length)
    expect(podNameWords.length).toBeGreaterThanOrEqual(100)
    const names = podNames(podNameWords.length + 5, [], seededRandom('n'))
    expect(new Set(names).size).toBe(podNameWords.length + 5)
    expect(names.slice(-5).every((name) => / 2$/.test(name))).toBe(true)
  })
})

const people = (count: number, segment: string, prefix = segment): Person[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${String(i).padStart(3, '0')}`,
    displayName: `${prefix} ${i}`,
    email: `${prefix}${i}@example.com`,
    segment,
  }))

describe('planPods', () => {
  const everyone = [
    ...people(23, 'undergrad'),
    ...people(7, 'early_career'),
    ...people(2, 'entrepreneur'),
    ...people(11, 'experienced_professional'),
  ]

  it('forms valid pods within each segment, with a member as facilitator', () => {
    const plan = planPods(everyone, 'seed-1', ['Rooftop'])
    for (const pod of plan.pods) {
      expect(pod.members.length).toBeGreaterThanOrEqual(MIN_POD)
      expect(pod.members.length).toBeLessThanOrEqual(MAX_POD)
      expect(pod.members.every((m) => m.segment === pod.segment)).toBe(true)
      expect(pod.members).toContain(pod.facilitator)
    }
    expect(plan.pods.filter((p) => p.segment === 'undergrad').map((p) => p.members.length)).toEqual([
      5, 5, 5, 4, 4,
    ])
    expect(new Set(plan.pods.map((p) => p.name)).size).toBe(plan.pods.length)
    expect(plan.pods.map((p) => p.name)).not.toContain('Rooftop')
  })

  it('places everyone once, leaving out only small segments and the odd one of seven', () => {
    const plan = planPods(everyone, 'seed-1')
    const placed = plan.pods.flatMap((p) => p.members.map((m) => m.id))
    expect(new Set(placed).size).toBe(placed.length)
    expect(placed.length + plan.unplaced.length).toBe(everyone.length)
    expect(plan.unplaced.filter((p) => p.segment === 'entrepreneur')).toHaveLength(2)
    expect(plan.unplaced.filter((p) => p.segment === 'early_career')).toHaveLength(1)
  })

  it('gives the same pods for the same seed, whatever order people arrive in', () => {
    const a = planPods(everyone, 'same')
    const b = planPods([...everyone].reverse(), 'same')
    expect(b).toEqual(a)
    expect(planPods(everyone, 'other')).not.toEqual(a)
  })
})

describe('planLate', () => {
  const pods: ExistingPod[] = [
    { id: 'p1', name: 'Cedar', segment: 'undergrad', size: 5 },
    { id: 'p2', name: 'Olive', segment: 'undergrad', size: 4 },
    { id: 'p3', name: 'Well', segment: 'entrepreneur', size: 6 },
  ]

  it('fills the smallest pod in the segment first, up to 6', () => {
    const plan = planLate(people(4, 'undergrad', 'late'), pods, 's')
    const joined = (podId: string) => plan.joins.filter((join) => join.pod.id === podId).length
    expect(joined('p2')).toBe(2) // 4 → 6
    expect(joined('p1')).toBe(1) // 5 → 6
    expect(plan.unplaced).toHaveLength(1) // both full now
  })

  it('leaves people with no pod in their segment, or only full ones, for placing by hand', () => {
    const plan = planLate([...people(1, 'entrepreneur', 'e'), ...people(1, 'early_career', 'c')], pods, 's')
    expect(plan.joins).toEqual([])
    expect(plan.unplaced).toHaveLength(2)
  })
})

describe('csvLine', () => {
  it('quotes only what needs quoting', () => {
    expect(csvLine(['Cedar', 'undergrad', 'Ada Obi', 'yes'])).toBe('Cedar,undergrad,Ada Obi,yes')
    expect(csvLine(['Obi, Ada', 'say "hi"'])).toBe('"Obi, Ada","say ""hi"""')
  })
})
