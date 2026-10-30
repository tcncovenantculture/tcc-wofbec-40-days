import { ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useDeleteAccount, useProfile, useSignOut } from '@/features/auth/api'
import { authErrorMessage } from '@/features/auth/errors'
import { useSetReminderEmail } from '@/features/reminders/api'
import { useLocalSettings } from '@/features/settings/use-local-settings'

export default function SettingsRoute() {
  const profile = useProfile()

  return (
    <main className="flex flex-col gap-6 py-2">
      <h1 className="text-5xl leading-none">Settings</h1>

      <section aria-label="Preferences" className="space-y-6 rounded-3xl bg-card p-5 shadow-card">
        <ReminderSetting />
        <TextOnlySetting />
      </section>

      <nav aria-label="More" className="overflow-hidden rounded-3xl bg-card shadow-card">
        <ul className="divide-y divide-border">
          {profile.data?.role === 'moderator' ? <RowLink to="/mod">Moderation</RowLink> : null}
          <RowLink to="/privacy">How we look after your information</RowLink>
        </ul>
      </nav>

      <SignOutButton />
      <DeleteAccount />
    </main>
  )
}

function RowLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <li>
      <Link to={to} className="flex min-h-14 items-center justify-between gap-3 px-5 font-semibold">
        {children}
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-soft" />
      </Link>
    </li>
  )
}

function ReminderSetting() {
  const profile = useProfile()
  const setReminder = useSetReminderEmail()

  return (
    <Field orientation="horizontal">
      <Checkbox
        id="reminder-email"
        checked={profile.data?.reminder_email ?? false}
        disabled={!profile.data}
        onCheckedChange={(checked) =>
          setReminder.mutate(checked === true, {
            onSuccess: (_data, on) => toast(on ? 'Morning reminders are on.' : 'Morning reminders are off.'),
            onError: () => toast.error('That didn’t save. Check your connection and try again.'),
          })
        }
        className="mt-1"
      />
      <FieldContent>
        <FieldLabel htmlFor="reminder-email" className="min-h-6 text-base font-semibold">
          Morning reminder email
        </FieldLabel>
        <FieldDescription className="text-base">
          A short, friendly email on mornings when there’s a new day to open. Turn it off any time, here or
          from the link in the email.
        </FieldDescription>
      </FieldContent>
    </Field>
  )
}

function TextOnlySetting() {
  const { textOnly, setTextOnly } = useLocalSettings()

  return (
    <Field orientation="horizontal">
      <Checkbox
        id="text-only"
        checked={textOnly}
        onCheckedChange={(checked) => setTextOnly(checked === true)}
        className="mt-1"
      />
      <FieldContent>
        <FieldLabel htmlFor="text-only" className="min-h-6 text-base font-semibold">
          Text only
        </FieldLabel>
        <FieldDescription className="text-base">
          Show pictures, audio and video as text to save data. Turns on by itself when your phone’s data saver
          is on.
        </FieldDescription>
      </FieldContent>
    </Field>
  )
}

function SignOutButton() {
  const signOut = useSignOut()
  const navigate = useNavigate()

  return (
    <Button
      variant="outline"
      size="lg"
      disabled={signOut.isPending}
      onClick={() =>
        signOut.mutate(undefined, {
          onSuccess: () => void navigate('/', { replace: true }),
          onError: (error) => toast.error(authErrorMessage(error)),
        })
      }
    >
      Sign out
    </Button>
  )
}

function DeleteAccount() {
  const [open, setOpen] = useState(false)
  const deleteAccount = useDeleteAccount()
  const navigate = useNavigate()

  const close = (next: boolean) => {
    if (deleteAccount.isPending) return
    setOpen(next)
    if (!next) deleteAccount.reset()
  }

  return (
    <>
      <Button variant="ghost" size="lg" className="text-destructive" onClick={() => setOpen(true)}>
        Delete my account
      </Button>

      <Sheet open={open} onOpenChange={close}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[90dvh] max-w-md overflow-y-auto rounded-t-3xl pb-[max(env(safe-area-inset-bottom),1.25rem)] text-base"
        >
          <SheetHeader className="pr-14">
            <SheetTitle className="text-3xl font-bold">Delete your account?</SheetTitle>
            <SheetDescription className="text-base text-ink-soft">This can’t be undone.</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            <ul className="list-disc space-y-1 pl-5">
              <li>Your profile, private reflections and progress are deleted straight away.</li>
              <li>You leave your pod.</li>
              <li>
                Messages you posted stay in your pod’s chat so conversations still make sense, shown as from
                “Former member”.
              </li>
            </ul>
            <p>You’re welcome to join again later with the same email.</p>

            {deleteAccount.isError ? (
              <p role="alert" className="text-destructive">
                That didn’t work. Check your connection and try again.
              </p>
            ) : null}

            <Button
              size="lg"
              variant="destructive"
              disabled={deleteAccount.isPending}
              onClick={() =>
                deleteAccount.mutate(undefined, {
                  onSuccess: () => {
                    toast('Your account has been deleted.')
                    void navigate('/', { replace: true })
                  },
                })
              }
            >
              {deleteAccount.isPending ? 'Deleting…' : 'Yes, delete my account'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              disabled={deleteAccount.isPending}
              onClick={() => close(false)}
            >
              Keep my account
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
