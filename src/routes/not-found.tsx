import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export default function NotFoundRoute() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-5xl">Page not found</h1>
      <p className="text-ink-soft">We couldn't find that page. It may have moved.</p>
      <Button asChild>
        <Link to="/">Go to the start</Link>
      </Button>
    </main>
  )
}
