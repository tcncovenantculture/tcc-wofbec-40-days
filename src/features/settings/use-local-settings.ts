import { createContext, use } from 'react'

export type LocalSettings = {
  /** Show media as text (alt text, transcripts) and load no images, audio or video. */
  textOnly: boolean
  setTextOnly: (on: boolean) => void
}

/** Provided by <LocalSettingsProvider>. */
export const LocalSettingsContext = createContext<LocalSettings | null>(null)

export function useLocalSettings(): LocalSettings {
  const settings = use(LocalSettingsContext)
  if (!settings) throw new Error('useLocalSettings must be used inside <LocalSettingsProvider>')
  return settings
}
