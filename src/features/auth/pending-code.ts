import { z } from 'zod'

// The email waiting for a code, kept for the tab session so a reload on /verify doesn't lose it.

const PENDING_KEY = 'c40.pendingCode'

const pendingCodeSchema = z.object({
  email: z.string(),
  mode: z.enum(['signup', 'signin']),
  sentAt: z.number(),
})

export type PendingCode = z.infer<typeof pendingCodeSchema>

/** Reads the pending code passed through router state, if it's there and well formed. */
export function pendingFromState(state: unknown): PendingCode | null {
  const parsed = pendingCodeSchema.safeParse(state)
  return parsed.success ? parsed.data : null
}

export function savePendingCode(pending: PendingCode) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  } catch {
    // Storage blocked: /verify still gets the email through router state.
  }
}

export function readPendingCode(): PendingCode | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const parsed = pendingCodeSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function clearPendingCode() {
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    // Nothing to clear
  }
}
