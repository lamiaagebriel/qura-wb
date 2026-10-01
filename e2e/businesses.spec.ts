import type { Page } from "@playwright/test";

import { expect, pathname, test, waitForHydration } from "./fixtures";

/**
 * Sets the branch's location from where the phone is: in the map sheet
 * (GOOGLE_MAPS_API_KEY set), or straight away without a key.
 */
async function setLocationHere(page: Page) {
  const onMap = page.getByRole("button", { name: "Set the location on the map" });
  if (await onMap.isVisible()) {
    await onMap.tap();
    await page.getByRole("button", { name: "Use my current location" }).tap();
    await page.getByRole("button", { name: "Use this location" }).tap();
  } else {
    await page.getByRole("button", { name: "Use my current location" }).tap();
  }
}

// TEMPORARY: your businesses are fake (components/profile/fake-businesses.ts)
// and saving only validates (client + `saveBusiness` action), until
// businesses are stored.
test.describe("my businesses", () => {
  test("Profile → My businesses → edit one → saved, back to the list", async ({
    page,
    signIn,
  }) => {
    await signIn();
    await page.goto("/profile");
    await waitForHydration(page);
    await page.getByRole("link", { name: /^My businesses/ }).tap();
    await expect.poll(() => pathname(page)).toBe("/profile/businesses");
    await waitForHydration(page);

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator("main").getByRole("listitem")).toHaveCount(2);
    await page.getByRole("link", { name: /Nile Breeze Café/ }).tap();
    await expect.poll(() => pathname(page)).toBe("/profile/businesses/nilebreeze");
    await waitForHydration(page);

    // Everything is filled in from the business.
    await expect(page.getByLabel("Name (English)")).toHaveValue("Nile Breeze Café");
    // One input per text, with a language switch inside it.
    await expect(page.getByLabel("Name (Arabic, optional)")).toHaveCount(0);
    await page.getByRole("button", { name: "العربية" }).first().tap();
    await expect(page.getByLabel("Name (Arabic, optional)")).toHaveValue("مقهى نسيم النيل");
    await page.getByRole("button", { name: "English" }).first().tap();
    // The avatar is the category's icon.
    await expect(page.getByTestId("business-avatar-icon")).toHaveAttribute("data-category", "cafe");
    await expect(page.getByLabel("Username")).toHaveValue("nilebreeze");
    await expect(page.getByLabel("Category")).toHaveAttribute("data-value", "cafe");
    await expect(page.getByLabel("Bio (English)")).toHaveValue(/^Coffee, fresh juices/);
    // WhatsApp, phones and links: one list.
    await expect(page.getByRole("button", { name: "Link 1: type — WhatsApp" })).toBeVisible();
    await expect(page.getByLabel("Link 1: address", { exact: true })).toHaveValue("+201009876543");
    await expect(page.getByRole("button", { name: "Link 2: type — Phone number" })).toBeVisible();
    await expect(page.getByLabel("Link 2: address", { exact: true })).toHaveValue("+20 97 123 4567");
    await expect(page.getByRole("button", { name: "Link 3: type — Phone number" })).toBeVisible();
    await expect(page.getByLabel("Link 3: address", { exact: true })).toHaveValue("+20 100 987 6543");
    await expect(page.getByRole("button", { name: "Link 4: type — Website" })).toBeVisible();
    await expect(page.getByLabel("Link 4: address", { exact: true })).toHaveValue("https://nilebreeze.example");
    await expect(page.getByLabel("Address (English)")).toHaveValue(/^Corniche El Nil/);
    // The pin is shown on a map, not as numbers.
    await expect(page.locator('main iframe[title="Location on the map"]')).toHaveAttribute("src", /q=24.0795%2C32.8878/);
    await expect(page.getByRole("button", { name: "Edit the location" }).first()).toBeVisible();
    // Closed on Mondays, open until midnight on Thursdays.
    await expect(page.getByRole("switch", { name: "Monday" })).not.toBeChecked();
    await expect(page.getByLabel("Closes on Thursday")).toHaveValue("00:00");
    // You added it: you choose who owns it.
    await expect(page.getByRole("radio", { name: /It's my business/ })).toBeChecked();

    await page.getByLabel("Name (English)").fill("Nile Breeze");
    await page.getByRole("button", { name: "Remove link 3" }).tap();
    await expect(page.getByRole("button", { name: "Link 3: type — Website" })).toBeVisible();
    await page.getByRole("button", { name: "Save changes" }).tap();
    await expect(page.getByText("Changes saved")).toBeVisible();
    await expect.poll(() => pathname(page)).toBe("/profile/businesses");
  });

  test("a business someone else added: no owner choice", async ({ page, signIn }) => {
    await signIn();
    await page.goto("/profile/businesses/aswan.eats");
    await waitForHydration(page);
    await expect(page.getByLabel("Name (English)")).toHaveValue("Aswan Eats");
    await expect(page.getByText("Is this your business?")).toHaveCount(0);
  });

  test("add a business: errors, then created for someone else", async ({ page, context, signIn }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 24.0965, longitude: 32.901 });
    await signIn();
    await page.goto("/profile/businesses");
    await waitForHydration(page);
    await page.getByRole("link", { name: "Add a business" }).tap();
    await expect.poll(() => pathname(page)).toBe("/profile/businesses/new");
    await waitForHydration(page);

    // Empty form: each required field says so (nothing is created).
    await page.getByRole("button", { name: "Create business" }).tap();
    await expect(page.getByText("Business created")).toHaveCount(0);
    await expect(page.getByText("Required").first()).toBeVisible();
    await expect(page.getByText("Choose a category").last()).toBeVisible();

    await page.getByRole("radio", { name: /I'm adding it for someone else/ }).tap();
    await page.getByLabel("Name (English)").fill("Aswan Bakery");
    await page.getByLabel("Username").fill("Aswan.Bakery");
    await expect(page.getByLabel("Username")).toHaveValue("aswan.bakery");
    // The picker drills down; "Choose …" picks a level that has children.
    await page.getByLabel("Category").tap();
    await page.getByRole("dialog").getByRole("button", { name: "Restaurant", exact: true }).tap();
    await page.getByRole("button", { name: "Choose “Restaurant”" }).tap();
    await expect(page.getByLabel("Category")).toHaveAttribute("data-value", "restaurant");
    await expect(page.getByTestId("business-avatar-icon")).toHaveAttribute("data-category", "restaurant");
    // WhatsApp is the first entry, and required.
    await expect(page.getByText("Add at least one WhatsApp number")).toHaveCount(0);
    await page.getByRole("button", { name: "Remove link 1" }).tap();
    await page.getByRole("button", { name: "Create business" }).tap();
    await expect(page.getByText("Add at least one WhatsApp number")).toBeVisible();
    await page.getByRole("button", { name: "Add a link" }).tap();
    await expect(page.getByRole("button", { name: "Link 1: type — WhatsApp" })).toBeVisible();
    await page.getByLabel("Link 1: address", { exact: true }).fill("+20 100 555 0000");

    await page.getByRole("button", { name: "Add a link" }).tap();
    await page.getByRole("button", { name: /^Link 2: type/ }).tap();
    await page.getByRole("button", { name: "Instagram", exact: true }).tap();
    await expect(page.getByRole("button", { name: "Link 2: type — Instagram" })).toBeVisible();
    await page.getByLabel("Link 2: address", { exact: true }).fill("not a link");
    await page.getByLabel("Link 2: address", { exact: true }).blur();
    await expect(page.getByText("Enter a link, like instagram.com/yourname")).toBeVisible();
    await page.getByLabel("Link 2: address", { exact: true }).fill("instagram.com/aswan.bakery");

    await page.getByLabel("Address (English)").fill("Old Souq, Aswan");
    // Required: the empty map box says so until it's set.
    await setLocationHere(page);
    await expect(page.locator('main iframe[title="Location on the map"]')).toBeVisible();

    // Closing before opening is caught.
    await page.getByLabel("Closes on Sunday").fill("08:00");
    await page.getByRole("button", { name: "Create business" }).tap();
    await expect(page.getByText("Closes before it opens")).toBeVisible();
    await page.getByLabel("Closes on Sunday").fill("22:00");
    await page.getByRole("switch", { name: "Friday" }).tap();
    await expect(page.getByLabel("Opens on Friday")).toHaveCount(0);
    // 24h on Monday, then copied to every day (Friday reopens too).
    await page.getByRole("button", { name: "Open 24 hours on Monday" }).tap();
    await expect(page.getByLabel("Opens on Monday")).toHaveCount(0);
    await page.getByRole("button", { name: "Copy Monday's hours to every day" }).tap();
    await expect(page.getByRole("switch", { name: "Friday" })).toBeChecked();
    await expect(page.getByLabel("Opens on Sunday")).toHaveCount(0);

    await page.getByRole("button", { name: "Create business" }).tap();
    await expect(page.getByText("Business created")).toBeVisible();
    await expect.poll(() => pathname(page)).toBe("/profile/businesses");
  });

  test("a username that's taken is refused by the server", async ({ page, signIn }) => {
    await signIn();
    await page.goto("/profile/businesses/nilebreeze");
    await waitForHydration(page);
    await page.getByLabel("Username").fill("nileview");
    await page.getByRole("button", { name: "Save changes" }).tap();
    await expect(page.getByText("This username is taken")).toBeVisible();
    await expect.poll(() => pathname(page)).toBe("/profile/businesses/nilebreeze");
  });

  test("the location: set from where you are, then removed in the map sheet", async ({ page, context, signIn }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 24.0889, longitude: 32.8998 });
    await signIn();
    await page.goto("/profile/businesses/new");
    await waitForHydration(page);
    await setLocationHere(page);
    await expect(page.locator('main iframe[title="Location on the map"]')).toHaveAttribute("src", /q=24.0889%2C32.8998/);
    // Removing is in the map sheet: tap the map.
    await page.getByRole("button", { name: "Edit the location" }).tap();
    await page.getByRole("button", { name: "Remove the location" }).tap();
    await expect(page.locator('main iframe[title="Location on the map"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Create business" }).tap();
    await expect(page.getByRole("alert").filter({ hasText: "Set the location on the map" })).toBeVisible();
  });

  test("someone else's business can't be edited", async ({ page, signIn, pageErrors }) => {
    await signIn();
    await page.goto("/profile/businesses/nileview");
    await expect(page.getByText("Page not found")).toBeVisible();
    pageErrors.splice(0, pageErrors.length, ...pageErrors.filter((e) => !e.includes("404")));
  });

  test("signed out: sent to sign in", async ({ page }) => {
    await page.goto("/profile/businesses");
    await expect.poll(() => pathname(page)).toBe("/login");
  });
});
