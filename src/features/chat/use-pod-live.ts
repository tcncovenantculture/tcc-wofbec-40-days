import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { podKeys } from '@/features/pods/keys'
import { supabase } from '@/lib/supabase'
import { chatKeys } from './api'

type MessageChange = { pod_id: string; day_number: number | null }

/**
 * Live updates while the pod screen is open. Realtime sends a member each new or hidden message in their
 * pod, but never the body (it isn't granted), so a change just refreshes that thread. Each time live
 * updates connect (including after a dropped signal), the pod's threads refresh once to pick up anything
 * sent while they weren't connected.
 */
export function usePodLive(podId: string) {
  const queryClient = useQueryClient()
  useEffect(() => {
    const channel = supabase
      .channel(`pod-${podId}`)
      .on('system', {}, (message: { extension?: string; status?: string }) => {
        if (message.extension !== 'postgres_changes' || message.status !== 'ok') return
        void queryClient.invalidateQueries({ queryKey: chatKeys.pod(podId) })
        void queryClient.invalidateQueries({ queryKey: podKeys.threadCounts })
      })
      .on<MessageChange>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `pod_id=eq.${podId}` },
        (change) => {
          const row = change.new
          void queryClient.invalidateQueries({
            queryKey: 'day_number' in row ? chatKeys.thread(podId, row.day_number) : chatKeys.pod(podId),
          })
          void queryClient.invalidateQueries({ queryKey: podKeys.threadCounts })
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [podId, queryClient])
}
