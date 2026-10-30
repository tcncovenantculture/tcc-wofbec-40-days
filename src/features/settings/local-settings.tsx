import { useMemo, useState, type ReactNode } from 'react'
import { LocalSettingsContext, type LocalSettings } from './use-local-settings'

// Per-phone settings in localStorage. Not synced: text-only mode is about this phone's data, not the person.

const TEXT_ONLY_KEY = 'c40.textOnly'

/** Data Saver (Android Chrome) turns text-only mode on unless the person has chosen otherwise. */
function saveDataOn(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return connection?.saveData === true
}

function initialTextOnly(): boolean {
  try {
    const stored = localStorage.getItem(TEXT_ONLY_KEY)
    if (stored !== null) return stored === 'true'
  } catch {
    // Storage blocked: fall back to Data Saver
  }
  return saveDataOn()
}

export function LocalSettingsProvider({ children }: { children: ReactNode }) {
  const [textOnly, setTextOnlyState] = useState(initialTextOnly)

  const value = useMemo<LocalSettings>(
    () => ({
      textOnly,
      setTextOnly: (on) => {
        setTextOnlyState(on)
        try {
          localStorage.setItem(TEXT_ONLY_KEY, String(on))
        } catch {
          // Lasts until the app is closed
        }
      },
    }),
    [textOnly],
  )

  return <LocalSettingsContext value={value}>{children}</LocalSettingsContext>
}
