import { expect, pathname, tab, test, waitForHydration } from "./fixtures";

test.describe("back closes a sheet first", () => {
  test("language sheet", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await tab(page, "/profile").tap();
    await page.waitForURL("**/profile");
    await waitForHydration(page);

    await page.getByRole("button", { name: /^Language/ }).tap();
    const sheet = page.getByRole("dialog", { name: "Select language" });
    await expect(sheet).toBeVisible();

    await page.goBack(); // Android back / browser back / swipe
    await expect(sheet).toBeHidden();
    expect(pathname(page)).toBe("/profile"); // stayed on the page

    await page.goBack(); // the next back navigates as usual
    await expect.poll(() => pathname(page)).toBe("/");
  });

  test("closing a sheet normally doesn't leave an extra back step", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await tab(page, "/profile").tap();
    await page.waitForURL("**/profile");
    await waitForHydration(page);

    await page.getByRole("button", { name: /^Language/ }).tap();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.goBack();
    await expect.poll(() => pathname(page)).toBe("/");
  });

  test("sign-in sheet", async ({ page }) => {
    await page.goto("/profile");
    await waitForHydration(page);
    await page.getByRole("button", { name: "Sign in" }).tap();
    await expect(page.getByRole("dialog", { name: "Sign in to Qura" })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("dialog")).toBeHidden();
    expect(pathname(page)).toBe("/profile");
  });
});

// Loading skeletons (app/**/loading.tsx) show while a screen's server render
// is slow — Next streams the skeleton first, then the content. Playwright
// can't stream a partial response, so this was verified by making a page
// slow on the server (1.5s) and checking that tapping to it shows the
// skeleton instantly, then the content.
