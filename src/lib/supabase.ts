import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Browser client. Uses the anon (publishable) key only: the service role key never belongs in src/.
// Components don't import this directly; data access goes through features/*/api.ts hooks.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local.')
}

/** Where supabase-js keeps the session in localStorage. Fixed so the auth provider can read it offline. */
export const AUTH_STORAGE_KEY = 'c40.auth'

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storageKey: AUTH_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    // Sign-in uses 6-digit codes, not magic links, so there's never a session in the URL.
    detectSessionInUrl: false,
  },
})
