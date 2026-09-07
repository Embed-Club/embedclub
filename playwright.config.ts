import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import 'dotenv/config'

// Port 3000 is often already serving another project, and `reuseExistingServer`
// would happily run the whole suite against it. Set E2E_PORT to move ours.
const port = Number(process.env.E2E_PORT ?? 3000)
const baseURL = `http://localhost:${port}`

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  /* The HTML reporter starts a blocking web server after a failed local run,
     which hangs the terminal. Keep the report on CI, print a list locally. */
  reporter: process.env.CI ? 'html' : [['list'], ['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      // Uses the Google Chrome already installed on the machine instead of
      // Playwright's downloaded chromium build. CI still needs
      // `pnpm exec playwright install chrome`.
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${port}`,
    reuseExistingServer: true,
    url: baseURL,
  },
})
