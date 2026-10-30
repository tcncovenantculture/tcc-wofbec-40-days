import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { savePendingCode, useSendCode, type AuthMode } from '@/features/auth/api'
import { authErrorMessage } from '@/features/auth/errors'
import {
  segmentOptions,
  signinSchema,
  signupSchema,
  type SigninValues,
  type SignupInput,
  type SignupValues,
} from '@/features/auth/schema'

export default function SignupRoute() {
  const [params] = useSearchParams()
  return params.get('mode') === 'signin' ? <SigninForm /> : <SignupForm />
}

function useCodeSent(mode: AuthMode) {
  const navigate = useNavigate()
  return (email: string) => {
    const pending = { email, mode, sentAt: Date.now() }
    savePendingCode(pending)
    void navigate('/verify', { state: pending })
  }
}

function SignupForm() {
  const sendCode = useSendCode()
  const onCodeSent = useCodeSent('signup')
  const form = useForm<SignupInput, unknown, SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
    defaultValues: {
      display_name: '',
      email: '',
      whatsapp_number: '',
      privacy: false,
      reminder_email: false,
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    sendCode.mutate({ mode: 'signup', values }, { onSuccess: onCodeSent })
  })

  return (
    <main className="flex flex-1 flex-col gap-8 py-2">
      <BackLink />
      <header className="space-y-2">
        <h1 className="text-5xl leading-none">Join the 40 days</h1>
        <p className="text-ink-soft">
          It takes about a minute. We’ll email you a code to sign in, so there’s no password.
        </p>
      </header>

      <form noValidate onSubmit={(event) => void onSubmit(event)} className="space-y-8">
        <FieldGroup>
          <Controller
            name="display_name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="display_name" className="text-base font-semibold">
                  Your name
                </FieldLabel>
                <Input
                  {...field}
                  id="display_name"
                  autoComplete="name"
                  maxLength={40}
                  aria-invalid={fieldState.invalid}
                  aria-describedby="display_name-hint"
                />
                <FieldDescription id="display_name-hint" className="text-base">
                  This is what your pod will see.
                </FieldDescription>
                <FieldError className="text-base" errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="segment"
            control={form.control}
            render={({ field, fieldState }) => (
              <FieldSet data-invalid={fieldState.invalid}>
                <FieldLegend className="text-base font-semibold">Which fits you best?</FieldLegend>
                <FieldDescription className="text-base">
                  Your pod will be people at a similar stage of life.
                </FieldDescription>
                <RadioGroup
                  name={field.name}
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                >
                  {segmentOptions.map((option) => (
                    <FieldLabel
                      key={option.value}
                      htmlFor={`segment-${option.value}`}
                      className="bg-card has-data-checked:border-primary"
                    >
                      <Field orientation="horizontal" className="min-h-16">
                        <FieldContent>
                          <FieldTitle className="text-base font-semibold">{option.label}</FieldTitle>
                          <FieldDescription className="text-base">{option.hint}</FieldDescription>
                        </FieldContent>
                        <RadioGroupItem
                          value={option.value}
                          id={`segment-${option.value}`}
                          onBlur={field.onBlur}
                        />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
                <FieldError className="text-base" errors={[fieldState.error]} />
              </FieldSet>
            )}
          />

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email" className="text-base font-semibold">
                  Email
                </FieldLabel>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={fieldState.invalid}
                  aria-describedby="email-hint"
                />
                <FieldDescription id="email-hint" className="text-base">
                  We’ll send your sign-in code here.
                </FieldDescription>
                <FieldError className="text-base" errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="whatsapp_number"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="whatsapp_number" className="text-base font-semibold">
                  WhatsApp number <span className="font-normal text-ink-soft">(optional)</span>
                </FieldLabel>
                <Input
                  {...field}
                  id="whatsapp_number"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0803 123 4567"
                  aria-invalid={fieldState.invalid}
                  aria-describedby="whatsapp_number-hint"
                />
                <FieldDescription id="whatsapp_number-hint" className="text-base">
                  Your pod won’t see it. Only the project team can.
                </FieldDescription>
                <FieldError className="text-base" errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="privacy"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                <Checkbox
                  id="privacy"
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                  className="mt-1"
                />
                <FieldContent>
                  <FieldLabel htmlFor="privacy" className="min-h-6 text-base font-normal">
                    I’ve read how my information is used and kept
                  </FieldLabel>
                  <FieldDescription className="text-base">
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener"
                      className="inline-flex min-h-11 items-center"
                    >
                      Read the privacy notice
                    </a>
                  </FieldDescription>
                  <FieldError className="text-base" errors={[fieldState.error]} />
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            name="reminder_email"
            control={form.control}
            render={({ field }) => (
              <Field orientation="horizontal">
                <Checkbox
                  id="reminder_email"
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  onBlur={field.onBlur}
                  className="mt-1"
                />
                <FieldContent>
                  <FieldLabel htmlFor="reminder_email" className="min-h-6 text-base font-normal">
                    Send me a friendly email reminder in the morning
                  </FieldLabel>
                  <FieldDescription className="text-base">
                    Optional. You can turn it off any time.
                  </FieldDescription>
                </FieldContent>
              </Field>
            )}
          />
        </FieldGroup>

        <SubmitArea
          error={sendCode.error}
          pending={sendCode.isPending}
          footer={
            <>
              Already joined? <InlineLink to="/signup?mode=signin">Sign in</InlineLink>
            </>
          }
        />
      </form>
    </main>
  )
}

function SigninForm() {
  const sendCode = useSendCode()
  const onCodeSent = useCodeSent('signin')
  const form = useForm<SigninValues>({
    resolver: zodResolver(signinSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  })

  const onSubmit = form.handleSubmit(({ email }) => {
    sendCode.mutate({ mode: 'signin', email }, { onSuccess: onCodeSent })
  })

  return (
    <main className="flex flex-1 flex-col gap-8 py-2">
      <BackLink />
      <header className="space-y-2">
        <h1 className="text-5xl leading-none">Welcome back</h1>
        <p className="text-ink-soft">Enter the email you joined with and we’ll send you a code.</p>
      </header>

      <form noValidate onSubmit={(event) => void onSubmit(event)} className="space-y-8">
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email" className="text-base font-semibold">
                Email
              </FieldLabel>
              <Input
                {...field}
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={fieldState.invalid}
              />
              <FieldError className="text-base" errors={[fieldState.error]} />
            </Field>
          )}
        />

        <SubmitArea
          error={sendCode.error}
          pending={sendCode.isPending}
          footer={
            <>
              New here? <InlineLink to="/signup">Join the 40 days</InlineLink>
            </>
          }
        />
      </form>
    </main>
  )
}

function SubmitArea({
  error,
  pending,
  footer,
}: {
  error: Error | null
  pending: boolean
  footer: ReactNode
}) {
  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-card p-3 text-destructive">
          {authErrorMessage(error)}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'Sending your code…' : 'Send my code'}
      </Button>
      <p className="flex flex-wrap items-center justify-center gap-1 text-ink-soft">{footer}</p>
    </div>
  )
}

function InlineLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center font-semibold text-orange-ink underline">
      {children}
    </Link>
  )
}

function BackLink() {
  return (
    <Link
      to="/"
      className="-ml-2 inline-flex min-h-11 items-center gap-1 self-start px-2 font-semibold text-ink-soft"
    >
      <ArrowLeft aria-hidden="true" />
      Back
    </Link>
  )
}
