import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { isLocal, signIn } from './support/local.ts'

// Accessibility (PLAN.md Phase 5): axe on every route, at WCAG 2.1 AA. Public pages run anywhere; signed-in
// pages need local Supabase (sign-in codes come from Mailpit).

async function expectNoViolations(page: Page, name: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const summary = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join('\n    ')}`,
  )
  expect(summary, `${name} has accessibility problems`).toEqual([])
}

const publicPages = [
  { name: 'landing', path: '/' },
  { name: 'sign-up', path: '/signup' },
  { name: 'sign-in', path: '/signup?mode=signin' },
  { name: 'privacy', path: '/privacy' },
  { name: 'unsubscribe', path: '/unsubscribe?token=00000000-0000-4000-8000-000000000000' },
  { name: 'not found', path: '/nowhere' },
]

for (const { name, path } of publicPages) {
  test(`${name} has no accessibility problems`, async ({ page }) => {
    await page.goto(path)
    await page.getByRole('heading', { level: 1 }).first().waitFor()
    await expectNoViolations(page, name)
  })
}

test.describe('signed in', () => {
  test.skip(!isLocal, 'Needs local Supabase and Mailpit to sign in')

  test('a participant’s screens have no accessibility problems', async ({ page }) => {
    // Ada (seed) facilitates the Rooftop pod. Day 4 of the programme, so days 1 to 4 are open.
    await signIn(page, 'ada@example.com')

    const screens: { name: string; path: string; ready: (page: Page) => Locator }[] = [
      // ?asOf sticks for the tab once a screen that reads the clock has seen it.
      { name: 'home', path: '/home?asOf=2026-11-17', ready: (p) => p.getByText('Hi, Ada') },
      {
        name: 'day (encounter)',
        path: '/day/1',
        ready: (p) => p.getByRole('button', { name: 'Next: Understand' }),
      },
      {
        name: 'day (understand)',
        path: '/day/1?step=understand',
        ready: (p) => p.getByRole('textbox').first(),
      },
      {
        name: 'synthesis day',
        path: '/day/8?asOf=2026-11-21',
        ready: (p) => p.getByText('Look back on this module'),
      },
      {
        name: 'my journey',
        path: '/journey?asOf=2026-11-17',
        ready: (p) => p.getByRole('heading', { name: 'Module 1' }),
      },
      { name: 'pod', path: '/pod', ready: (p) => p.getByRole('heading', { name: 'Rooftop' }) },
      { name: 'settings', path: '/settings', ready: (p) => p.getByText('Text only') },
      {
        name: 'avatar builder',
        path: '/avatar',
        ready: (p) => p.getByRole('heading', { name: 'Change your avatar' }),
      },
      { name: 'baseline questions', path: '/questions', ready: (p) => p.getByRole('heading', { level: 1 }) },
    ]
    for (const screen of screens) {
      await page.goto(screen.path)
      await screen.ready(page).waitFor()
      await expectNoViolations(page, screen.name)
    }
  })

  test('the moderators’ screen has no accessibility problems', async ({ page }) => {
    await signIn(page, 'moderator@example.com')
    await page.goto('/mod')
    await page.getByRole('heading', { level: 1 }).first().waitFor()
    await expectNoViolations(page, 'moderation')
  })
})
