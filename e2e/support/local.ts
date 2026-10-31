// Helpers for end-to-end tests that need local Supabase: sign-in codes from Mailpit, and the local service
// role client (through scripts/lib/target.ts, so the key stays in scripts) to set up and clean up.
// Tests that use these skip themselves when E2E_BASE_URL points at a deployed site.

import { expect, type Page } from '@playwright/test'
import { adminClient } from '../../scripts/lib/target.ts'

export const isLocal = !process.env.E2E_BASE_URL
const MAILPIT = process.env.E2E_MAILPIT_URL ?? 'http://127.0.0.1:54324'

type MailpitSearch = { messages: { Subject: string; Created: string }[] }

/** The 6-digit code from the newest email to `email` sent after `since` (a timestamp). */
export async function codeFor(email: string, since: number): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const response = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=5`,
    )
    const { messages } = (await response.json()) as MailpitSearch
    const code = messages
      .filter((m) => Date.parse(m.Created) >= since - 2000)
      .map((m) => /\b(\d{6})\b/.exec(m.Subject)?.[1])
      .find(Boolean)
    if (code) return code
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`No sign-in code arrived for ${email}`)
}

/** Signs in an existing account with a code, ending wherever the app sends them. */
export async function signIn(page: Page, email: string) {
  await page.goto('/signup?mode=signin')
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  const since = Date.now()
  await page.getByRole('button', { name: 'Send my code' }).click()
  await expect(page).toHaveURL(/\/verify/)
  await page.getByLabel('Your code').fill(await codeFor(email, since))
  await expect(page).not.toHaveURL(/\/verify/)
}

/** The local service role client, for setting up and cleaning up test data. */
export const admin = () => adminClient('local').supabase
