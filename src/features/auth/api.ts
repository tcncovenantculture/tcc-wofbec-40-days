import { useMutation, useQuery } from '@tanstack/react-query'
import type { Tables } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import type { SignupValues } from './schema'
import { useUserId } from './use-auth'

export type Profile = Pick<
  Tables<'profiles'>,
  'id' | 'display_name' | 'segment' | 'role' | 'avatar' | 'reminder_email'
>

/** The signed-in person's own profile. */
export function useProfile() {
  const userId = useUserId()
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, segment, role, avatar, reminder_email')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
  })
}

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
