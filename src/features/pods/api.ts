import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserId } from '@/features/auth/use-auth'
import type { Enums } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { podKeys } from './keys'

// RLS shows people their own pod only. Other members' names come through pod_roster(), which never returns
// contact details, and pod_today_totals() returns counts, never names.

export type MyPod = {
  id: string
  name: string
  segment: Enums<'segment'>
  avatarSeed: string
  whatsappLink: string | null
  isFacilitator: boolean
}

export type PodMember = { userId: string; displayName: string; isFacilitator: boolean }

/** The signed-in person's pod, or null before pods form on Nov 13 (and for leaders, who aren't in one). */
export function useMyPod() {
  const userId = useUserId()
  return useQuery({
    queryKey: podKeys.mine,
    queryFn: async (): Promise<MyPod | null> => {
      const { data, error } = await supabase
        .from('pod_members')
        .select('is_facilitator, pods(id, name, segment, avatar_seed, whatsapp_invite_link)')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      const pod = data?.pods
      if (!data || !pod) return null
      return {
        id: pod.id,
        name: pod.name,
        segment: pod.segment,
        avatarSeed: pod.avatar_seed,
        whatsappLink: pod.whatsapp_invite_link,
        isFacilitator: data.is_facilitator,
      }
    },
  })
}

/** Everyone in my pod, facilitator first. */
export function usePodRoster() {
  return useQuery({
    queryKey: podKeys.roster,
    queryFn: async (): Promise<PodMember[]> => {
      const { data, error } = await supabase.rpc('pod_roster')
      if (error) throw error
      return data.map((member) => ({
        userId: member.user_id,
        displayName: member.display_name,
        isFacilitator: member.is_facilitator,
      }))
    },
  })
}

/** "4 of 5 done today": how many in my pod have finished a day. Pass null to skip (no lesson today). */
export function usePodTotals(day: number | null) {
  return useQuery({
    queryKey: podKeys.totals(day ?? 0),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('pod_today_totals', { for_day: day ?? 0 })
      if (error) throw error
      return data[0] ?? { members: 0, completed: 0 }
    },
    enabled: day !== null,
  })
}

/** Messages per day thread in my pod, as day number → count. */
export function usePodThreadCounts() {
  return useQuery({
    queryKey: podKeys.threadCounts,
    queryFn: async (): Promise<Record<number, number>> => {
      const { data, error } = await supabase.rpc('pod_thread_counts')
      if (error) throw error
      return Object.fromEntries(data.map((row) => [row.day_number, row.messages]))
    },
  })
}

/** The facilitator adds, changes or (with null) removes the pod's WhatsApp group link. */
export function useSetWhatsAppLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (link: string | null) => {
      const { error } = await supabase.rpc('set_whatsapp_link', { link: link ?? '' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: podKeys.mine }),
  })
}
