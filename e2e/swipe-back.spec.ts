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

/** Opens settings from profile, so back has a real previous screen. */
async function openSettings(page: Page) {
  await page.goto("/profile");
  await waitForHydration(page);
  await page.locator('header a[href="/profile/settings"]').tap(); // any language
  await page.waitForURL("**/profile/settings");
  await waitForHydration(page);
  await transitionSettled(page);
  await takeTransitions(page);
}

const width = (page: Page) => page.viewportSize()!.width;

test.beforeEach(async ({ context }) => {
  await recordTransitions(context);
});

test.describe("edge swipe back", () => {
  test.beforeEach(async ({ context }) => {
    await installed(context);
  });

  test("swiping from the edge goes back with the swipe slide", async ({ page }) => {
    await openSettings(page);
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
    await openSettings(page);
    await drag(page, [4, 400], [60, 400], 20); // slow and short
    await page.waitForTimeout(500);
    expect(pathname(page)).toBe("/profile/settings");
    await expect
      .poll(() => page.locator("[data-screen]").evaluate((el) => (el as HTMLElement).style.transform))
      .toBe("");
    await page.locator("[data-screen]").getByRole("button", { name: /^Language/ }).tap();
  });

  test("a swipe away from the edge or a scroll does nothing", async ({ page }) => {
    await openSettings(page);
    await drag(page, [120, 400], [width(page) - 10, 400]);
    await drag(page, [4, 500], [30, 200]);
    await page.waitForTimeout(500);
    expect(pathname(page)).toBe("/profile/settings");
  });

  test("RTL: swipe from the right edge", async ({ page, setLang }) => {
    await setLang("ar");
    await openSettings(page);
    await drag(page, [width(page) - 4, 400], [width(page) * 0.4, 410]);
    await page.waitForURL(/\/profile$/);
    await expect.poll(() => takeTransitions(page)).toContainEqual(["nav-swipe-rtl"]);
  });
});

test("in a browser tab the edge swipe is left to the browser", async ({ page }) => {
  await openSettings(page);
  await drag(page, [4, 400], [width(page) * 0.6, 410]);
  await page.waitForTimeout(500);
  expect(pathname(page)).toBe("/profile/settings");
});
