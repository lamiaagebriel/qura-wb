import { expect, pathname, test, waitForHydration } from "./fixtures";

// Runs against the sample businesses (reset before every run).
test.describe("categories", () => {
  test("a category shows its whole subtree; chips drill down; back goes up", async ({ page }) => {
    await page.goto("/c/beauty");
    await waitForHydration(page);
    await expect(page.getByRole("link", { name: /Salon Nefertari/ })).toBeVisible();

    // Only subcategories with businesses get a chip.
    const chips = page.getByRole("navigation", { name: "Subcategories" });
    await expect(chips.getByText("All")).toHaveAttribute("aria-current", "page");
    await expect(chips.getByRole("link")).toHaveCount(1);
    await chips.getByRole("link", { name: /Salon/ }).tap();
    await expect.poll(() => pathname(page)).toBe("/c/salon");
    await expect(page.getByRole("link", { name: /Salon Nefertari/ })).toBeVisible();

    await page.getByRole("link", { name: "Back" }).or(page.getByRole("button", { name: "Back" })).tap();
    await expect.poll(() => pathname(page)).toBe("/c/beauty");
  });

  test("an empty category says so", async ({ page }) => {
    await page.goto("/c/nails");
    await expect(page.getByText("No businesses here yet")).toBeVisible();
  });

  test("the business profile links to its category", async ({ page }) => {
    await page.goto("/bs/salon.nefertari");
    await waitForHydration(page);
    await page.getByRole("link", { name: "Salon", exact: true }).tap();
    await expect.poll(() => pathname(page)).toBe("/c/salon");
  });

});
