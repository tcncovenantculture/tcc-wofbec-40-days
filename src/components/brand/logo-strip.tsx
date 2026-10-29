import { cn } from 'cn'

// The five logo colours, in order. For special moments only: day 8, module complete, pod scene.
const segments = ['bg-purple', 'bg-green', 'bg-yellow', 'bg-amber', 'bg-coral'] as const

export function LogoStrip({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex h-2 w-full gap-1', className)}>
      {segments.map((colour) => (
        <span key={colour} className={cn('flex-1 rounded-full', colour)} />
      ))}
    </div>
  )
}
