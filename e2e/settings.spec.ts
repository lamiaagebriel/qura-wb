import { ANDROID_UA, expect, fireInstallEvent, IPHONE_UA, test, waitForHydration } from "./fixtures";

test.describe("language", () => {
  test("row opens a sheet; picking a language switches the app", async ({ page }) => {
    await page.goto("/profile");
    await waitForHydration(page);
    const row = page.getByRole("button", { name: /^Language/ });
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44);

    await row.tap();
    const sheet = page.getByRole("dialog", { name: "Select language" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("radio")).toHaveCount(3);
    await expect(sheet.getByRole("radio", { name: "English", checked: true })).toBeVisible();

    await sheet.getByRole("radio", { name: "العربية" }).tap();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.getByRole("button", { name: /^اللغة/ }).tap();
    await page.getByRole("radio", { name: "English" }).tap();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("?lang= is saved and removed from the URL", async ({ page }) => {
    await page.goto("/profile?lang=ar");
    await waitForHydration(page);
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    // Switching afterwards still works (the old ?lang= can't override it).
    await page.getByRole("button", { name: /^اللغة/ }).tap();
    await page.getByRole("radio", { name: "English" }).tap();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });
});

test.describe("Install Qura row", () => {
  const row = (page: import("@playwright/test").Page) =>
    page.getByRole("button", { name: "Install Qura" });

  test.describe("iPhone", () => {
    test.use({ userAgent: IPHONE_UA });

    test("shown on the first visit and opens the steps", async ({ page }) => {
      await page.goto("/profile");
      await waitForHydration(page);
      await row(page).tap();
      await expect(page.getByText("Add to Home Screen")).toBeVisible();
    });

    test("hidden in the installed app", async ({ page, context }) => {
      await context.addInitScript(() =>
        Object.defineProperty(navigator, "standalone", { get: () => true }),
      );
      await page.goto("/profile");
      await waitForHydration(page);
      await page.waitForTimeout(400);
      await expect(row(page)).toBeHidden();
    });
  });

  test.describe("Android", () => {
    test.use({ userAgent: ANDROID_UA });

    test("appears once installable and runs the native prompt", async ({ page }) => {
      await page.goto("/profile");
      await waitForHydration(page);
      await page.waitForTimeout(400);
      await expect(row(page)).toBeHidden();
      await fireInstallEvent(page);
      await row(page).tap();
      await page.getByRole("button", { name: "Install", exact: true }).tap();
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { __prompted: boolean }).__prompted))
        .toBe(true);
    });
  });
});
