import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { podKeys } from '@/features/pods/keys'
import { track } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'

export const progressKeys = { all: ['progress'] as const }

// The cache holds a plain array (it's saved to the phone as JSON); screens get a Set.
const toSet = (days: number[]) => new Set(days)

/** The day numbers this person has completed. */
export function useProgress() {
  return useQuery({
    queryKey: progressKeys.all,
    queryFn: async (): Promise<number[]> => {
      const { data, error } = await supabase.from('progress').select('day_number')
      if (error) throw error
      return data.map((row) => row.day_number)
    },
    select: toSet,
  })
}

export function useCompleteDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dayNumber: number) => {
      // Completing twice is harmless: the second insert is ignored.
      const { error } = await supabase
        .from('progress')
        .upsert({ day_number: dayNumber }, { onConflict: 'user_id,day_number', ignoreDuplicates: true })
      if (error) throw error
    },
    onSuccess: (_data, dayNumber) => {
      track('day_completed', { day: dayNumber })
      queryClient.setQueryData<number[]>(progressKeys.all, (done = []) =>
        done.includes(dayNumber) ? done : [...done, dayNumber],
      )
      void queryClient.invalidateQueries({ queryKey: progressKeys.all })
      // The pod screen's "4 of 5 done today" includes this person.
      void queryClient.invalidateQueries({ queryKey: podKeys.allTotals })
    },
  })
}
