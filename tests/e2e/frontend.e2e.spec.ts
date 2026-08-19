import { expect, test } from '@playwright/test'

test.describe('Frontend', () => {
  test('home page loads with the club branding', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/Embed Club/)
  })

  test('resources page renders content or empty state', async ({ page }) => {
    await page.goto('http://localhost:3000/resources')
    await expect(page.getByRole('heading', { name: 'RESOURCES' })).toBeVisible()
    // either resource cards or the shared empty state must appear
    const cards = page.locator('[data-slot="cutout-card"]')
    const emptyState = page.getByText('No Resources Yet')
    await expect(cards.first().or(emptyState)).toBeVisible({ timeout: 15_000 })
  })

  test('feedback page renders list or empty state', async ({ page }) => {
    await page.goto('http://localhost:3000/feedback')
    // The page h1 always renders; scope to level 1 so the footer's "Feedback"
    // link (a level-3 nav column) can't satisfy a looser /feedback/i match.
    await expect(page.getByRole('heading', { name: /feedback/i, level: 1 })).toBeVisible({
      timeout: 15_000,
    })
    // Cards, not links: a closed form renders as a plain div rather than a
    // Link, so asserting on an anchor fails whenever every form is past its
    // deadline - which is the normal resting state for feedback forms.
    const cards = page.locator('[data-slot="cutout-card"]')
    const emptyState = page.getByText('No Feedback Forms Yet')
    await expect(cards.first().or(emptyState)).toBeVisible({ timeout: 15_000 })
  })

  test('events page renders content or empty state', async ({ page }) => {
    await page.goto('http://localhost:3000/events')
    await expect(
      page
        .getByRole('heading', { name: 'RECENT EVENTS' })
        .or(page.getByText('No Events Yet'))
        .first(),
    ).toBeVisible({ timeout: 20_000 })
  })
})
