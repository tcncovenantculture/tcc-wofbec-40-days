import { useState } from 'react'

export type ShareableAnswer = { index: number; prompt: string; answer: string }

/** Which answer's share sheet is open, and which answers were shared while this screen was open. */
export function useShareState() {
  const [open, setOpen] = useState<ShareableAnswer | null>(null)
  // A new sheet for each answer, so its draft starts from that answer.
  const [sheetKey, setSheetKey] = useState(0)
  const [shared, setShared] = useState<number[]>([])
  return {
    open,
    sheetKey,
    shared,
    start: (answer: ShareableAnswer) => {
      setSheetKey((key) => key + 1)
      setOpen(answer)
    },
    close: () => setOpen(null),
    markShared: (index: number) => setShared((done) => (done.includes(index) ? done : [...done, index])),
  }
}
