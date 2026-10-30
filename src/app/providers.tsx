import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/features/auth/session'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Weak data: don't refetch on every screen change; retry a couple of times before showing an error.
        staleTime: 60_000,
        retry: 2,
      },
    },
  })
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster position="top-center" />
    </QueryClientProvider>
  )
}
