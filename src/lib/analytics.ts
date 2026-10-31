import type { Enums, Json } from './database.types'
import { supabase } from './supabase'

// Usage events for the project team's counts (PLAN.md Phase 5; views in the analytics schema, read in
// Studio). No third-party trackers. Best effort: an event that can't be sent (offline, say) is dropped, and
// it never slows anything down or shows an error. Never put message text or answers in `props`.

export type EventName = Enums<'event_name'>

export function track(name: EventName, props: Record<string, Json> = {}): void {
  void supabase
    .from('events')
    .insert({ name, props })
    .then(
      () => undefined,
      () => undefined,
    )
}
