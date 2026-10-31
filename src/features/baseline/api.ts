import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserId } from '@/features/auth/use-auth'
import type { Enums } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import type { BaselineKey } from './questions'

export type BaselinePhase = Enums<'baseline_phase'>
export type BaselineAnswers = Record<BaselineKey, number | null> & { note: string }

const baselineKey = (userId: string, phase: BaselinePhase) => ['baseline', userId, phase] as const

/** Whether this person has answered the baseline questions for a phase. */
export function useBaselineAnswered(phase: BaselinePhase) {
  const userId = useUserId()
  return useQuery({
    queryKey: baselineKey(userId, phase),
    queryFn: async (): Promise<boolean> => {
      const { count, error } = await supabase
        .from('baseline_responses')
        .select('phase', { count: 'exact', head: true })
        .eq('phase', phase)
      if (error) throw error
      return (count ?? 0) > 0
    },
  })
}

/** Saves the answers. Answering twice counts as done (each phase is answered once). */
export function useSaveBaseline(phase: BaselinePhase) {
  const userId = useUserId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (answers: BaselineAnswers) => {
      const note = answers.note.trim()
      const { error } = await supabase.from('baseline_responses').insert({
        phase,
        career: answers.career,
        character: answers.character,
        community: answers.community,
        note: note === '' ? null : note,
      })
      if (error && error.code !== '23505') throw error
    },
    onSuccess: () => queryClient.setQueryData(baselineKey(userId, phase), true),
  })
}
