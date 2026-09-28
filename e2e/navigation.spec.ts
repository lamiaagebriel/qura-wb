import {
  expect,
  makeTall,
  pathname,
  recordTransitions,
  tab,
  takeTransitions,
  test,
  transitionSettled,
  waitForHydration,
} from "./fixtures";

const gear = 'a[aria-label="Settings"]';
const back = '[aria-label="Back"]';

test.beforeEach(async ({ context }) => {
  await recordTransitions(context);
  await makeTall(context);
});

test.describe("app header", () => {
  test("large title collapses into a blurred bar (iOS)", async ({ page }) => {
    await page.goto("/profile");
    await waitForHydration(page);
    const header = page.locator("header[data-scrolled]");
    const smallTitle = header.locator("p");

    await expect(header).toHaveAttribute("data-scrolled", "false");
    await expect(smallTitle).toHaveCSS("opacity", "0");

    // A little scroll: big title still visible → bar stays clear.
    await page.mouse.wheel(0, 20);
    await page.waitForTimeout(300);
    await expect(header).toHaveAttribute("data-scrolled", "false");

    // Title tucked under the bar → blur bar + small inline title.
    await page.mouse.wheel(0, 300);
    await expect(header).toHaveAttribute("data-scrolled", "true");
    await expect(smallTitle).toHaveCSS("opacity", "1");
  });
});

test.describe("stack navigation", () => {
  test("gear slides forward, back arrow slides back", async ({ page }) => {
    await page.goto("/profile");
    await waitForHydration(page);
    await page.locator(gear).tap();
    await page.waitForURL("**/profile/settings");
    await expect.poll(() => takeTransitions(page)).toContainEqual(["nav-forward"]);
    await transitionSettled(page);

    await page.locator(back).tap();
    await page.waitForURL(/\/profile$/);
    await expect.poll(() => takeTransitions(page)).toContainEqual(["nav-back"]);
  });

  test("tab switches are instant (no slide)", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await tab(page, "/search").tap();
    await page.waitForURL("**/search");
    await page.waitForTimeout(500);
    const types = await takeTransitions(page);
    expect(types.flat()).toEqual([]);
  });

  test("tabs remember their screen; back stays inside the tab", async ({ page }) => {
    await page.goto("/profile");
    await waitForHydration(page);
    await page.locator(gear).tap();
    await page.waitForURL("**/profile/settings");

    await tab(page, "/search").tap();
    await page.waitForURL("**/search");
    await tab(page, "/profile").tap();
    await expect.poll(() => pathname(page)).toBe("/profile/settings");

    await page.locator(back).tap();
    await expect.poll(() => pathname(page)).toBe("/profile"); // not /search
  });

  test("re-tapping the active tab: sub-screen → root, root → top", async ({ page }) => {
    await page.goto("/profile");
    await waitForHydration(page);
    await page.locator(gear).tap();
    await page.waitForURL("**/profile/settings");
    await tab(page, "/profile").tap();
    await expect.poll(() => pathname(page)).toBe("/profile");

    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
    await tab(page, "/profile").tap();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  });

  test("scroll position is restored when returning to a tab", async ({ page }) => {
    await page.goto("/search");
    await waitForHydration(page);
    await page.mouse.wheel(0, 500);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
    const saved = await page.evaluate(() => scrollY);

    await tab(page, "/").tap();
    await expect.poll(() => pathname(page)).toBe("/");
    await tab(page, "/search").tap();
    await expect.poll(() => pathname(page)).toBe("/search");
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(saved);
  });

  test("deep link: back goes to the parent without leaving the app", async ({ page }) => {
    await page.goto("/profile/settings");
    await waitForHydration(page);
    const historyLength = await page.evaluate(() => history.length);
    await page.locator(back).tap();
    await expect.poll(() => pathname(page)).toBe("/profile");
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
  });

  test("RTL: back arrow is mirrored", async ({ page, setLang }) => {
    await setLang("ar");
    await page.goto("/profile/settings");
    await waitForHydration(page);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator('[aria-label="رجوع"] svg')).toHaveCSS("rotate", "180deg");
  });
});
