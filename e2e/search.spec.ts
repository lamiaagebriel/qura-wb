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
    await field(page).fill("koshary");
    await field(page).press("Enter");
    await expect(page.getByText("No results for “koshary”")).toBeVisible();
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
});
