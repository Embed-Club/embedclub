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
    await expect(
      page
        .getByRole('link', { name: /feedback/i })
        .first()
        .or(page.getByText('No Feedback Forms Yet')),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('events page renders content or empty state', async ({ page }) => {
    await page.goto('http://localhost:3000/events')
    await expect(
      page.getByRole('heading', { name: 'RECENT EVENTS' }).or(page.getByText('No Events Yet')),
    ).toBeVisible({ timeout: 20_000 })
  })
})
