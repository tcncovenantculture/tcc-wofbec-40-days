import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatKeys, type Message } from '@/features/chat/api'
import type { Database, Enums } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

// Reports are written straight to the table (RLS: only messages the reporter can see) and read only through
// functions: moderators get the queue, a facilitator gets their pod's reported messages without reporters.

export type ReportReason = Enums<'report_reason'>

export const reportReasons: { value: ReportReason; label: string }[] = [
  { value: 'unkind', label: 'Unkind' },
  { value: 'unsafe', label: 'Unsafe' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Something else' },
]

export const reasonLabel = (reason: ReportReason) =>
  reportReasons.find((r) => r.value === reason)?.label ?? reason

export const MAX_REPORT_DETAILS = 1000

export const moderationKeys = {
  all: ['moderation'] as const,
  queue: ['moderation', 'queue'] as const,
  context: (messageId: string) => ['moderation', 'context', messageId] as const,
  podReported: ['moderation', 'pod-reported'] as const,
  announcements: ['moderation', 'announcements'] as const,
}

/** Report a message. Reporting the same message again counts as done ('already'). */
export function useReportMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (report: { messageId: string; reason: ReportReason; details: string }) => {
      const details = report.details.trim()
      const { error } = await supabase
        .from('reports')
        .insert({ message_id: report.messageId, reason: report.reason, details: details || null })
      if (error?.code === '23505') return 'already' as const
      if (error) throw error
      return 'sent' as const
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moderationKeys.podReported }),
  })
}

export type ReportedMessage = { messageId: string; day: number | null; reasons: ReportReason[] }

/** For a facilitator: which of their pod's messages have open reports. Others get an empty list. */
export function usePodReportedMessages(enabled: boolean) {
  return useQuery({
    queryKey: moderationKeys.podReported,
    queryFn: async (): Promise<ReportedMessage[]> => {
      const { data, error } = await supabase.rpc('pod_reported_messages')
      if (error) throw error
      return data.map((row) => ({
        messageId: row.message_id,
        day: (row.day_number as number | null) ?? null,
        reasons: row.reasons,
      }))
    },
    enabled,
    staleTime: 10_000,
  })
}

type QueueRow = Database['public']['Functions']['moderation_queue']['Returns'][number]

export type QueueItem = {
  messageId: string
  // Null for an announcement (no pod), general chat (no day), or an author who has left.
  podName: string | null
  day: number | null
  authorName: string | null
  body: string
  hidden: boolean
  sentAt: string
  reports: number
  reasons: ReportReason[]
  details: string[]
  lastReportedAt: string
}

/** Moderators: every message with open reports, most recently reported first. */
export function useModerationQueue() {
  return useQuery({
    queryKey: moderationKeys.queue,
    queryFn: async (): Promise<QueueItem[]> => {
      const { data, error } = await supabase.rpc('moderation_queue')
      if (error) throw error
      return data.map((row: QueueRow) => ({
        messageId: row.message_id,
        podName: (row.pod_name as string | null) ?? null,
        day: (row.day_number as number | null) ?? null,
        authorName: (row.author_name as string | null) ?? null,
        body: row.body,
        hidden: row.hidden,
        sentAt: row.sent_at,
        reports: row.reports,
        reasons: row.reasons,
        details: row.details,
        lastReportedAt: row.last_reported_at,
      }))
    },
    staleTime: 10_000,
  })
}

export type ContextMessage = {
  id: string
  authorName: string | null
  body: string
  hidden: boolean
  createdAt: string
}

/** Moderators: the messages around a reported one in its thread. */
export function useModerationContext(messageId: string, enabled: boolean) {
  return useQuery({
    queryKey: moderationKeys.context(messageId),
    queryFn: async (): Promise<ContextMessage[]> => {
      const { data, error } = await supabase.rpc('moderation_context', { message_id: messageId })
      if (error) throw error
      return data.map((row) => ({
        id: row.id,
        authorName: (row.author_name as string | null) ?? null,
        body: row.body,
        hidden: row.hidden,
        createdAt: row.created_at,
      }))
    },
    enabled,
  })
}

/** Moderators: hide a reported message (closing its reports), or dismiss its reports. */
export function useResolveReports() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ messageId, outcome }: { messageId: string; outcome: 'hide' | 'dismiss' }) => {
      const { error } = await supabase.rpc('resolve_reports', { message_id: messageId, outcome })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: moderationKeys.all })
      void queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}

/** Moderators: the latest announcements, so a mistake can be hidden. */
export function useRecentAnnouncements() {
  return useQuery({
    queryKey: moderationKeys.announcements,
    queryFn: async (): Promise<Pick<Message, 'id' | 'body' | 'hidden' | 'createdAt'>[]> => {
      const { data, error } = await supabase
        .from('pod_messages')
        .select('id, body, hidden, created_at')
        .eq('kind', 'announcement')
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data.map((row) => ({
        id: row.id,
        body: row.body ?? '',
        hidden: row.hidden ?? false,
        createdAt: row.created_at,
      }))
    },
  })
}

/** Moderators: post an announcement to every pod. */
export function usePostAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from('messages').insert({ kind: 'announcement', body })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: moderationKeys.announcements })
      void queryClient.invalidateQueries({ queryKey: chatKeys.announcement })
    },
  })
}
