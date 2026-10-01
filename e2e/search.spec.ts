import { expect, test, waitForHydration } from "./fixtures";

test.describe("search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search");
    await waitForHydration(page);
  });

  const field = (page: import("@playwright/test").Page) =>
    page.getByRole("searchbox", { name: "Search Qura" });

  test("field is focused, with the keyboard's search key", async ({ page }) => {
    await expect(field(page)).toBeFocused();
    await expect(field(page)).toHaveAttribute("enterkeyhint", "search");
  });

  test("clear button empties the field", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Clear search" })).toBeHidden();
    await field(page).fill("koshary");
    await page.getByRole("button", { name: "Clear search" }).tap();
    await expect(field(page)).toHaveValue("");
    await expect(field(page)).toBeFocused();
  });

  test("submitting shows the no-results state", async ({ page }) => {
    await field(page).fill("pyramids");
    await field(page).press("Enter");
    await expect(page.getByText("No results for “pyramids”")).toBeVisible();
    await expect(field(page)).not.toBeFocused(); // keyboard dismissed
  });

  test("recent searches: saved, reordered, removed, cleared", async ({ page }) => {
    for (const q of ["koshary", "nile cruise", "Koshary"]) {
      await field(page).fill(q);
      await field(page).press("Enter");
    }
    await page.getByRole("button", { name: "Clear search" }).tap();

    const items = page.getByRole("region", { name: "Recent searches" }).getByRole("listitem");
    // Newest first, case-insensitive dedupe.
    await expect(items).toHaveText(["Koshary", "nile cruise"]);

    // Kept on the device.
    await page.reload();
    await waitForHydration(page);
    await expect(items).toHaveText(["Koshary", "nile cruise"]);

    // Tapping one searches it.
    await items.getByText("nile cruise").tap();
    await expect(page.getByText("No results for “nile cruise”")).toBeVisible();
    await page.getByRole("button", { name: "Clear search" }).tap();
    await expect(items).toHaveText(["nile cruise", "Koshary"]);

    await page.getByRole("button", { name: "Remove Koshary" }).tap();
    await expect(items).toHaveText(["nile cruise"]);

    await page.getByRole("button", { name: "Clear", exact: true }).tap();
    await expect(page.getByRole("region", { name: "Recent searches" })).toBeHidden();
  });

  test("top-level categories are listed; tapping one opens it", async ({ page }) => {
    const categories = page.getByRole("region", { name: "Categories" }).getByRole("link");
    await expect(categories).toHaveCount(16);
    await categories.getByText("Café", { exact: true }).tap();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/c/cafe");
    await expect(page.getByRole("link", { name: /Nile Breeze Café/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Nile View Hotel/ })).toHaveCount(0);
  });

  test("searching a parent category finds businesses filed under it", async ({ page }) => {
    await field(page).fill("beauty"); // Salon Nefertari is filed under Salon
    await field(page).press("Enter");
    await expect(page.getByRole("link", { name: /Salon Nefertari/ })).toBeVisible();
  });

  test("matches the description too", async ({ page }) => {
    await field(page).fill("koshary"); // only in Aswan Eats' bio
    await field(page).press("Enter");
    await expect(page.getByRole("link", { name: /Aswan Eats/ })).toBeVisible();
  });

  test("a spinner while searching; the back arrow returns to the start", async ({ page }) => {
    // Slow the search down (it runs on the server), to see the spinner.
    await page.route("**/search", async (route) => {
      if (route.request().method() === "POST") await new Promise((r) => setTimeout(r, 800));
      await route.fallback();
    });
    await expect(page.getByRole("button", { name: "Exit search" })).toHaveCount(0);
    await field(page).fill("hotel");
    await expect(page.getByRole("button", { name: "Exit search" })).toBeVisible();
    await field(page).press("Enter");
    await expect(page.getByRole("status", { name: "Searching…" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Nile View Hotel/ })).toBeVisible();
    await expect(page.getByRole("status", { name: "Searching…" })).toHaveCount(0);

    await page.getByRole("button", { name: "Exit search" }).tap();
    await expect(field(page)).toHaveValue("");
    await expect(page.getByRole("link", { name: /Nile View Hotel/ })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Categories" })).toBeVisible();
  });

  test("open a result and go back: the search is still there", async ({ page }) => {
    await field(page).fill("Restaurant");
    await field(page).press("Enter");
    await expect(page).toHaveURL(/\/search\?q=Restaurant$/);
    const historyLength = await page.evaluate(() => history.length);
    await page.getByRole("link", { name: /Aswan Eats/ }).tap();
    await page.waitForURL("**/bs/aswan.eats");
    await waitForHydration(page);

    await page.getByRole("button", { name: "Back" }).tap();
    await page.waitForURL(/\/search\?q=Restaurant$/);
    await expect(field(page)).toHaveValue("Restaurant");
    await expect(page.getByRole("link", { name: /Aswan Eats/ })).toBeVisible();
    await expect(field(page)).not.toBeFocused(); // no keyboard over the results
    // Searching replaced the URL; it didn't add a back step.
    expect(await page.evaluate(() => history.length)).toBe(historyLength + 1);

    // A reload or a shared link shows the same search.
    await page.reload();
    await expect(field(page)).toHaveValue("Restaurant");
    await expect(page.getByRole("link", { name: /Aswan Eats/ })).toBeVisible();

    await page.getByRole("button", { name: "Exit search" }).tap();
    await expect(page).toHaveURL(/\/search$/);
  });
});
