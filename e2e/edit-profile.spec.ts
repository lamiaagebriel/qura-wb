import { expect, pathname, test, waitForHydration } from "./fixtures";

// Tests run in parallel and others check the test user's name and @handle,
// so this one changes only the avatar and bio (reset by global-setup.ts).
test.describe("edit profile", () => {
  test("Profile → Edit profile → pick an avatar and a bio → shown at once", async ({
    page,
    signIn,
  }) => {
    await signIn();
    await page.goto("/profile");
    await waitForHydration(page);
    await page.getByRole("link", { name: /^Edit profile/ }).tap();
    await expect.poll(() => pathname(page)).toBe("/profile/edit");
    await waitForHydration(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    // Filled in from your account.
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("E2E Tester");
    await expect(page.getByLabel("Username")).toHaveValue("e2e_tester");

    // The choices open in a sheet; picking one closes it.
    await page.getByRole("button", { name: "Change avatar" }).tap();
    const sheet = page.getByRole("dialog", { name: "Choose an avatar" });
    const avatars = sheet.getByRole("radiogroup", { name: "Avatar" });
    await expect(avatars.getByRole("radio")).toHaveCount(12);
    await avatars.getByRole("radio", { name: "Glasses" }).tap();
    await expect(sheet).toBeHidden();
    await expect(page.locator('main img[src="/avatars/glasses.svg"]')).toBeVisible();
    await page.getByLabel("Bio (optional)").fill("Coffee on the Corniche ☕");
    await page.getByRole("button", { name: "Save changes" }).tap();

    await expect(page.getByText("Changes saved")).toBeVisible();
    await expect.poll(() => pathname(page)).toBe("/profile");
    // Not stale: the session cookie was refreshed with the change.
    await expect(page.getByText("Coffee on the Corniche ☕")).toBeVisible();
    await expect(page.locator('main img[src="/avatars/glasses.svg"]')).toBeVisible();
  });

  test("errors: an empty name, and a @handle someone has", async ({ page, signIn }) => {
    await signIn();
    await page.goto("/profile/edit");
    await waitForHydration(page);

    await page.getByLabel("Name", { exact: true }).fill("");
    await page.getByRole("button", { name: "Save changes" }).tap();
    await expect(page.getByText("Required")).toBeVisible();
    await page.getByLabel("Name", { exact: true }).fill("E2E Tester");

    await page.getByLabel("Username").fill("Omar.Said");
    await expect(page.getByLabel("Username")).toHaveValue("omar.said");
    await page.getByRole("button", { name: "Save changes" }).tap();
    await expect(page.getByText("This username is taken")).toBeVisible();
    await expect.poll(() => pathname(page)).toBe("/profile/edit");
  });

  test("signed out: sent to sign in", async ({ page }) => {
    await page.goto("/profile/edit");
    await expect.poll(() => pathname(page)).toBe("/login");
  });
});
