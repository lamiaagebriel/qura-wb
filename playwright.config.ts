import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * End-to-end tests (`pnpm e2e`): the app in a phone-sized browser with
 * touch, like an iPhone 15. Starts `pnpm dev` (or reuses a running one).
 * Against a production build: `pnpm build && pnpm start -p 3100` then
 * `E2E_BASE_URL=http://localhost:3100 pnpm e2e`.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // One dev server compiles on demand; keep parallelism modest.
  fullyParallel: true,
  workers: process.env.CI ? 1 : 2,
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    // Windows ships Edge (Chromium), so no browser download is needed there;
    // elsewhere (macOS, Linux, CI) use Playwright's Chromium
    // (`pnpm exec playwright install chromium`).
    channel: process.platform === "win32" ? "msedge" : undefined,
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    trace: "retain-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
