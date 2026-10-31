// Where Supabase keeps the session on the phone. In its own module so the landing page can check for a
// saved session without loading the Supabase client.
export const AUTH_STORAGE_KEY = 'c40.auth'

// Where the query cache is saved for offline use (app/providers.tsx). Removed on sign-out.
export const QUERY_CACHE_KEY = 'c40.cache'

/** Whether this phone has a saved session. It may have expired; the full app checks properly. */
export function hasSavedSession(): boolean {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) !== null
  } catch {
    return false
  }
}
