import type { Page } from "@playwright/test";

import { expect, pathname, test, waitForHydration } from "./fixtures";

/** Loads a page and waits until the service worker controls it. */
async function openControlled(page: Page, path: string) {
  await page.goto(path);
  await waitForHydration(page);
  const controlled = await page
    .waitForFunction(() => !!navigator.serviceWorker?.controller, null, { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  return controlled;
}

test.describe("offline", () => {
  // The worker only registers in production builds.
  test.beforeEach(async ({ page }, testInfo) => {
    const controlled = await openControlled(page, "/");
    testInfo.skip(!controlled, "service worker is production-only (run against a build)");
  });

  // Requests failing while offline are the point here; other errors still fail.
  test.afterEach(({ pageErrors }) => {
    const real = pageErrors.filter((error) => !error.includes("net::ERR_"));
    pageErrors.splice(0, pageErrors.length, ...real);
  });

  test("sw.js is never cached", async ({ request }) => {
    const res = await request.get("/sw.js");
    expect(res.headers()["cache-control"]).toContain("no-store");
  });

  test("a visited page reopens with no connection", async ({ page, context }) => {
    await page.goto("/search");
    await waitForHydration(page);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("searchbox", { name: "Search Qura" })).toBeVisible();
    await context.setOffline(false);
  });

  test("an unvisited page shows the offline screen; retry recovers", async ({ page, context }) => {
    await context.setOffline(true);
    await page.goto("/profile");
    await expect(page.getByText("You're offline").first()).toBeVisible();
    expect(pathname(page)).toBe("/profile");

    await context.setOffline(false);
    await page.getByRole("button", { name: "Try again" }).tap();
    await expect(page.getByRole("button", { name: /^Language/ })).toBeVisible();
  });

  test("banner shows while offline and hides when back", async ({ page, context }) => {
    const banner = page.getByRole("status").filter({ hasText: "You're offline" });
    await expect(banner).toBeHidden();
    await context.setOffline(true);
    await expect(banner).toBeVisible();
    await context.setOffline(false);
    await expect(banner).toBeHidden();
  });
});
