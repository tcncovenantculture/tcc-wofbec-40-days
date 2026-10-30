import { cn } from '@/lib/utils'
import { DAYS_PER_MODULE, LESSON_DAYS } from '@/lib/programme'

const modules = Array.from({ length: LESSON_DAYS / DAYS_PER_MODULE }, (_, i) => i + 1)

/**
 * The 40 days as dots in five module groups. Done days are filled, today is outlined, open days are
 * tinted and future days are grey. Only the person sees this; it never compares people.
 */
export function ProgressStrip({ today, done }: { today: number; done: Set<number> }) {
  return (
    <div aria-hidden="true" className="flex gap-1.5">
      {modules.map((module) => (
        <div key={module} data-module={module} className="flex flex-1 items-center gap-0.5">
          {Array.from({ length: DAYS_PER_MODULE }, (_, i) => {
            const day = (module - 1) * DAYS_PER_MODULE + i + 1
            return (
              <span
                key={day}
                className={cn(
                  'h-2.5 flex-1 rounded-full',
                  done.has(day)
                    ? 'bg-module'
                    : day === today
                      ? 'h-3.5 bg-card ring-2 ring-module-ink'
                      : day < today
                        ? 'bg-module/30'
                        : 'bg-border',
                )}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
