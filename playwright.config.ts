import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3111",
    trace: "on-first-retry",
    // Some sandboxes ship a system Chromium instead of the Playwright-managed
    // build; point PLAYWRIGHT_CHROMIUM_PATH at it there. CI leaves this unset
    // and uses `playwright install chromium`.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: "pnpm start --port 3111",
    url: "http://localhost:3111",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
