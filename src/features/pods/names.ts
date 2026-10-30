// Names in a pod, and a module colour from a seed (the pod picture uses the pod's avatar_seed).

/** A module colour (1 to 5) picked from a seed, the same every time. */
export function avatarModule(seed: string): number {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return (hash % 5) + 1
}

/** The first word of a display name, for tight spaces. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

const list = new Intl.ListFormat('en-GB', { type: 'conjunction' })

/** "Ada, Dayo, Efe, Funmi and you": everyone in the pod, first names, the reader last. */
export function podNames(members: { userId: string; displayName: string }[], me: string): string {
  const others = members.filter((m) => m.userId !== me).map((m) => firstName(m.displayName))
  const text = list.format(members.some((m) => m.userId === me) ? [...others, 'you'] : others)
  return text.charAt(0).toLocaleUpperCase() + text.slice(1)
}
