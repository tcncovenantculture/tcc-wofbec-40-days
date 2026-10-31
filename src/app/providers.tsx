import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useState, type ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/features/auth/session'
import { LocalSettingsProvider } from '@/features/settings/local-settings'
import { QUERY_CACHE_KEY } from '@/lib/auth-storage'

const WEEK = 7 * 24 * 60 * 60 * 1000

// Bump when a cached query's data shape changes, so old caches are thrown away.
const CACHE_VERSION = '1'

// Queries saved to the phone so home and the last opened day work offline. Private reflections are
// left out. Signing out clears the cache (see AuthProvider), and the saved copy with it.
const PERSISTED = new Set(['days', 'progress', 'profile'])

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Weak data: don't refetch on every screen change; retry a couple of times before showing an error.
        staleTime: 60_000,
        retry: 2,
        // Keep data at least as long as the saved copy, or it's dropped before it can be restored.
        gcTime: WEEK,
      },
    },
  })
}

function phoneStorage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined // Storage blocked: the app still works, just not offline.
  }
}

const persister = createSyncStoragePersister({ storage: phoneStorage(), key: QUERY_CACHE_KEY })

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <PersistQueryClientProvider
      client={queryClient}
      // The saved copy can be a little behind (it's written at most once a second), so check everything
      // once after restoring. Offline, these refetches pause and the saved data stays on screen.
      onSuccess={() => void queryClient.invalidateQueries()}
      persistOptions={{
        persister,
        maxAge: WEEK,
        buster: CACHE_VERSION,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' && PERSISTED.has(String(query.queryKey[0])),
        },
      }}
    >
      <AuthProvider>
        <LocalSettingsProvider>{children}</LocalSettingsProvider>
      </AuthProvider>
      <Toaster position="top-center" />
    </PersistQueryClientProvider>
  )
}
