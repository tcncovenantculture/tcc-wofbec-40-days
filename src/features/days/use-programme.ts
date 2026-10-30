import { useEffect, useState } from 'react'
import { now, programmeDay, type ProgrammeDay } from '@/lib/programme'

/** The current time (or the ?asOf test date), refreshed every minute so screens roll over at midnight. */
export function useNow(intervalMs = 60_000): Date {
  const [time, setTime] = useState(now)
  useEffect(() => {
    const timer = setInterval(() => setTime(now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return time
}

export function useProgrammeDay(): ProgrammeDay {
  return programmeDay(useNow())
}
