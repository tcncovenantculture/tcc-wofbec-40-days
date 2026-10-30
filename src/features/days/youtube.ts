// No imports, so screens can use it without pulling in zod. The content schema uses it too.

/** The video id from a YouTube link (watch, youtu.be, embed or shorts), or null. */
export function youtubeId(url: string): string | null {
  try {
    const { hostname, pathname, searchParams } = new URL(url)
    const host = hostname.replace(/^(www\.|m\.)/, '')
    const id =
      host === 'youtu.be'
        ? pathname.slice(1)
        : host === 'youtube.com' || host === 'youtube-nocookie.com'
          ? (searchParams.get('v') ?? pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] ?? null)
          : null
    return id && /^[\w-]{11}$/.test(id) ? id : null
  } catch {
    return null
  }
}
