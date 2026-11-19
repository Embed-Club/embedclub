import { expect, test } from '@playwright/test'

test.describe('Embed Days', () => {
  test('chooser lists both events and opens Embers', async ({ page }) => {
    await page.goto('/embed-days')
    await expect(page.getByRole('heading', { name: 'Embed Days', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Embedthon', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: "Embers '26", level: 2 })).toBeVisible()

    // The choice runs a ~650ms slide before it navigates.
    await page.getByRole('button', { name: /Embers '26/ }).click()
    await page.waitForURL('**/embers', { timeout: 15_000 })
  })

  test('embers page renders its title and details', async ({ page }) => {
    await page.goto('/embers')
    await expect(page).toHaveTitle(/Embers '26/)
    // The page sits behind a pixel-curtain intro; content fades in after it.
    await expect(page.getByText('25 November 2026').first()).toBeVisible({ timeout: 20_000 })
  })

  test('embedthon page renders its title and details', async ({ page }) => {
    await page.goto('/embedthon')
    await expect(page).toHaveTitle(/Embedthon/)
    await expect(page.getByText('24 - 25 November 2026').first()).toBeVisible({ timeout: 20_000 })
  })

  test('leaving an event page restores the visitor theme', async ({ page }) => {
    await page.goto('/about')
    await page.evaluate(() => window.localStorage.setItem('theme', 'light'))

    // Client-side hops, the way a visitor really leaves: the page flips the
    // document to dark while it is open and must hand the choice back.
    await page.goto('/embers')
    await expect(page.locator('#top')).toBeAttached({ timeout: 20_000 })
    await page.evaluate(() => {
      const app = window as unknown as { next: { router: { push: (path: string) => void } } }
      app.next.router.push('/embed-days')
    })
    await page.waitForURL('**/embed-days')

    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('theme'))).toBe('light')
  })

  test('event pages render without console errors on a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))

    for (const path of ['/embers', '/embedthon']) {
      await page.goto(path)
      await expect(page.locator('#top')).toBeAttached({ timeout: 20_000 })
    }
    expect(errors).toEqual([])
  })
})
