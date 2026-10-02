import { expect, test, waitForHydration } from "./fixtures";

test.describe("profile", () => {
  test("signed in: your personal profile, then the settings", async ({ page, signIn }) => {
    await signIn();
    await page.goto("/profile");
    await waitForHydration(page);

    await expect(page.getByRole("heading", { level: 2, name: "E2E Tester" })).toBeVisible();
    await expect(page.getByText("@e2e_tester")).toBeVisible();
    // Users follow businesses; nobody follows a user.
    await expect(page.getByText(/\d+ following/)).toBeVisible();
    await expect(page.getByText(/followers/)).toHaveCount(0);
    // Personal only: no business details, no account switcher, no saved posts.
    await expect(page.getByRole("button", { name: "Working hours" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /^Saved/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Profile", exact: true })).toHaveCount(0);

    // Settings live here, in groups: your account, then the app.
    const settings = page.getByRole("region", { name: "Settings" });
    const account = settings.getByRole("group", { name: "Account" }).locator(":scope > *");
    await expect(account.nth(0)).toHaveAccessibleName(/^Edit profile/);
    await expect(account.nth(1)).toHaveAccessibleName(/^My businesses/);
    const app = settings.getByRole("group", { name: "App" }).locator(":scope > *");
    await expect(app.nth(0)).toHaveAccessibleName(/^Language/);
    await expect(settings.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  test("signed out: sign-in prompt, and the settings without your businesses", async ({
    page,
  }) => {
    await page.goto("/profile");
    await waitForHydration(page);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Language/ })).toBeVisible();
    await expect(page.getByRole("group", { name: "Account" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
  });

  test("/profile/settings and /profile/saved are gone", async ({ page, pageErrors }) => {
    for (const path of ["/profile/settings", "/profile/saved"]) {
      await page.goto(path);
      await expect(page.getByText("Page not found")).toBeVisible();
    }
    // The browser logs each 404 itself — expected here.
    pageErrors.splice(0, pageErrors.length, ...pageErrors.filter((e) => !e.includes("404")));
  });
});
