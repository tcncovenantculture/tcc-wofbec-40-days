import { expect, test } from '@playwright/test'

// Placeholder until the Phase 5 smoke test (sign up → verify → avatar → home → complete day → pod).
test('landing page loads with a way to join', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: '40 Days' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Join the 40 days' })).toBeVisible()
})
