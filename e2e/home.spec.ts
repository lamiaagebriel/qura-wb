import { expect, pathname, test, waitForHydration } from "./fixtures";

// Runs against the sample businesses (all in Aswan; reset before every run).
test.describe("home", () => {
  test("shows the default city's categories and businesses", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await expect(page.getByRole("button", { name: "City: Aswan" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "New in Aswan" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Nile Breeze Café/ }).first()).toBeVisible();
  });

  test("the ads carousel shows sponsored slides that open the business", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    const ads = page.getByRole("region", { name: "Sponsored" });
    await expect(ads.getByRole("group")).toHaveCount(3);
    await ads.getByRole("link", { name: /Breakfast on the Nile/ }).tap();
    await expect.poll(() => pathname(page)).toBe("/bs/nilebreeze");
  });

  test("a category chip opens that category", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await page
      .getByRole("navigation", { name: "Categories" })
      .getByRole("link", { name: "Beauty & salon" })
      .tap();
    await expect.poll(() => pathname(page)).toBe("/c/beauty");
    await expect(page.getByRole("link", { name: /Salon Nefertari/ })).toBeVisible();
  });

  test("sub-cities are listed under their city and filter to themselves", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await page.getByRole("button", { name: "City: Aswan" }).tap();
    // Aswan = all of it; its sub-cities pick only themselves.
    await expect(page.getByText("All of Aswan")).toBeVisible();
    await page.getByRole("radio", { name: "Edfu" }).tap();
    await expect(page.getByRole("button", { name: "City: Edfu" })).toBeVisible();
    await expect(page.getByText("No businesses in Edfu yet")).toBeVisible();

    await page.getByRole("button", { name: "City: Edfu" }).tap();
    await page.getByRole("radio", { name: /^Aswan/ }).tap();
    await expect(page.getByRole("heading", { name: "New in Aswan" })).toBeVisible();
  });

  test("picking another city switches the page and is remembered", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await page.getByRole("button", { name: "City: Aswan" }).tap();
    await page.getByRole("radio", { name: "Luxor" }).tap();

    await expect(page.getByRole("button", { name: "City: Luxor" })).toBeVisible();
    await expect(page.getByText("No businesses in Luxor yet")).toBeVisible();

    // Category pages follow the city too.
    await page.goto("/c/beauty");
    await expect(page.getByText("No businesses here yet")).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("button", { name: "City: Luxor" })).toBeVisible();
  });
});
