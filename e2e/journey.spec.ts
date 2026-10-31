import { expect, test } from '@playwright/test'
import { admin, codeFor, isLocal } from './support/local.ts'

// The end-to-end smoke test (PLAN.md Phase 5): sign up → verify → avatar → home → complete a day → post in
// the pod → report a message. Runs against local Supabase (codes from Mailpit; the local service role puts
// the new person in a pod, as pods:form would, and cleans up afterwards).

test.skip(!isLocal, 'Needs local Supabase and Mailpit')

test('a new person signs up, finishes Day 1, talks in their pod and reports a message', async ({ page }) => {
  test.setTimeout(90_000)
  const email = `smoke-${Date.now()}@example.com`
  const db = admin()

  try {
    // Sign up and verify
    await page.goto('/signup')
    await page.getByLabel('Your name').fill('Smoke Test')
    await page.getByRole('radio', { name: 'Undergraduate' }).click()
    await page.getByRole('textbox', { name: 'Email' }).fill(email)
    await page.getByLabel('I’ve read how my information is used and kept').check()
    const since = Date.now()
    await page.getByRole('button', { name: 'Send my code' }).click()
    await expect(page).toHaveURL(/\/verify/)
    await page.getByLabel('Your code').fill(await codeFor(email, since))

    // Avatar, then the optional questions
    await expect(page.getByRole('heading', { name: 'Make your avatar' })).toBeVisible()
    await page.getByRole('button', { name: 'Surprise me' }).click()
    await page.getByRole('button', { name: 'Save my avatar' }).click()
    await expect(page.getByRole('heading', { name: 'Three quick questions' })).toBeVisible()
    await page.getByRole('button', { name: 'Skip' }).last().click()

    // Home on Day 1, then the five steps
    await expect(page).toHaveURL(/\/home/)
    await page.goto('/home?asOf=2026-11-14')
    await expect(page.getByText('Today · Day 1')).toBeVisible()
    await page.getByRole('link', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Next: Understand' }).click()
    await page.getByRole('textbox').first().fill('The phrase that stayed with me was “forty days”.')
    await page.getByRole('button', { name: 'Next: Apply' }).click()
    await page.getByRole('button', { name: 'Next: Connect' }).click()
    await page.getByRole('button', { name: 'Next: Complete' }).click()
    await page.getByRole('button', { name: 'Complete Day 1' }).click()
    await expect(page.getByText('Day 1 complete')).toBeVisible()

    // Pods are formed on Nov 13 by pnpm pods:form; here the new person joins the seed's Rooftop pod.
    const { data: profile } = await db.from('profiles').select('id').eq('email', email).single()
    const { data: pod } = await db.from('pods').select('id').eq('name', 'Rooftop').single()
    if (!profile || !pod) throw new Error('Missing the new profile or the Rooftop pod (is the seed loaded?)')
    const { error: joinError } = await db.from('pod_members').insert({ pod_id: pod.id, user_id: profile.id })
    expect(joinError).toBeNull()

    // Post under today's question
    await page.goto('/pod')
    await expect(page.getByRole('heading', { name: 'Rooftop' })).toBeVisible()
    await page.getByRole('textbox').last().fill('Hello from the smoke test')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.getByText('Hello from the smoke test')).toBeVisible()

    // Report someone else's message
    await page.getByRole('button', { name: 'Options for Dayo’s message' }).first().click()
    await page.getByRole('button', { name: 'Report' }).click()
    await page.getByText('Unkind', { exact: true }).click()
    await page.getByRole('button', { name: 'Send report' }).click()
    await expect(page.getByRole('heading', { name: 'Thanks for telling us' })).toBeVisible()

    const { count } = await db
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('reporter_id', profile.id)
    expect(count).toBe(1)
  } finally {
    // Leave the local database as the seed made it.
    const { data: profile } = await db.from('profiles').select('id').eq('email', email).maybeSingle()
    if (profile) {
      await db.from('reports').delete().eq('reporter_id', profile.id)
      await db.from('messages').delete().eq('author_id', profile.id)
      await db.auth.admin.deleteUser(profile.id)
    }
  }
})
