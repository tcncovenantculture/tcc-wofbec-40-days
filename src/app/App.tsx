import { BrowserRouter } from 'react-router'
import { ErrorBoundary } from './error-boundary'
import { Providers } from './providers'
import { AppRoutes } from './router'

export function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </Providers>
    </ErrorBoundary>
  )
}
