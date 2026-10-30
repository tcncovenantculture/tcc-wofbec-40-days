import { Shuffle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { useSaveAvatar } from '@/features/avatar/api'
import { UserAvatar } from '@/features/avatar/components/user-avatar'
import {
  avatarFor,
  builderRows,
  optionLabel,
  randomAvatar,
  seededAvatar,
  type AvatarChoice,
} from '@/features/avatar/options'
import { avatarDataUri } from '@/features/avatar/render'
import { markAvatarStepOffered } from '@/features/avatar/setup-step'
import { useProfile } from '@/features/auth/api'
import { useUserId } from '@/features/auth/use-auth'
import { cn } from '@/lib/utils'

// Where the first-time setup goes after the avatar step.
const AFTER_SETUP = '/home'

/**
 * The avatar builder (PLAN.md 3.3). Straight after someone first signs in (?setup=1, from home) and from
 * Settings. Each part is a row of options drawn as the avatar would look with it; nothing is saved until
 * "Save". "Skip" saves the seeded avatar everyone gets by default, so it never asks again.
 */
export default function AvatarRoute() {
  const [params] = useSearchParams()
  const setup = params.get('setup') === '1'
  const userId = useUserId()
  const profile = useProfile()
  const save = useSaveAvatar()
  const navigate = useNavigate()
  const [picked, setPicked] = useState<AvatarChoice | null>(null)
  const choice = picked ?? avatarFor(profile.data?.avatar, userId)
  const next = setup ? AFTER_SETUP : '/settings'

  useEffect(() => {
    if (setup) markAvatarStepOffered()
  }, [setup])

  // Long rows scroll sideways: start each one with its chosen option in view (once the saved avatar is known).
  const rows = useRef<HTMLDivElement>(null)
  const loaded = profile.data !== undefined
  useEffect(() => {
    if (!loaded) return
    for (const row of rows.current?.querySelectorAll<HTMLElement>('[data-row]') ?? []) {
      const chosen = row.querySelector<HTMLElement>('label:has(input:checked)')
      if (chosen) row.scrollLeft = chosen.offsetLeft - (row.clientWidth - chosen.clientWidth) / 2
    }
  }, [loaded])

  const saveAndGo = (avatar: AvatarChoice) =>
    save.mutate(avatar, { onSuccess: () => void navigate(next, { replace: setup }) })

  return (
    <main className="flex flex-col gap-6 py-2">
      <header className="space-y-2">
        <h1 className="text-5xl leading-none">{setup ? 'Make your avatar' : 'Change your avatar'}</h1>
        <p className="text-ink-soft">
          {setup
            ? 'Your pod sees it next to your name. You can change it any time in Settings.'
            : 'Your pod sees it next to your name.'}
        </p>
      </header>

      <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-5 shadow-card">
        <UserAvatar avatar={choice} userId={userId} className="size-36" />
        {profile.data ? <p className="font-heading text-2xl font-bold">{profile.data.display_name}</p> : null}
      </div>

      <div ref={rows} className="contents">
        {builderRows.map((row) => (
          <fieldset key={row.key} className="space-y-2">
            <legend className="mb-2 font-semibold">{row.label}</legend>
            {/* Scrolls sideways on its own, edge to edge, so long rows never widen the page. */}
            <div data-row="" className="relative -mx-5 flex gap-2 overflow-x-auto px-5 pt-1 pb-2">
              {row.options.map((option) => {
                const preview = { ...choice, [row.key]: option } as AvatarChoice
                const checked = choice[row.key] === option
                return (
                  <label
                    key={option}
                    className={cn(
                      'relative shrink-0 cursor-pointer rounded-full p-1 ring-2 ring-transparent has-focus-visible:ring-ring',
                      checked && 'ring-orange-ink',
                    )}
                  >
                    <input
                      type="radio"
                      name={row.key}
                      value={option}
                      checked={checked}
                      onChange={() => setPicked(preview)}
                      aria-label={optionLabel(row.key, option)}
                      className="sr-only"
                    />
                    <img
                      src={avatarDataUri(preview)}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 rounded-full"
                    />
                  </label>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="space-y-2">
        {save.isError ? (
          <p role="alert" className="text-destructive">
            That didn’t save. Check your connection and try again.
          </p>
        ) : null}
        <Button size="lg" disabled={save.isPending} onClick={() => saveAndGo(choice)}>
          {save.isPending ? 'Saving…' : 'Save my avatar'}
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={save.isPending}
          onClick={() => setPicked(randomAvatar())}
        >
          <Shuffle aria-hidden="true" />
          Surprise me
        </Button>
        {setup ? (
          <Button
            size="lg"
            variant="ghost"
            disabled={save.isPending}
            // Moves on even if the save fails (offline): everyone without a saved avatar is shown this same
            // seeded one anyway, and home only offers the builder once per session.
            onClick={() =>
              save.mutate(seededAvatar(userId), { onSettled: () => void navigate(next, { replace: true }) })
            }
          >
            Skip for now
          </Button>
        ) : (
          <Button asChild size="lg" variant="ghost">
            <Link to="/settings">Cancel</Link>
          </Button>
        )}
      </div>

      <p className="text-center text-ink-soft">
        Avatar art: “Custom Avatar” by Ashley Seo,{' '}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center underline"
        >
          CC BY 4.0
        </a>
      </p>
    </main>
  )
}
