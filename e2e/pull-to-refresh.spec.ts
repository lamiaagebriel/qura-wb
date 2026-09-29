import type { Page } from "@playwright/test";

import { expect, makeTall, test, touchDrag, waitForHydration } from "./fixtures";

/** Counts the screen-data refetches (`router.refresh()` → RSC request). */
function countRefreshes(page: Page) {
  const count = { value: 0 };
  page.on("request", (request) => {
    if (request.headers()["rsc"] === "1" && new URL(request.url()).pathname === "/") {
      count.value++;
    }
  });
  return count;
}

const content = (page: Page) => page.locator("[data-pull-content]");
const offset = (page: Page) =>
  content(page).evaluate((el) => (el as HTMLElement).style.transform);

test.describe("pull to refresh", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
  });

  test("pulling down far enough refreshes the screen, then settles", async ({ page }) => {
    const refreshes = countRefreshes(page);
    await touchDrag(page, [200, 250], [200, 500], 15);

    await expect(page.getByRole("status").filter({ hasText: "Refreshing…" })).toBeAttached();
    await expect.poll(() => refreshes.value).toBeGreaterThan(0);
    // Back at rest: no leftover transform, status cleared.
    await expect.poll(() => offset(page)).toBe("");
    await expect(page.getByRole("status").filter({ hasText: "Refreshing…" })).toHaveCount(0);
  });

  test("a short pull springs back without refreshing", async ({ page }) => {
    const refreshes = countRefreshes(page);
    await touchDrag(page, [200, 250], [200, 300], 8);
    await expect.poll(() => offset(page)).toBe("");
    await page.waitForTimeout(500);
    expect(refreshes.value).toBe(0);
  });

  test("sideways swipes don't pull", async ({ page }) => {
    const refreshes = countRefreshes(page);
    await touchDrag(page, [100, 300], [350, 340], 10);
    await page.waitForTimeout(500);
    expect(refreshes.value).toBe(0);
    expect(await offset(page)).toBe("");
  });
});

test("scrolled down, dragging down scrolls instead of pulling", async ({ page, context }) => {
  await makeTall(context);
  await page.goto("/");
  await waitForHydration(page);
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600);
  const refreshes = countRefreshes(page);

  await touchDrag(page, [200, 250], [200, 500], 15);
  await page.waitForTimeout(500);
  expect(refreshes.value).toBe(0);
  expect(await offset(page)).toBe("");
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(600);
});
