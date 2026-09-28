import type { Page } from "@playwright/test";

import { ANDROID_UA, expect, fireInstallEvent, IPHONE_UA, test, waitForHydration } from "./fixtures";

const themeColors = (page: Page) =>
  page.$$eval('meta[name="theme-color"]', (metas) => [
    ...new Set(metas.map((m) => (m as HTMLMetaElement).content)),
  ]);

test.describe("theme-color", () => {
  test.use({ colorScheme: "light" });

  test("follows the in-app theme and dims under a sheet", async ({ page }) => {
    await page.goto("/profile/settings");
    await waitForHydration(page);
    await expect.poll(() => themeColors(page)).toEqual(["#ffffff"]);

    await page.locator('[aria-label="Dark"]').tap();
    await expect.poll(() => themeColors(page)).toEqual(["#0a0a0a"]);
    await page.locator('[aria-label="Light"]').tap();

    await page.goto("/profile");

    await waitForHydration(page);
    await page.getByRole("button", { name: "Sign in" }).tap();
    await expect.poll(() => themeColors(page)).toEqual(["#000000"]);
    await page.keyboard.press("Escape");
    await expect.poll(() => themeColors(page)).toEqual(["#ffffff"]);
  });
});

test.describe("share", () => {
  test("uses the native share sheet when available", async ({ page, context }) => {
    await context.addInitScript(() => {
      const w = window as unknown as { __shared: ShareData | null };
      w.__shared = null;
      navigator.share = async (data) => {
        w.__shared = data ?? null;
      };
      navigator.canShare = () => true;
    });
    await page.goto("/profile/settings");
    await waitForHydration(page);
    await page.getByRole("button", { name: "Share Qura" }).tap();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __shared: ShareData }).__shared?.url))
      .toBe(new URL("/", page.url()).href);
  });

  test("falls back to copying the link, with a toast above the tab bar", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await context.addInitScript(() => {
      delete (Navigator.prototype as Partial<Navigator>).share;
      delete (Navigator.prototype as Partial<Navigator>).canShare;
    });
    await page.goto("/profile/settings");
    await waitForHydration(page);
    await page.getByRole("button", { name: "Share Qura" }).tap();

    const toast = page.locator('[data-slot="toast"]').first();
    await expect(toast).toContainText("Link copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      new URL("/", page.url()).href,
    );

    await page.waitForTimeout(700); // let the entrance animation finish
    const toastBox = (await toast.boundingBox())!;
    const navBox = (await page.locator("nav[aria-label]").boundingBox())!;
    expect(toastBox.y + toastBox.height).toBeLessThanOrEqual(navBox.y);
  });
});

test.describe("install prompt", () => {
  const sheet = (page: Page) => page.getByRole("dialog", { name: "Install Qura" });

  test.describe("iPhone", () => {
    test.use({ userAgent: IPHONE_UA });

    test("not on the first visit; steps on the second; snoozed after dismiss", async ({
      context,
    }) => {
      const first = await context.newPage();
      await first.goto("/");
      await waitForHydration(first);
      await first.waitForTimeout(3200);
      await expect(sheet(first)).toBeHidden();
      await first.close();

      // A new tab is a new browser session → second visit.
      const second = await context.newPage();
      await second.goto("/");
      await waitForHydration(second);
      await expect(sheet(second)).toBeVisible({ timeout: 6000 });
      await expect(second.getByText("Add to Home Screen")).toBeVisible();
      await second.getByRole("button", { name: "Got it" }).tap();
      await expect(sheet(second)).toBeHidden();
      await second.close();

      const third = await context.newPage();
      await third.goto("/");
      await waitForHydration(third);
      await third.waitForTimeout(3200);
      await expect(sheet(third)).toBeHidden();
    });

    test("never inside the installed app", async ({ page, context }) => {
      await context.addInitScript(() => {
        localStorage.setItem("qura:visits", "5");
        Object.defineProperty(navigator, "standalone", { get: () => true });
      });
      await page.goto("/");
      await waitForHydration(page);
      await page.waitForTimeout(3200);
      await expect(sheet(page)).toBeHidden();
      await expect(page.locator("html")).toHaveAttribute("data-standalone", "");
    });
  });

  test.describe("Android", () => {
    test.use({ userAgent: ANDROID_UA });

    test("Install button opens the native prompt", async ({ page, context }) => {
      await context.addInitScript(() => localStorage.setItem("qura:visits", "1"));
      await page.goto("/");
      await waitForHydration(page);
      await fireInstallEvent(page);
      await page.getByRole("button", { name: "Install", exact: true }).tap();
      await expect.poll(() => page.evaluate(() => (window as unknown as { __prompted: boolean }).__prompted)).toBe(true);
      await expect(sheet(page)).toBeHidden();
    });
  });
});
