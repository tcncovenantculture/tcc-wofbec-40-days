// The baseline questions (PLAN.md 3.4). **SAMPLE WORDING**: the project lead's wording hasn't arrived
// (docs/SETUP-TODO.md). Replace the `question` and scale labels here when it does, and drop the "Sample:"
// prefix. Keep the keys: they're the database columns.

export type BaselineKey = 'career' | 'character' | 'community'

export const baselineQuestions: { key: BaselineKey; dimension: string; question: string }[] = [
  {
    key: 'career',
    dimension: 'Career',
    question: 'Sample: How much does your faith shape the way you study or work?',
  },
  {
    key: 'character',
    dimension: 'Character',
    question: 'Sample: How much time do you make to grow in your walk with God?',
  },
  {
    key: 'community',
    dimension: 'Community',
    question: 'Sample: How connected do you feel to people who help you grow in faith?',
  },
]

/** What 1 and 5 mean on the scale. */
export const scaleEnds = { low: 'Not at all', high: 'A great deal' }

export const MAX_NOTE = 1000 // matches the database check
