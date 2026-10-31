import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/features/auth/use-auth'

// The privacy notice (PLAN.md 3.2). Open to everyone, signed in or not; the sign-up form links here.
// It needs a human check against Nigeria's NDPA before Nov 8 (docs/SETUP-TODO.md). Keep it in step with what
// the app really collects: update it whenever a table or an email changes.

const CONTACT = '[contact email to come]'

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = title.toLowerCase().replace(/[^a-z]+/g, '-')
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-3xl">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function PrivacyRoute() {
  const auth = useAuth()
  const back = auth.status === 'signed-in' ? { to: '/settings', label: 'Back to settings' } : null

  return (
    <main className="flex flex-col gap-8 py-2">
      <header className="space-y-3">
        <h1 className="text-5xl leading-none">How we look after your information</h1>
        <p className="text-lg">
          The Covenant Culture 40 Days asks for as little as it can, keeps your reflections private, and
          deletes everything after the programme.
        </p>
      </header>

      <Section title="What we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>When you join:</strong> your name, which stage of life fits you (undergraduate, early
            career, experienced professional or entrepreneur), your email address, and your WhatsApp number if
            you choose to give it.
          </li>
          <li>
            <strong>Your choices:</strong> whether you want a morning reminder email, and the avatar you make.
          </li>
          <li>
            <strong>As you go:</strong> your answers to each day’s questions (your reflections), which days
            you’ve finished, and the messages you post in your pod. The app also notes when you open or finish
            a day, post or share in your pod, or join its WhatsApp group (never what you wrote), so the team
            can count how the programme is going.
          </li>
          <li>
            <strong>If you choose to answer them:</strong> three short questions about where you are at the
            start (and again at the end), on a scale of 1 to 5, with an optional note.
          </li>
          <li>
            <strong>If you report a message:</strong> the reason you give.
          </li>
        </ul>
        <p>We don’t ask your age, and we don’t use advertising or tracking services.</p>
      </Section>

      <Section title="Why we collect it">
        <ul className="list-disc space-y-2 pl-5">
          <li>Your email lets you sign in with a code, so there’s no password to remember.</li>
          <li>
            Your stage of life puts you in a pod of about five people at a similar stage. Your name and avatar
            are how your pod knows you.
          </li>
          <li>
            Your progress shows you how far you’ve come, and lets your pod see a total like “4 of 5 done
            today”, never who.
          </li>
          <li>
            Your WhatsApp number, if you give it, is a way for the project team to reach you. Your pod doesn’t
            see it.
          </li>
          <li>
            We only send reminder emails if you ask for them. We also email you once when your pod is formed.
          </li>
        </ul>
        <p>
          We use your information only to run the 40 days. We never sell it or share it for marketing. You
          agree to this when you join, and you can change your mind at any time (see “Your choices” below).
        </p>
      </Section>

      <Section title="Who can see what">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Your reflections:</strong> only you. The app never shows them to anyone else: not your
            pod, not its facilitator, not church leaders. If you choose to share one with your pod, a copy
            goes into the pod chat; the original stays private.
          </li>
          <li>
            <strong>Your pod messages:</strong> the people in your pod, and the church leaders who moderate
            the chat. Moderators can read messages that have been hidden, so they can keep everyone safe.
          </li>
          <li>
            <strong>Your name and avatar:</strong> your pod, and moderators when they look at a reported
            message.
          </li>
          <li>
            <strong>Your email and WhatsApp number:</strong> the small project team who run the programme.
          </li>
          <li>
            <strong>Your answers to the start and end questions:</strong> the project team, who look at them
            as totals to learn how the 40 days help. Nobody in your pod sees them.
          </li>
          <li>
            <strong>Reports:</strong> moderators see the reason given but not who reported. Your pod’s
            facilitator sees that a message in your pod was reported, and why, but never who reported it.
          </li>
        </ul>
        <p>
          If your pod sets up a WhatsApp group, that’s outside this app: everyone in the group can see each
          other’s phone numbers, and our moderation doesn’t reach it.
        </p>
      </Section>

      <Section title="Where it’s kept">
        <p>
          There’s no hosting for this kind of app in Nigeria yet, so your information is stored outside
          Nigeria. Our database is run by Supabase on servers in London, United Kingdom. The app itself is
          delivered by Vercel, and emails are sent through Resend. They store and process information for us
          only to provide their service, and connections to them are encrypted.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          The 40 days lead into WOFBEC on 2 January 2027. We delete everyone’s information 90 days after that,
          by 2 April 2027, unless the project lead decides a different period and we update this notice first.
        </p>
      </Section>

      <Section title="Your choices">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Reminders:</strong> turn them on or off in Settings, or from the link at the bottom of any
            reminder email.
          </li>
          <li>
            <strong>Delete your account:</strong> Settings, then “Delete my account”. Your profile,
            reflections and progress are deleted straight away and you leave your pod. Messages you posted
            stay in your pod’s chat, shown as from “Former member”, so conversations still make sense. If you
            want a message removed as well, email us.
          </li>
          <li>
            <strong>A copy or a correction:</strong> email us and we’ll send you what we hold about you, or
            fix anything that’s wrong.
          </li>
        </ul>
        <p>
          If you’re unhappy with how we’ve handled your information, please tell us first. You can also
          complain to the Nigeria Data Protection Commission.
        </p>
      </Section>

      <Section title="On your phone">
        <p>
          The app saves your sign-in and the days you’ve opened on your phone, so it works on weak data and
          offline. Signing out removes them. Your reflections are never saved there.
        </p>
      </Section>

      <Section title="Credits">
        <p>
          Avatars are drawn on your phone with DiceBear’s Big Smile style, based on{' '}
          <a href="https://www.figma.com/community/file/881358461963645496" className="underline">
            “Custom Avatar”
          </a>{' '}
          by Ashley Seo, licensed under{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" className="underline">
            CC BY 4.0
          </a>
          .
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions, requests or worries: <strong>{CONTACT}</strong>
        </p>
      </Section>

      <p className="text-ink-soft">Last updated 30 October 2026.</p>

      <footer className="flex justify-center">
        {back ? (
          <Link
            to={back.to}
            className="inline-flex min-h-11 items-center font-semibold text-orange-ink underline"
          >
            {back.label}
          </Link>
        ) : (
          <a href="/" className="inline-flex min-h-11 items-center font-semibold text-orange-ink underline">
            Back to the start
          </a>
        )}
      </footer>
    </main>
  )
}
