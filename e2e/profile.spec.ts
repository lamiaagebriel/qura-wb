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

    // In groups: what you run, what you posted and kept, then the app.
    const settings = page.getByRole("region", { name: "Settings" });
    const account = settings.getByRole("group", { name: "Account" }).locator(":scope > *");
    // Edit profile is the avatar, not a settings row.
    await expect(page.getByRole("link", { name: "Edit profile" })).toBeVisible();
    await expect(account.nth(0)).toHaveAccessibleName(/^My businesses/);
    await expect(account.nth(1)).toHaveAccessibleName(/^Place requests/);
    const activity = settings.getByRole("group", { name: "Activity" }).locator(":scope > *");
    await expect(activity.nth(0)).toHaveAccessibleName(/^My posts/);
    await expect(activity.nth(1)).toHaveAccessibleName(/^Saved posts/);
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

  test("My posts: the posts you wrote", async ({ page, signIn }) => {
    await signIn();
    await page.goto("/profile");
    await waitForHydration(page);
    await page.getByRole("link", { name: /^My posts/ }).tap();
    await expect.poll(() => page.url()).toContain("/profile/posts");
    await expect(page.getByRole("heading", { name: "My posts" }).or(page.getByText("No posts yet")).first()).toBeVisible();
  });

  // (/profile/saved is back, as Saved posts.)
  test("/profile/settings is gone", async ({ page, pageErrors }) => {
    await page.goto("/profile/settings");
    await expect(page.getByText("Page not found")).toBeVisible();
    // The browser logs each 404 itself — expected here.
    pageErrors.splice(0, pageErrors.length, ...pageErrors.filter((e) => !e.includes("404")));
  });
});
