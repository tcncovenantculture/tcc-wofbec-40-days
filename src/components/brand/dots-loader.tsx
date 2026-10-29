import { cn } from 'cn'

const dots = [
  { colour: 'bg-purple', delay: '0ms' },
  { colour: 'bg-green', delay: '120ms' },
  { colour: 'bg-yellow', delay: '240ms' },
  { colour: 'bg-amber', delay: '360ms' },
  { colour: 'bg-coral', delay: '480ms' },
] as const

export function DotsLoader({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center gap-1.5', className)}>
      {dots.map(({ colour, delay }) => (
        <span
          key={colour}
          aria-hidden="true"
          className={cn('size-2.5 animate-dot-bounce rounded-full motion-reduce:animate-none', colour)}
          style={{ animationDelay: delay }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}
