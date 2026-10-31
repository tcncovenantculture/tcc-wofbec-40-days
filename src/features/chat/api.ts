import {
  useInfiniteQuery,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type Mutation,
} from '@tanstack/react-query'
import { useUserId } from '@/features/auth/use-auth'
import { podKeys } from '@/features/pods/keys'
import type { Enums, Tables } from '@/lib/database.types'
import { track } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'

// Messages are read through the pod_messages view: RLS limits rows to my pod and announcements, and a
// hidden message comes back as "Message hidden". The messages table is only written to.

export type MessageKind = Enums<'message_kind'>

export type Message = {
  id: string
  podId: string | null
  day: number | null
  authorId: string | null
  kind: MessageKind
  body: string
  hidden: boolean
  createdAt: string
}

export type OutgoingMessage = {
  id: string
  podId: string
  day: number | null
  kind: Exclude<MessageKind, 'announcement'>
  body: string
}

export const PAGE_SIZE = 30
export const MAX_MESSAGE_LENGTH = 2000

type Cursor = { createdAt: string; id: string }
type ThreadData = InfiniteData<Message[], Cursor | null>

export const chatKeys = {
  all: ['messages'] as const,
  pod: (podId: string) => ['messages', podId] as const,
  // A day's thread, or general chat (null). The pinned query shares the prefix, so refreshing a thread
  // refreshes its pinned post too.
  thread: (podId: string, day: number | null) => ['messages', podId, day ?? 'general'] as const,
  pinned: (podId: string, day: number | null) => ['messages', podId, day ?? 'general', 'pinned'] as const,
  announcement: ['messages', 'announcement'] as const,
}

const COLUMNS = 'id, pod_id, day_number, author_id, kind, body, hidden, created_at'

function toMessage(row: Tables<'pod_messages'>): Message {
  return {
    id: row.id,
    podId: row.pod_id,
    day: row.day_number,
    authorId: row.author_id,
    kind: row.kind,
    body: row.body ?? '',
    hidden: row.hidden ?? false,
    createdAt: row.created_at,
  }
}

/** PostgREST filter for messages older than the cursor, ordered by (created_at, id). */
export function olderThan({ createdAt, id }: Cursor): string {
  return `created_at.lt."${createdAt}",and(created_at.eq."${createdAt}",id.lt."${id}")`
}

function threadQuery(podId: string, day: number | null) {
  const query = supabase.from('pod_messages').select(COLUMNS).eq('pod_id', podId)
  return day === null ? query.is('day_number', null) : query.eq('day_number', day)
}

/** A thread, newest first in pages of 30; the next page holds older messages. */
export function useThread(podId: string, day: number | null) {
  return useInfiniteQuery({
    queryKey: chatKeys.thread(podId, day),
    queryFn: async ({ pageParam }): Promise<Message[]> => {
      let query = threadQuery(podId, day)
      if (pageParam) query = query.or(olderThan(pageParam))
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE)
      if (error) throw error
      return data.map(toMessage)
    },
    initialPageParam: null as Cursor | null,
    getNextPageParam: (page): Cursor | undefined => {
      const oldest = page.at(-1)
      return page.length === PAGE_SIZE && oldest ? { createdAt: oldest.createdAt, id: oldest.id } : undefined
    },
    // Chat moves faster than lesson content: refetch when someone comes back to the app.
    staleTime: 10_000,
  })
}

/** The facilitator's latest pinned post in a thread, shown above it. */
export function usePinned(podId: string, day: number | null) {
  return useQuery({
    queryKey: chatKeys.pinned(podId, day),
    queryFn: async (): Promise<Message | null> => {
      const { data, error } = await threadQuery(podId, day)
        .eq('kind', 'pinned')
        .eq('hidden', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data ? toMessage(data) : null
    },
    staleTime: 10_000,
  })
}

/** The latest announcement from the church moderators, shown to every pod. */
export function useLatestAnnouncement() {
  return useQuery({
    queryKey: chatKeys.announcement,
    queryFn: async (): Promise<Message | null> => {
      const { data, error } = await supabase
        .from('pod_messages')
        .select(COLUMNS)
        .eq('kind', 'announcement')
        .eq('hidden', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data ? toMessage(data) : null
    },
  })
}

const sendKey = ['send-message'] as const

/**
 * Sends a message. The id is made on the phone, so sending the same message again after a dropped
 * connection can't post it twice. Offline, the send waits and goes when the signal returns.
 */
export function useSendMessage() {
  const queryClient = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationKey: sendKey,
    mutationFn: async (message: OutgoingMessage): Promise<string> => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          id: message.id,
          pod_id: message.podId,
          day_number: message.day,
          kind: message.kind,
          body: message.body,
        })
        .select('created_at')
        .single()
      // The same id again means an earlier try got through after all.
      if (error?.code === '23505') return new Date().toISOString()
      if (error) throw error
      return data.created_at
    },
    onSuccess: (createdAt, message) => {
      if (message.kind === 'shared_reflection') track('reflection_shared', { day: message.day })
      else track('pod_message_posted', { day: message.day, kind: message.kind })
      const sent: Message = { ...message, authorId: userId, hidden: false, createdAt }
      // Put it in the thread straight away, so it doesn't blink out between "sending" and the refetch.
      queryClient.setQueryData<ThreadData>(chatKeys.thread(message.podId, message.day), (data) => {
        if (!data || data.pages.some((page) => page.some((m) => m.id === sent.id))) return data
        const [newest = [], ...older] = data.pages
        return { ...data, pages: [[sent, ...newest], ...older] }
      })
      void queryClient.invalidateQueries({ queryKey: chatKeys.thread(message.podId, message.day) })
      void queryClient.invalidateQueries({ queryKey: podKeys.threadCounts })
    },
  })
}

export type PendingMessage = {
  message: OutgoingMessage
  failed: boolean
  waiting: boolean
  mutation: Mutation<unknown, Error, unknown, unknown>
}

/** Messages in a thread that are still sending, waiting for a signal, or failed. */
export function usePendingMessages(podId: string, day: number | null) {
  const queryClient = useQueryClient()
  const send = useSendMessage()
  const pending = useMutationState<PendingMessage>({
    filters: {
      mutationKey: sendKey,
      predicate: (mutation) => mutation.state.status === 'pending' || mutation.state.status === 'error',
    },
    select: (mutation) => ({
      message: mutation.state.variables as OutgoingMessage,
      failed: mutation.state.status === 'error',
      waiting: mutation.state.isPaused,
      mutation,
    }),
  }).filter(({ message }) => message.podId === podId && message.day === day)

  const discard = (item: PendingMessage) => queryClient.getMutationCache().remove(item.mutation)
  const retry = (item: PendingMessage) => {
    discard(item)
    send.mutate(item.message)
  }
  return { pending, retry, discard }
}

/** Hide a message (facilitator of its pod, or a moderator). It stays as "Message hidden". */
export function useHideMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (message: Message) => {
      const { error } = await supabase.rpc('hide_message', { message_id: message.id })
      if (error) throw error
    },
    onSuccess: (_data, message) => {
      void queryClient.invalidateQueries({
        queryKey: message.podId ? chatKeys.thread(message.podId, message.day) : chatKeys.announcement,
      })
    },
  })
}
