import { AnnouncementCard } from '@/features/chat/components/announcement-card'
import { useProgrammeDay } from '@/features/days/use-programme'

/** Before pods form on Nov 13 (or for a late sign-up waiting to be placed): how pods work. */
export function NoPod() {
  const before = useProgrammeDay().phase === 'before'

  return (
    <main className="flex flex-col gap-6 py-2">
      <section className="space-y-3 rounded-3xl bg-card p-6 shadow-card">
        <p className="font-semibold text-ink-soft">Your pod</p>
        <h1 className="text-5xl leading-none">
          {before ? 'Your pod forms on 13 November' : 'Your pod is on its way'}
        </h1>
        <p>
          {before
            ? 'You’ll walk the 40 days with a pod of about five people at the same stage of life as you. Here’s how pods work.'
            : 'We’re adding you to a pod. You’ll see it here soon.'}
        </p>
      </section>

      <AnnouncementCard />

      <section aria-labelledby="how-pods-work" className="space-y-3 rounded-3xl bg-card p-6 shadow-card">
        <h2 id="how-pods-work" className="text-3xl">
          How pods work
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Each day has a question to talk about together. Short and honest is perfect.</li>
          <li>Your reflections stay private. You can choose to share one with your pod.</li>
          <li>
            One person in each pod is the facilitator: a friend in the pod, not staff, who helps keep things
            kind.
          </li>
          <li>Only your pod and the church’s moderators can see what’s posted.</li>
        </ul>
      </section>

      <figure className="space-y-3 rounded-2xl border-l-4 border-module bg-card p-5 shadow-card">
        <blockquote className="text-lg leading-relaxed">
          And they come unto him, bringing one sick of the palsy, which was borne of four. And when they could
          not come nigh unto him for the press, they uncovered the roof where he was: and when they had broken
          it up, they let down the bed wherein the sick of the palsy lay.
        </blockquote>
        <figcaption className="font-semibold text-module-ink">Mark 2:3–4 (KJV)</figcaption>
        <p className="text-ink-soft">
          Four friends carried him to Jesus when he couldn’t get there on his own. A pod carries each other
          like that.
        </p>
      </figure>
    </main>
  )
}
