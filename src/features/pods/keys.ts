// Cache keys for pod data. In their own module so finishing a day can refresh the pod totals without
// loading the pod screen's code.
export const podKeys = {
  all: ['pod'] as const,
  mine: ['pod', 'mine'] as const,
  roster: ['pod', 'roster'] as const,
  allTotals: ['pod', 'totals'] as const,
  totals: (day: number) => ['pod', 'totals', day] as const,
  threadCounts: ['pod', 'thread-counts'] as const,
}
