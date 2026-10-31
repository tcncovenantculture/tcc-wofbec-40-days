import { Download, ExternalLink, MessageCircle } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { track } from '@/lib/analytics'
import { useSetWhatsAppLink, type MyPod } from '../api'
import { podPicture, savePodPicture } from '../pod-picture'
import { extractInviteLink } from '../whatsapp'

const NOTICE =
  'Everyone in a WhatsApp group can see each other’s phone numbers, and this app’s moderation doesn’t reach WhatsApp.'

/** The pod's optional WhatsApp group: set up by the facilitator, joined by members behind a notice. */
export function WhatsAppCard({ pod }: { pod: MyPod }) {
  if (pod.isFacilitator) return <FacilitatorCard pod={pod} />
  return pod.whatsappLink ? <JoinCard link={pod.whatsappLink} /> : null
}

function JoinCard({ link }: { link: string }) {
  const [asked, setAsked] = useState(false)

  return (
    <section aria-label="WhatsApp group" className="space-y-3 rounded-3xl bg-card p-5 shadow-card">
      {asked ? (
        <>
          <p className="font-semibold">Before you join</p>
          <p>{NOTICE}</p>
          <Button asChild size="lg">
            <a href={link} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp_joined')}>
              Join on WhatsApp
              <ExternalLink aria-hidden="true" />
            </a>
          </Button>
          <Button variant="outline" size="lg" onClick={() => setAsked(false)}>
            Not now
          </Button>
        </>
      ) : (
        <Button variant="outline" size="lg" onClick={() => setAsked(true)}>
          <MessageCircle aria-hidden="true" />
          Join the pod on WhatsApp
        </Button>
      )}
    </section>
  )
}

function FacilitatorCard({ pod }: { pod: MyPod }) {
  const save = useSetWhatsAppLink()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [invalid, setInvalid] = useState(false)
  const id = useId()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const link = extractInviteLink(value)
    setInvalid(!link)
    if (!link) return
    save.mutate(link, {
      onSuccess: () => {
        setEditing(false)
        setValue('')
      },
    })
  }

  if (pod.whatsappLink && !editing) {
    return (
      <section aria-labelledby={`${id}-heading`} className="space-y-3 rounded-3xl bg-card p-5 shadow-card">
        <h2 id={`${id}-heading`} className="flex items-center gap-2 text-2xl">
          <MessageCircle aria-hidden="true" className="size-6" />
          Your pod’s WhatsApp group
        </h2>
        <p className="text-ink-soft">
          Your pod can join from here. They’ll see a note about phone numbers first.
        </p>
        <Button asChild variant="outline" size="lg">
          <a href={pod.whatsappLink} target="_blank" rel="noopener noreferrer">
            Open the group
            <ExternalLink aria-hidden="true" />
          </a>
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setEditing(true)}>
            Change link
          </Button>
          <Button
            variant="ghost"
            className="flex-1"
            disabled={save.isPending}
            onClick={() => save.mutate(null)}
          >
            Remove link
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby={`${id}-heading`} className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
      <div className="space-y-1">
        <h2 id={`${id}-heading`} className="flex items-center gap-2 text-2xl">
          <MessageCircle aria-hidden="true" className="size-6" />
          Add your pod’s WhatsApp group
        </h2>
        <p className="text-ink-soft">
          Optional. If your pod would like to chat on WhatsApp too, you can set up the group.
        </p>
      </div>

      <details className="space-y-3">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-module-ink">
          How to set it up
        </summary>
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            Save the pod picture to use as the group icon.
            <PodPicture pod={pod} />
          </li>
          <li>In WhatsApp, create a new group called “{pod.name} pod” and set the picture.</li>
          <li>Open the group’s info, tap “Invite to group via link”, then “Copy link”.</li>
          <li>
            Paste the link below and save it. Before joining, your pod will see a note that everyone in a
            WhatsApp group can see each other’s phone numbers.
          </li>
        </ol>
      </details>

      <form onSubmit={submit} className="space-y-2" noValidate>
        <label htmlFor={id} className="font-semibold">
          Group invite link
        </label>
        <Input
          id={id}
          inputMode="url"
          autoComplete="off"
          placeholder="https://chat.whatsapp.com/…"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setInvalid(false)
          }}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
        />
        {invalid ? (
          <p id={`${id}-error`} className="text-destructive">
            That doesn’t look like a WhatsApp group link. It starts with https://chat.whatsapp.com/
          </p>
        ) : null}
        {save.isError ? (
          <p role="alert" className="text-destructive">
            That didn’t save. Check your connection and try again.
          </p>
        ) : null}
        <div className="flex gap-3 pt-1">
          <Button type="submit" className="flex-1" disabled={!value.trim() || save.isPending}>
            {save.isPending ? 'Saving…' : 'Save link'}
          </Button>
          {editing ? (
            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  )
}

function PodPicture({ pod }: { pod: MyPod }) {
  const [picture, setPicture] = useState<string | null>(null)
  useEffect(() => {
    let current = true
    podPicture(pod.name, pod.avatarSeed)
      .then((url) => {
        if (current) setPicture(url)
      })
      .catch(() => undefined)
    return () => {
      current = false
    }
  }, [pod.name, pod.avatarSeed])

  if (!picture) return null
  return (
    <div className="mt-2 flex items-center gap-4">
      <img src={picture} alt="" width={80} height={80} className="size-20 rounded-full" />
      <Button variant="outline" onClick={() => savePodPicture(picture, pod.name)}>
        <Download aria-hidden="true" />
        Save picture
      </Button>
    </div>
  )
}
