import { expect, test, type Page } from '@playwright/test'
import { admin, isLocal, signIn } from './support/local.ts'

// Text-only mode (PLAN.md Phase 5): when it's on, a day with media makes no image, audio or video requests and
// shows the text versions instead. It turns on by itself under Data Saver. Day 1 gets sample media for the
// test and is put back afterwards.

test.skip(!isLocal, 'Needs local Supabase and Mailpit')
test.describe.configure({ mode: 'serial' })

const media = [
  {
    type: 'image',
    url: 'media/module-1/text-only-test.webp',
    alt: 'A road at sunrise',
    ai_generated: false,
  },
  {
    type: 'audio',
    url: 'media/module-1/text-only-test.mp3',
    caption: 'A short prayer',
    transcript: 'Lord, walk with us these forty days.',
    ai_generated: true,
  },
  {
    type: 'video',
    url: 'https://youtu.be/dQw4w9WgXcQ',
    caption: 'A welcome',
    transcript: 'Welcome to the forty days.',
    ai_generated: false,
  },
]

/** Every request the page makes for media: Storage files, YouTube thumbnails and players. */
function watchMedia(page: Page): string[] {
  const seen: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (
      /storage\/v1\/object|ytimg\.com|youtube(-nocookie)?\.com/.test(url) ||
      ['image', 'media'].includes(request.resourceType())
    ) {
      if (!url.startsWith('data:') && !/\/assets\/|favicon|icon/.test(url)) seen.push(url)
    }
  })
  return seen
}

async function openDayOne(page: Page) {
  await page.goto('/day/1?asOf=2026-11-14')
  await page.getByRole('button', { name: 'Next: Understand' }).waitFor()
  await page.waitForLoadState('networkidle')
}

test.beforeAll(async () => {
  const { error } = await admin().from('days').update({ media }).eq('day_number', 1)
  expect(error).toBeNull()
})

test.afterAll(async () => {
  await admin().from('days').update({ media: [] }).eq('day_number', 1)
})

test('with text-only off, the day loads its media', async ({ page }) => {
  await signIn(page, 'bola@example.com')
  await page.evaluate(() => localStorage.setItem('c40.textOnly', 'false'))
  const requests = watchMedia(page)
  await openDayOne(page)
  await expect(page.getByRole('img', { name: 'A road at sunrise' })).toBeAttached()
  await expect(page.getByText('AI-generated')).toBeVisible()
  expect(requests.some((url) => url.includes('text-only-test.webp'))).toBe(true)
})

test('with text-only on, it requests no media and shows the text versions', async ({ page }) => {
  await signIn(page, 'bola@example.com')
  await page.evaluate(() => localStorage.setItem('c40.textOnly', 'true'))
  const requests = watchMedia(page)
  await openDayOne(page)
  await expect(page.getByText('A road at sunrise')).toBeVisible()
  await expect(page.getByText('Lord, walk with us these forty days.')).toBeVisible()
  await expect(page.getByText('Welcome to the forty days.')).toBeVisible()
  await expect(page.getByText('AI-generated')).toBeVisible()
  expect(requests).toEqual([])
})

test('Data Saver turns text-only on by itself', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true })
  })
  await signIn(page, 'bola@example.com')
  await page.evaluate(() => localStorage.removeItem('c40.textOnly'))
  const requests = watchMedia(page)
  await openDayOne(page)
  await expect(page.getByText('Lord, walk with us these forty days.')).toBeVisible()
  expect(requests).toEqual([])
})
