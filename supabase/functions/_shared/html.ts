// Shared by the email templates. Pure (no Deno or Node APIs), so Vitest can test them.

/** Makes text safe to put inside HTML: what people type must never become markup. */
export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

// Emails need inline styles and literal colours; these match the app's tokens (src/theme/tokens.ts).
const colours = {
  cream: '#FBF5EE',
  card: '#FFFDF9',
  ink: '#1B1714',
  inkSoft: '#5C5149',
  orangeInk: '#BC4B16',
}

/** A paragraph of already-escaped HTML. */
export const paragraph = (content: string) => `<p style="margin:0 0 12px;line-height:1.5">${content}</p>`

/** A button-style link. */
export const buttonLink = (href: string, label: string) =>
  `<p style="margin:8px 0 20px"><a href="${escapeHtml(href)}" style="display:inline-block;background:${colours.orangeInk};color:#FFFFFF;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:12px">${escapeHtml(label)}</a></p>`

/** The page every email sits in: a card on cream, with small print at the bottom. */
export function emailPage(body: string, smallPrint: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:${colours.cream};font-family:Arial,sans-serif;color:${colours.ink};font-size:16px">
<div style="max-width:480px;margin:0 auto;background:${colours.card};border-radius:16px;padding:24px">
${body}
<p style="margin:16px 0 0;color:${colours.inkSoft};font-size:14px;line-height:1.5">${smallPrint}</p>
</div>
</body></html>`
}

/** The day number in Lagos (UTC+1 all year, no daylight saving): 1 on 14 Nov 2026, 0 or less before. */
export function lagosDayNumber(now: Date): number {
  const lagosDate = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10)
  return Math.round((Date.parse(lagosDate) - Date.parse('2026-11-13')) / (24 * 60 * 60 * 1000))
}

const list = new Intl.ListFormat('en-GB', { type: 'conjunction' })

/** "Ada, Bola and Chidi", first names only. */
export function firstNames(names: readonly string[]): string {
  return list.format(names.map((name) => name.trim().split(/\s+/)[0] ?? name))
}
