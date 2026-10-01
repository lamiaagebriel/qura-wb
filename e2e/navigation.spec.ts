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

const businesses = 'main a[href="/profile/businesses"]';
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
  test("a row slides forward; back arrow goes back in history", async ({
    page,
    signIn,
  }) => {
    await signIn();
    await page.goto("/profile");
    await waitForHydration(page);
    await page.locator(businesses).tap();
    await page.waitForURL("**/profile/businesses");
    await expect.poll(() => takeTransitions(page)).toContainEqual(["nav-forward"]);
    await transitionSettled(page);

    const historyLength = await page.evaluate(() => history.length);
    await page.locator(back).tap();
    await page.waitForURL(/\/profile$/);
    // A real history back (no new entry): instant, like browser back.
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
    await page.goForward();
    await page.waitForURL("**/profile/businesses");
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

  test("deep link: back goes to the parent without leaving the app", async ({
    page,
    signIn,
  }) => {
    await signIn();
    await page.goto("/profile/businesses");
    await waitForHydration(page);
    const historyLength = await page.evaluate(() => history.length);
    await page.locator(back).tap();
    await expect.poll(() => pathname(page)).toBe("/profile");
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
    await expect.poll(() => takeTransitions(page)).toContainEqual(["nav-back"]);
  });

  test("RTL: back arrow is mirrored", async ({ page, setLang }) => {
    await setLang("ar");
    await page.goto("/bs/nileview");
    await waitForHydration(page);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator('[aria-label="رجوع"] svg')).toHaveCSS("rotate", "180deg");
  });
});
