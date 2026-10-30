import type { Session } from '@supabase/supabase-js'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AUTH_STORAGE_KEY, QUERY_CACHE_KEY } from '@/lib/auth-storage'
import { supabase } from '@/lib/supabase'
import { AuthContext, type AuthState } from './use-auth'

/**
 * The session supabase-js has saved, if any. When the access token has expired and the phone is offline,
 * supabase-js can't refresh it, so it reports no session while keeping it saved (it only deletes it on a
 * real sign-out or a rejected refresh token). Using the saved copy keeps people signed in offline; the
 * server still checks every request, and supabase-js refreshes the token once the signal returns.
 */
function savedSession(): Session | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    const looksLikeSession =
      typeof parsed === 'object' &&
      parsed !== null &&
      'access_token' in parsed &&
      'user' in parsed &&
      typeof parsed.user === 'object' &&
      parsed.user !== null &&
      'id' in parsed.user &&
      typeof parsed.user.id === 'string'
    return looksLikeSession ? (parsed as Session) : null
  } catch {
    return null
  }
}

/**
 * Forgets everything the previous person loaded. The saved copy is removed straight away too: it's only
 * rewritten up to a second later, and a phone closed in that second would otherwise keep it.
 */
function forgetCachedData(queryClient: QueryClient) {
  queryClient.clear()
  try {
    localStorage.removeItem(QUERY_CACHE_KEY)
  } catch {
    // Storage blocked: nothing was saved
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  const queryClient = useQueryClient()
  const userId = useRef<string | null>(null)

  useEffect(() => {
    // Fires INITIAL_SESSION straight away, then on every change.
    // Keep this callback synchronous: calling Supabase inside it can deadlock the auth client.
    const { data } = supabase.auth.onAuthStateChange((event, reported) => {
      const session = reported ?? (event === 'INITIAL_SESSION' ? savedSession() : null)
      const nextUserId = session?.user.id ?? null
      // Phones get shared: never show one person's cached data to the next.
      if (userId.current !== null && userId.current !== nextUserId) forgetCachedData(queryClient)
      userId.current = nextUserId
      setState(session ? { status: 'signed-in', session } : { status: 'signed-out' })
    })
    return () => data.subscription.unsubscribe()
  }, [queryClient])

  return <AuthContext value={state}>{children}</AuthContext>
}
