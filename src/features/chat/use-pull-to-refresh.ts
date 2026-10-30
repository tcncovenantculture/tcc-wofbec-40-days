import { useEffect, useEffectEvent, useRef, useState } from 'react'

const THRESHOLD = 72 // px pulled before letting go refreshes
const MAX = 96

/**
 * Pull down at the top of the page to refresh. The installed app has no browser pull-to-refresh, so this
 * stands in for it (and switches the browser's own off while mounted, so the page doesn't reload). The
 * indicator is moved directly, not through React state, to stay smooth on low-end phones.
 */
export function usePullToRefresh(onRefresh: () => Promise<unknown>) {
  const indicatorRef = useRef<HTMLDivElement>(null)
  const [refreshing, setRefreshing] = useState(false)
  const refresh = useEffectEvent(() => {
    setRefreshing(true)
    void onRefresh().finally(() => setRefreshing(false))
  })

  useEffect(() => {
    let startY: number | null = null
    let distance = 0
    const show = (px: number) => {
      const el = indicatorRef.current
      if (!el) return
      el.style.height = `${px}px`
      el.dataset.ready = px >= THRESHOLD ? 'true' : 'false'
    }
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      startY = window.scrollY <= 0 && event.touches.length === 1 && touch ? touch.clientY : null
      distance = 0
    }
    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (startY === null || !touch) return
      distance = Math.max(0, touch.clientY - startY)
      show(Math.min(distance, MAX))
    }
    const onEnd = () => {
      if (startY !== null && distance >= THRESHOLD) refresh()
      startY = null
      distance = 0
      show(0)
    }

    const root = document.documentElement
    const previous = root.style.overscrollBehaviorY
    root.style.overscrollBehaviorY = 'contain'
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      root.style.overscrollBehaviorY = previous
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  return { indicatorRef, refreshing }
}
