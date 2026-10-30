// Placeholder avatars until Phase 3's avatar builder: initials on one of the five module colours.

/** "Ada Obi" → "AO", "Funmi" → "F". Works on letters outside Latin and on emoji. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = Array.from(words[0] ?? '?')[0] ?? '?'
  const last = words.length > 1 ? (Array.from(words.at(-1) ?? '')[0] ?? '') : ''
  return (first + last).toLocaleUpperCase()
}

/** A module colour (1 to 5) picked from the user id, so a person keeps the same colour everywhere. */
export function avatarModule(userId: string): number {
  let hash = 0
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
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
