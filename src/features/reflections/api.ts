import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserId } from '@/features/auth/use-auth'
import { supabase } from '@/lib/supabase'

// Private answers: RLS returns only the signed-in person's own rows. Never cached on the phone (see
// PERSISTED in app/providers.tsx).

export const reflectionKeys = {
  day: (dayNumber: number) => ['reflections', dayNumber] as const,
}

/** This person's answers for a day, as prompt index → text. */
export function useReflections(dayNumber: number) {
  return useQuery({
    queryKey: reflectionKeys.day(dayNumber),
    queryFn: async (): Promise<Record<number, string>> => {
      const { data, error } = await supabase
        .from('reflections')
        .select('prompt_index, body')
        .eq('day_number', dayNumber)
      if (error) throw error
      return Object.fromEntries(data.map((row) => [row.prompt_index, row.body]))
    },
    // Answers are typed here: don't let a background refetch overwrite what's on screen.
    staleTime: Infinity,
  })
}

export function useSaveReflection(dayNumber: number, promptIndex: number) {
  const userId = useUserId()
  const queryClient = useQueryClient()
  return useMutation({
    // Saves for one answer box run one at a time, in order, so an older save never lands last.
    scope: { id: `reflection-${dayNumber}-${promptIndex}` },
    mutationFn: async (body: string) => {
      const { error } = await supabase
        .from('reflections')
        .upsert(
          { user_id: userId, day_number: dayNumber, prompt_index: promptIndex, body },
          { onConflict: 'user_id,day_number,prompt_index' },
        )
      if (error) throw error
    },
    onSuccess: (_data, body) => {
      queryClient.setQueryData<Record<number, string>>(reflectionKeys.day(dayNumber), (answers) => ({
        ...answers,
        [promptIndex]: body,
      }))
    },
  })
}
