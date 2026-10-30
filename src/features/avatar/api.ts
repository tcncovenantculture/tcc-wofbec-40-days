import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Profile } from '@/features/auth/api'
import { useUserId } from '@/features/auth/use-auth'
import { podKeys } from '@/features/pods/keys'
import { supabase } from '@/lib/supabase'
import type { AvatarChoice } from './options'

/** Saves the avatar to the profile (a column people may edit; see the profiles grants). */
export function useSaveAvatar() {
  const userId = useUserId()
  const queryClient = useQueryClient()
  const profileKey = ['profile', userId]

  return useMutation({
    mutationFn: async (avatar: AvatarChoice) => {
      const { error } = await supabase.from('profiles').update({ avatar }).eq('id', userId)
      if (error) throw error
    },
    onSuccess: (_data, avatar) => {
      const profile = queryClient.getQueryData<Profile>(profileKey)
      if (profile) queryClient.setQueryData<Profile>(profileKey, { ...profile, avatar })
      void queryClient.invalidateQueries({ queryKey: profileKey })
      // The pod header and chat show it too.
      void queryClient.invalidateQueries({ queryKey: podKeys.roster })
    },
  })
}
