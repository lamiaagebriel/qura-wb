import type { BrowserContext, Page } from "@playwright/test";

import { expect, test, waitForHydration } from "./fixtures";

/**
 * Test browsers never show an on-screen keyboard, so `visualViewport` is
 * replaced by a stand-in: `keyboard(page, px)` shrinks the visible area by
 * `px` from the bottom the way a phone keyboard does (0 = closed).
 */
async function fakeKeyboard(context: BrowserContext) {
  await context.addInitScript(() => {
    const fake = new EventTarget() as EventTarget & Record<string, number>;
    let covered = 0;
    Object.defineProperties(fake, {
      height: { get: () => window.innerHeight - covered },
      width: { get: () => window.innerWidth },
      offsetTop: { get: () => 0 },
      offsetLeft: { get: () => 0 },
      scale: { get: () => 1 },
    });
    Object.defineProperty(window, "visualViewport", { get: () => fake });
    (window as unknown as { __keyboard: (px: number) => void }).__keyboard = (px) => {
      covered = px;
      fake.dispatchEvent(new Event("resize"));
    };
  });
}
const keyboard = (page: Page, px: number) =>
  page.evaluate((px) => (window as unknown as { __keyboard: (px: number) => void }).__keyboard(px), px);

/** A real one-finger touch path (Chromium touch input). */
async function touch(page: Page, points: [number, number][]) {
  const cdp = await page.context().newCDPSession(page);
  const at = ([x, y]: [number, number]) => [{ x, y, id: 1 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(points[0]) });
  for (const point of points.slice(1)) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: at(point) });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

const nav = (page: Page) => page.getByRole("navigation", { name: "Main navigation" });
const field = (page: Page) => page.getByRole("searchbox", { name: "Search Qura" });
const isFocused = (page: Page) => field(page).evaluate((el) => el === document.activeElement);

test.describe("keyboard", () => {
  test.beforeEach(async ({ context, page }) => {
    await fakeKeyboard(context);
    await page.goto("/search");
    await waitForHydration(page);
    await field(page).focus();
  });

  test("the tab bar slides away while typing and comes back after", async ({ page }) => {
    await keyboard(page, 320);
    await expect(nav(page)).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--keyboard-inset")))
      .toBe("320px");

    await field(page).blur();
    await keyboard(page, 0);
    await expect(nav(page)).toBeVisible();
    await expect(page.locator("html")).not.toHaveAttribute("data-keyboard");
  });

  test("a focused field without an on-screen keyboard keeps the tab bar", async ({ page }) => {
    // Hardware keyboard / no keyboard shown: the visible area doesn't shrink.
    await page.waitForTimeout(100);
    expect(await isFocused(page)).toBe(true);
    await expect(nav(page)).toBeVisible();
  });

  test("dragging the page dismisses the keyboard", async ({ page }) => {
    await keyboard(page, 320);
    await expect(page.locator("html")).toHaveAttribute("data-keyboard", "open");
    await touch(page, [[200, 400], [200, 380], [200, 340]]);
    await expect.poll(() => isFocused(page)).toBe(false);
    await keyboard(page, 0);
    await expect(nav(page)).toBeVisible();
  });

  test("tapping empty space dismisses it; tapping the field keeps it", async ({ page }) => {
    // Like iOS: tapping something that can't take focus doesn't blur the
    // field by itself (Chromium would), so the app has to.
    await page.evaluate(() =>
      document.addEventListener("mousedown", (event) => event.preventDefault(), true),
    );
    await keyboard(page, 320);
    await expect(page.locator("html")).toHaveAttribute("data-keyboard", "open");

    const box = (await field(page).boundingBox())!;
    await touch(page, [[box.x + box.width / 2, box.y + box.height / 2]]);
    await page.waitForTimeout(100);
    expect(await isFocused(page)).toBe(true);

    await touch(page, [[200, 700]]); // empty area under the content
    await expect.poll(() => isFocused(page)).toBe(false);
  });

  test("submitting a search puts the keyboard away", async ({ page }) => {
    await keyboard(page, 320);
    await field(page).fill("coffee");
    await field(page).press("Enter");
    await expect.poll(() => isFocused(page)).toBe(false);
  });
});
