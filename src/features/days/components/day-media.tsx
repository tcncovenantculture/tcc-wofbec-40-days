import { Play, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useLocalSettings } from '@/features/settings/use-local-settings'
import type { Media } from '../schema'
import { youtubeId } from '../youtube'

// Media is optional and always has a text version. In text-only mode nothing is requested: images become
// their alt text, and audio and video become their transcripts.

/** Content files may give a Storage path ("media/module-1/day-1.webp") or a full URL. */
function mediaUrl(url: string): string {
  return /^https?:\/\//.test(url)
    ? url
    : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${url}`
}

export function DayMedia({ items }: { items: Media[] }) {
  const { textOnly } = useLocalSettings()
  if (items.length === 0) return null
  return (
    <div className="space-y-6">
      {items.map((item) => (
        <MediaItem key={item.url} item={item} textOnly={textOnly} />
      ))}
    </div>
  )
}

function MediaItem({ item, textOnly }: { item: Media; textOnly: boolean }) {
  switch (item.type) {
    case 'image':
      return textOnly ? (
        <TextVersion label="Image" ai={item.ai_generated}>
          {item.alt}
        </TextVersion>
      ) : (
        <figure className="space-y-2">
          <img
            src={mediaUrl(item.url)}
            alt={item.alt}
            loading="lazy"
            decoding="async"
            className="w-full rounded-2xl bg-shimmer"
          />
          {item.ai_generated ? <AiLabel /> : null}
        </figure>
      )
    case 'audio':
      return textOnly ? (
        <TextVersion label={item.caption ?? 'Audio'} ai={item.ai_generated}>
          {item.transcript}
        </TextVersion>
      ) : (
        <figure className="space-y-2">
          {item.caption ? <figcaption className="font-semibold">{item.caption}</figcaption> : null}
          <audio controls preload="none" src={mediaUrl(item.url)} className="w-full" />
          {item.ai_generated ? <AiLabel /> : null}
          <Transcript>{item.transcript}</Transcript>
        </figure>
      )
    case 'video':
      return textOnly ? (
        <TextVersion label={item.caption} ai={item.ai_generated}>
          {item.transcript}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex min-h-11 items-center font-semibold text-module-ink underline"
          >
            Watch on YouTube
          </a>
        </TextVersion>
      ) : (
        <figure className="space-y-2">
          <VideoFacade url={item.url} caption={item.caption} />
          <figcaption className="font-semibold">{item.caption}</figcaption>
          {item.ai_generated ? <AiLabel /> : null}
          <Transcript>{item.transcript}</Transcript>
        </figure>
      )
  }
}

/**
 * Only a thumbnail until tapped, so YouTube's player (about 1 MB) loads only for people who want it.
 * youtube-nocookie keeps YouTube from setting cookies until the video plays.
 */
function VideoFacade({ url, caption }: { url: string; caption: string }) {
  const [playing, setPlaying] = useState(false)
  const id = youtubeId(url)
  if (!id) return null

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={caption}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-2xl bg-ink"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="relative block aspect-video w-full overflow-hidden rounded-2xl bg-ink"
    >
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-16 place-items-center rounded-full bg-cta text-white shadow-cta">
          <Play aria-hidden="true" className="size-7 fill-current" />
        </span>
      </span>
      <span className="sr-only">Play video: {caption}</span>
    </button>
  )
}

function Transcript({ children }: { children: string }) {
  return (
    <details className="rounded-xl bg-card px-4">
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-module-ink">
        Read the transcript
      </summary>
      <p className="pb-4 whitespace-pre-line">{children}</p>
    </details>
  )
}

function TextVersion({ label, ai, children }: { label: string; ai: boolean; children: ReactNode }) {
  return (
    <div className="space-y-1 rounded-xl bg-shimmer p-4">
      <p className="font-semibold">{label}</p>
      <div className="whitespace-pre-line">{children}</div>
      {ai ? <AiLabel /> : null}
    </div>
  )
}

/** Required on every AI-generated image, audio clip or video (rule 10 of the brief). */
function AiLabel() {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-semibold text-ink-soft">
      <Sparkles aria-hidden="true" className="size-4" />
      AI-generated
    </p>
  )
}
