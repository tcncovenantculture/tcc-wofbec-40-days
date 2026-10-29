import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

// Placeholder for screens built in later phases. Delete once every route has its real screen.
export function RouteStub({
  title,
  phase,
  children,
}: {
  title: string
  phase: number
  children?: ReactNode
}) {
  return (
    <main className="flex flex-1 flex-col justify-center gap-6">
      <Card className="shadow-card">
        <CardHeader>
          <h1 className="text-4xl">{title}</h1>
          <CardDescription className="text-base">This screen arrives in build phase {phase}.</CardDescription>
        </CardHeader>
        {children ? <CardContent className="text-base">{children}</CardContent> : null}
      </Card>
      <Link to="/" className="flex min-h-11 items-center self-center font-semibold text-orange-ink underline">
        Back to the start
      </Link>
    </main>
  )
}
