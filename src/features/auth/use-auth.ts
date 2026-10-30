import type { Session } from '@supabase/supabase-js'
import { createContext, use } from 'react'

export type AuthState =
  { status: 'loading' } | { status: 'signed-out' } | { status: 'signed-in'; session: Session }

/** Provided by <AuthProvider> in session.tsx. */
export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const state = use(AuthContext)
  if (!state) throw new Error('useAuth must be used inside <AuthProvider>')
  return state
}

/** The signed-in user's id. Only call on screens behind the sign-in guard. */
export function useUserId(): string {
  const state = useAuth()
  if (state.status !== 'signed-in') throw new Error('useUserId needs a signed-in user')
  return state.session.user.id
}
