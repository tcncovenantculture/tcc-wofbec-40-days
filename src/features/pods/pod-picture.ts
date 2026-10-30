import { avatarModule } from './names'

// The pod's picture for its WhatsApp group icon: the pod's first letter on a module colour picked from
// the pod's avatar_seed, drawn on a canvas so there's nothing to download. 640px square, WhatsApp's size.
// Kept as a letter rather than the members' DiceBear avatars: it's the group's icon, not one person's face.

const SIZE = 640

/** A module's colour, read from the theme tokens in index.css (never hard-coded here). */
function moduleColour(module: number, variable: '--accent' | '--accent-ink'): string {
  const probe = document.createElement('div')
  probe.dataset.module = String(module)
  probe.hidden = true
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue(variable).trim()
  probe.remove()
  return value
}

/** The pod picture as a PNG data URL. */
export async function podPicture(name: string, seed: string): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser can’t draw pictures')

  ctx.fillStyle = moduleColour(avatarModule(seed), '--accent-ink')
  ctx.fillRect(0, 0, SIZE, SIZE)

  // The five module colours as a short strip, inside the circle WhatsApp crops the icon to.
  const stripWidth = 260
  const left = (SIZE - stripWidth) / 2
  ctx.fillStyle = 'white'
  ctx.fillRect(left - 8, 474, stripWidth + 16, 40)
  for (let module = 1; module <= 5; module++) {
    ctx.fillStyle = moduleColour(module, '--accent')
    ctx.fillRect(left + ((module - 1) * stripWidth) / 5, 482, stripWidth / 5, 24)
  }

  const font = '700 340px "Barlow Condensed", "Arial Narrow", sans-serif'
  await document.fonts.load(font)
  ctx.font = font
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(Array.from(name.trim())[0]?.toLocaleUpperCase() ?? '?', SIZE / 2, 420)

  return canvas.toDataURL('image/png')
}

/** Saves the pod picture to the phone. */
export function savePodPicture(dataUrl: string, podName: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${podName} pod.png`
  link.click()
}
