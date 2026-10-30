import { expect, test } from '@playwright/test'

// Placeholder until the Phase 5 smoke test (sign up → verify → avatar → home → complete day → pod).
test('landing page loads on its own, with a way to join', async ({ page }) => {
  // The landing page must stay light (under 100 KB): it never loads the full app or the Supabase client.
  const heavy: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (/\/App(-[\w-]+)?\.(tsx|js)\b|supabase/i.test(url)) heavy.push(url)
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: '40 Days' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Join the 40 days' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toHaveAttribute(
    'href',
    '/signup?mode=signin',
  )
  await page.waitForLoadState('networkidle')
  expect(heavy).toEqual([])
})
