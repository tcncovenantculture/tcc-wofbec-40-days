import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { useUnsubscribe } from '@/features/reminders/api'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Where "Stop these emails" in a reminder lands (PLAN.md 4.3). Works without signing in. It waits for a tap
 * rather than unsubscribing on load, because some email services open every link in a message to check it.
 */
export default function UnsubscribeRoute() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const unsubscribe = useUnsubscribe()
  const valid = uuid.test(token)

  return (
    <main className="flex flex-1 flex-col justify-center gap-6">
      {!valid ? (
        <Message title="This link doesn’t look right">
          It may have been cut short. You can also turn reminders off in Settings once you’ve signed in.
        </Message>
      ) : unsubscribe.data === true ? (
        <Message title="Reminders are off">
          You won’t get morning reminder emails any more. Changed your mind? Turn them back on in Settings.
        </Message>
      ) : unsubscribe.data === false ? (
        <Message title="We couldn’t find that link">
          It may belong to an account that’s been deleted. You can also turn reminders off in Settings once
          you’ve signed in.
        </Message>
      ) : (
        <>
          <Message title="Stop reminder emails?">
            You’ll stop getting the morning reminder. Everything else stays as it is.
          </Message>
          {unsubscribe.isError ? (
            <p role="alert" className="text-destructive">
              That didn’t work. Check your connection and try again.
            </p>
          ) : null}
          <Button size="lg" disabled={unsubscribe.isPending} onClick={() => unsubscribe.mutate(token)}>
            {unsubscribe.isPending ? 'Stopping…' : 'Stop reminder emails'}
          </Button>
        </>
      )}
      <Link to="/" className="flex min-h-11 items-center self-center font-semibold text-orange-ink underline">
        Go to the 40 days
      </Link>
    </main>
  )
}

function Message({ title, children }: { title: string; children: string }) {
  return (
    <section className="space-y-3">
      <h1 className="text-5xl leading-none">{title}</h1>
      <p className="text-ink-soft">{children}</p>
    </section>
  )
}
