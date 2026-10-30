import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  clearPendingCode,
  pendingFromState,
  readPendingCode,
  savePendingCode,
  useSendCode,
  useVerifyCode,
  type PendingCode,
} from '@/features/auth/api'
import { authErrorMessage } from '@/features/auth/errors'

const RESEND_AFTER_SECONDS = 60
const CODE_LENGTH = 6

export default function VerifyRoute() {
  const location = useLocation()
  const pending = pendingFromState(location.state) ?? readPendingCode()
  if (!pending) return <Navigate to="/signup" replace />
  return <VerifyForm initial={pending} />
}

function VerifyForm({ initial }: { initial: PendingCode }) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(initial)
  const [code, setCode] = useState('')
  const verify = useVerifyCode()
  const resend = useSendCode()
  // The clock ticks once a second, so right after a resend it can briefly read 61: cap it.
  const secondsLeft = Math.min(
    RESEND_AFTER_SECONDS,
    useSecondsUntil(pending.sentAt + RESEND_AFTER_SECONDS * 1000),
  )

  const submit = (token: string) => {
    if (token.length !== CODE_LENGTH || verify.isPending) return
    verify.mutate(
      { email: pending.email, token },
      {
        onSuccess: () => {
          clearPendingCode()
          void navigate('/home', { replace: true })
        },
      },
    )
  }

  const onCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH)
    setCode(digits)
    if (verify.isError) verify.reset()
    // Submit as soon as the sixth digit arrives, including when the phone autofills the code.
    if (digits.length === CODE_LENGTH) submit(digits)
  }

  const onResend = () => {
    resend.mutate(
      { mode: 'resend', email: pending.email },
      {
        onSuccess: () => {
          const next = { ...pending, sentAt: Date.now() }
          savePendingCode(next)
          setPending(next)
          setCode('')
          verify.reset()
          toast.success('We’ve sent you a new code.')
        },
      },
    )
  }

  const error = verify.error ?? resend.error

  return (
    <main className="flex flex-1 flex-col gap-8 py-2">
      <Link
        to={pending.mode === 'signin' ? '/signup?mode=signin' : '/signup'}
        className="-ml-2 inline-flex min-h-11 items-center gap-1 self-start px-2 font-semibold text-ink-soft"
      >
        <ArrowLeft aria-hidden="true" />
        Use a different email
      </Link>

      <header className="space-y-2">
        <h1 className="text-5xl leading-none">Check your email</h1>
        <p className="text-ink-soft">
          We sent a 6-digit code to <strong className="break-all text-ink">{pending.email}</strong>. It can
          take a minute to arrive, and it’s worth checking spam too.
        </p>
      </header>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit(code)
        }}
        className="space-y-6"
      >
        <Field data-invalid={verify.isError}>
          <FieldLabel htmlFor="code" className="text-base font-semibold">
            Your code
          </FieldLabel>
          <Input
            id="code"
            name="code"
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={CODE_LENGTH}
            autoFocus
            aria-invalid={verify.isError}
            aria-describedby="code-hint"
            className="h-16 text-center font-heading text-4xl font-bold tracking-[0.4em]"
          />
          <FieldDescription id="code-hint" className="text-base">
            The code works for an hour.
          </FieldDescription>
        </Field>

        {error ? (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-card p-3 text-destructive">
            {authErrorMessage(error)}
          </p>
        ) : null}

        <div className="space-y-2">
          <Button type="submit" size="lg" disabled={code.length !== CODE_LENGTH || verify.isPending}>
            {verify.isPending ? 'Checking…' : 'Continue'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={secondsLeft > 0 || resend.isPending}
            onClick={onResend}
          >
            {resend.isPending
              ? 'Sending…'
              : secondsLeft > 0
                ? `Send a new code in ${secondsLeft}s`
                : 'Send a new code'}
          </Button>
        </div>
      </form>
    </main>
  )
}

/** Whole seconds until `target` (a timestamp), updated once a second, never below 0. */
function useSecondsUntil(target: number): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  return Math.max(0, Math.ceil((target - now) / 1000))
}
