import type { BrowserContext, Page } from "@playwright/test";

import {
  expect,
  pathname,
  recordTransitions,
  takeTransitions,
  test,
  touchDrag as drag,
  transitionOf,
  transitionSettled,
  waitForHydration,
} from "./fixtures";

/** Runs as the installed app (the gesture is off in a browser tab). */
const installed = (context: BrowserContext) =>
  context.addInitScript(() =>
    Object.defineProperty(Navigator.prototype, "standalone", { get: () => true }),
  );

/** Opens "My businesses" from profile, so back has a real previous screen. */
async function openBusinesses(page: Page) {
  await page.goto("/profile");
  await waitForHydration(page);
  await page.locator('main a[href="/profile/businesses"]').tap(); // any language
  await page.waitForURL("**/profile/businesses");
  await waitForHydration(page);
  // Loaded (not its skeleton): a touch on an element that gets replaced
  // never ends, so a swipe started during loading would be lost.
  await expect(page.locator("main[aria-busy]")).toHaveCount(0);
  await transitionSettled(page);
  await takeTransitions(page);
}

const width = (page: Page) => page.viewportSize()!.width;

// Signed in: "My businesses" is only there for a signed-in user.
test.beforeEach(async ({ context, signIn }) => {
  await recordTransitions(context);
  await signIn();
});

test.describe("edge swipe back", () => {
  test.beforeEach(async ({ context }) => {
    await installed(context);
  });

  test("swiping from the edge goes back in history", async ({ page }) => {
    await openBusinesses(page);
    const historyLength = await page.evaluate(() => history.length);
    await drag(page, [4, 400], [width(page) * 0.6, 410]);
    await page.waitForURL(/\/profile$/);
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
  });

  test("deep link: the swipe goes to the parent with the swipe slide", async ({ page }) => {
    await page.goto("/profile/businesses");
    await waitForHydration(page);
    const animations = await transitionOf(page, () =>
      drag(page, [4, 400], [width(page) * 0.6, 410]),
    );
    await page.waitForURL(/\/profile$/);
    // Both screens move: the old one finishes leaving, the new one comes in.
    expect(animations.map((a) => `${a.layer}:${a.name}`).sort()).toEqual([
      "new:nav-swipe-in",
      "old:nav-swipe-out",
    ]);
  });

  test("a short swipe springs back and stays", async ({ page }) => {
    await openBusinesses(page);
    await drag(page, [4, 400], [60, 400], 20); // slow and short
    await page.waitForTimeout(500);
    expect(pathname(page)).toBe("/profile/businesses");
    await expect
      .poll(() => page.locator("[data-screen]").evaluate((el) => (el as HTMLElement).style.transform))
      .toBe("");
    await expect(page.getByRole("link", { name: "Add a business" })).toBeVisible();
  });

  test("a swipe away from the edge or a scroll does nothing", async ({ page }) => {
    await openBusinesses(page);
    await drag(page, [120, 400], [width(page) - 10, 400]);
    await drag(page, [4, 500], [30, 200]);
    await page.waitForTimeout(500);
    expect(pathname(page)).toBe("/profile/businesses");
  });

  test("RTL: swipe from the right edge", async ({ page, setLang }) => {
    await setLang("ar");
    await openBusinesses(page);
    await drag(page, [width(page) - 4, 400], [width(page) * 0.4, 410]);
    await page.waitForURL(/\/profile$/);
  });
});

test("in a browser tab the edge swipe is left to the browser", async ({ page }) => {
  await openBusinesses(page);
  await drag(page, [4, 400], [width(page) * 0.6, 410]);
  await page.waitForTimeout(500);
  expect(pathname(page)).toBe("/profile/businesses");
});
