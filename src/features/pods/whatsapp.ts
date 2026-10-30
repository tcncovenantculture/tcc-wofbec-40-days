// WhatsApp group links, as pasted by a facilitator: often with extra words around them ("Follow this
// link to join my WhatsApp group: …") or a tracking suffix (?mode=…). Only the invite itself is kept.
const INVITE = /(?:https?:\/\/)?chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9]{10,40})/i

/** The clean invite link found in some pasted text, or null if there isn't one. */
export function extractInviteLink(text: string): string | null {
  const code = INVITE.exec(text)?.[1]
  return code ? `https://chat.whatsapp.com/${code}` : null
}

/** A wa.me link that opens WhatsApp with the text ready to send. */
export function whatsAppShareLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
