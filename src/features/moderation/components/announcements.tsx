import { useQueryClient } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MAX_MESSAGE_LENGTH, useHideMessage } from '@/features/chat/api'
import { formatMessageTime } from '@/features/chat/format'
import { moderationKeys, usePostAnnouncement, useRecentAnnouncements } from '../api'

/** Post an announcement to every pod (shown above each pod's tabs), and hide a recent one if needed. */
export function Announcements({ now }: { now: Date }) {
  const post = usePostAnnouncement()
  const recent = useRecentAnnouncements()
  const hide = useHideMessage()
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')
  const [confirming, setConfirming] = useState(false)
  const id = useId()
  const text = body.trim()

  return (
    <section aria-labelledby={`${id}-heading`} className="space-y-4">
      <div>
        <h2 id={`${id}-heading`} className="text-3xl">
          Announcement to every pod
        </h2>
        <p className="text-ink-soft">It shows at the top of every pod’s screen, newest first.</p>
      </div>

      <form
        className="space-y-3 rounded-3xl bg-card p-5 shadow-card"
        onSubmit={(event) => {
          event.preventDefault()
          if (!text) return
          if (!confirming) {
            setConfirming(true)
            return
          }
          post.mutate(text, {
            onSuccess: () => {
              setBody('')
              setConfirming(false)
              toast('Announcement posted')
            },
          })
        }}
      >
        <label htmlFor={id} className="font-semibold">
          What do you want to tell every pod?
        </label>
        <Textarea
          id={id}
          rows={4}
          maxLength={MAX_MESSAGE_LENGTH}
          value={body}
          onChange={(event) => {
            setBody(event.target.value)
            setConfirming(false)
          }}
        />
        {post.isError ? (
          <p role="alert" className="text-destructive">
            That didn’t post. Check your connection and try again.
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={!text || post.isPending}>
          {post.isPending ? 'Posting…' : confirming ? 'Yes, post it to every pod' : 'Post announcement'}
        </Button>
        {confirming ? (
          <Button type="button" size="lg" variant="outline" onClick={() => setConfirming(false)}>
            Not yet
          </Button>
        ) : null}
      </form>

      {recent.data && recent.data.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-2xl">Recent announcements</h3>
          <ul className="space-y-2">
            {recent.data.map((announcement) => (
              <li key={announcement.id} className="space-y-2 rounded-2xl bg-card p-4 shadow-card">
                <p className="text-ink-soft">
                  {formatMessageTime(announcement.createdAt, now)}
                  {announcement.hidden ? ' · hidden' : ''}
                </p>
                <p className="break-words whitespace-pre-wrap">{announcement.body}</p>
                {announcement.hidden ? null : (
                  <Button
                    variant="outline"
                    disabled={hide.isPending}
                    onClick={() =>
                      hide.mutate(
                        { ...announcement, podId: null, day: null, authorId: null, kind: 'announcement' },
                        {
                          onSuccess: () => {
                            void queryClient.invalidateQueries({ queryKey: moderationKeys.announcements })
                            toast('Announcement hidden')
                          },
                        },
                      )
                    }
                  >
                    Hide
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
