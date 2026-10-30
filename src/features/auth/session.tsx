import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthContext, type AuthState } from './use-auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  const queryClient = useQueryClient()
  const userId = useRef<string | null>(null)

  useEffect(() => {
    // Fires INITIAL_SESSION straight away with the stored session (works offline), then on every change.
    // Keep this callback synchronous: calling Supabase inside it can deadlock the auth client.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id ?? null
      // Phones get shared: never show one person's cached data to the next.
      if (userId.current !== null && userId.current !== nextUserId) queryClient.clear()
      userId.current = nextUserId
      setState(session ? { status: 'signed-in', session } : { status: 'signed-out' })
    })
    return () => data.subscription.unsubscribe()
  }, [queryClient])

  return <AuthContext value={state}>{children}</AuthContext>
}
