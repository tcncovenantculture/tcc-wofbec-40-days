import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Profile } from '@/features/auth/api'
import { useUserId } from '@/features/auth/use-auth'
import { supabase } from '@/lib/supabase'

/** Turns the morning reminder email on or off (consent, PLAN.md 3.2). The switch moves straight away. */
export function useSetReminderEmail() {
  const userId = useUserId()
  const queryClient = useQueryClient()
  const profileKey = ['profile', userId]

  return useMutation({
    mutationFn: async (on: boolean) => {
      const { error } = await supabase.from('profiles').update({ reminder_email: on }).eq('id', userId)
      if (error) throw error
    },
    onMutate: async (on) => {
      await queryClient.cancelQueries({ queryKey: profileKey })
      const before = queryClient.getQueryData<Profile>(profileKey)
      if (before) queryClient.setQueryData<Profile>(profileKey, { ...before, reminder_email: on })
      return { before }
    },
    onError: (_error, _on, context) => {
      if (context?.before) queryClient.setQueryData(profileKey, context.before)
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: profileKey }),
  })
}
