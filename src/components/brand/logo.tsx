import markUrl from '@/assets/brand/logo-mark.webp'
import logoUrl from '@/assets/brand/logo.webp'

// Cut from a 1080px graphic (scripts/extract-logo.ts) until the original logo files arrive, so keep it
// small: sharp up to about 208px wide for the full logo (landing page only) and 70px for the mark.
const sources = {
  full: { src: logoUrl, width: 416, height: 118 },
  mark: { src: markUrl, width: 142, height: 143 },
} as const

interface LogoProps {
  /** full: mark and "Covenant Culture" wordmark. mark: the circle of people only. */
  variant?: keyof typeof sources
  /** Set the width (e.g. w-52); height follows. */
  className?: string
}

export function Logo({ variant = 'full', className }: LogoProps) {
  const { src, width, height } = sources[variant]
  return (
    <img
      src={src}
      width={width}
      height={height}
      alt="Covenant Culture"
      decoding="async"
      // A plain join, not cn(): the landing page loads this and has no room for a class-merging library.
      className={className ? `h-auto ${className}` : 'h-auto'}
    />
  )
}
