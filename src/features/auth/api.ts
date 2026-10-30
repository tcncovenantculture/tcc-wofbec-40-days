import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import type { SignupValues } from './schema'

export type AuthMode = 'signup' | 'signin'

type SendCodeInput =
  | { mode: 'signup'; values: SignupValues }
  | { mode: 'signin'; email: string }
  // Resending: the account exists after the first code, so no profile data is needed.
  | { mode: 'resend'; email: string }

/** Emails a 6-digit sign-in code. A sign-up also creates the account and, through a trigger, the profile. */
export function useSendCode() {
  return useMutation({
    mutationFn: async (input: SendCodeInput) => {
      if (input.mode === 'signup') {
        const { values } = input
        const { error } = await supabase.auth.signInWithOtp({
          email: values.email,
          options: {
            shouldCreateUser: true,
            // Read by the handle_new_user trigger. Never include role here.
            data: {
              display_name: values.display_name,
              segment: values.segment,
              whatsapp_number: values.whatsapp_number,
              reminder_email: values.reminder_email,
            },
          },
        })
        if (error) throw error
        return values.email
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: input.email,
        options: { shouldCreateUser: false },
      })
      if (error) throw error
      return input.email
    },
  })
}

export function useVerifyCode() {
  return useMutation({
    mutationFn: async ({ email, token }: { email: string; token: string }) => {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
      if (error) throw error
    },
  })
}

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  })
}

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
