import { useQuery } from '@tanstack/react-query'
import type { Tables } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import type { Media } from './schema'

// RLS only returns days the person can see: published and unlocked, or every day for reviewers and
// moderators. The app still works out "today" from programme.ts; a day missing here isn't unlocked yet.

export type DaySummary = Pick<
  Tables<'days'>,
  | 'day_number'
  | 'module_number'
  | 'kind'
  | 'title'
  | 'est_minutes'
  | 'publish_at'
  | 'status'
  | 'practical_action'
>

export type Day = Omit<Tables<'days'>, 'media'> & { media: Media[] }

export const dayKeys = {
  summaries: ['days', 'summaries'] as const,
  day: (dayNumber: number) => ['days', dayNumber] as const,
}

export function useDaySummaries() {
  return useQuery({
    queryKey: dayKeys.summaries,
    queryFn: async (): Promise<DaySummary[]> => {
      const { data, error } = await supabase
        .from('days')
        .select('day_number, module_number, kind, title, est_minutes, publish_at, status, practical_action')
        .order('day_number')
      if (error) throw error
      return data
    },
  })
}

/** One day's full content, or null if it doesn't exist or isn't unlocked for this person. */
export function useDay(dayNumber: number) {
  return useQuery({
    queryKey: dayKeys.day(dayNumber),
    queryFn: async (): Promise<Day | null> => {
      const { data, error } = await supabase
        .from('days')
        .select('*')
        .eq('day_number', dayNumber)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      // Loaded on demand so zod stays out of the first-load bundle (home doesn't need it).
      const { mediaListSchema } = await import('./schema')
      const media = mediaListSchema.safeParse(data.media)
      if (!media.success)
        console.warn(`Day ${dayNumber} has media the app can't read; showing it without media.`)
      return { ...data, media: media.success ? media.data : [] }
    },
  })
}
