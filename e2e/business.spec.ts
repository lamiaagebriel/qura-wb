import { expect, makeTall, pathname, tab, test, waitForHydration } from "./fixtures";

// Runs against the sample businesses (`pnpm db:seed`, reset before every
// run by e2e/global-setup.ts).
test.describe("public business profile", () => {
  test("Search: a category lists its businesses; one opens", async ({ page }) => {
    await page.goto("/search");
    await waitForHydration(page);

    await page.getByRole("link", { name: "Hotel", exact: true }).tap();
    await page.getByRole("link", { name: /Nile View Hotel/ }).tap();

    await expect.poll(() => pathname(page)).toBe("/bs/nileview");
    await waitForHydration(page);
    await expect(page.getByRole("heading", { level: 2, name: "Nile View Hotel" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Working hours" })).toContainText(
      "Open 24 hours",
    );
    // No edit button for a visitor; signed out, Follow asks to sign in.
    await expect(page.getByRole("button", { name: "Edit profile" })).toHaveCount(0);
    await page.getByRole("button", { name: "Follow" }).tap();
    await expect(page.getByRole("dialog", { name: "Sign in to Qura" })).toBeVisible();
  });

  test("follow: saved, still followed after a reload, then unfollowed", async ({
    page,
    signIn,
  }) => {
    await signIn();
    await page.goto("/bs/elshifa");
    await waitForHydration(page);
    await page.getByRole("button", { name: "Follow" }).tap();
    const following = page.getByRole("button", { name: "Following" });
    await expect(following).toHaveAttribute("aria-pressed", "true");
    // The followers count includes you once it's saved.
    await expect(page.getByText(/^1 follower$/)).toBeVisible();

    await page.reload();
    await waitForHydration(page);
    await expect(following).toHaveAttribute("aria-pressed", "true");
    await following.tap();
    await expect(page.getByRole("button", { name: "Follow" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await page.reload();
    await expect(page.getByRole("button", { name: "Follow" })).toBeVisible();
  });

  test("the Search tab still opens Search after visiting a business", async ({ page }) => {
    await page.goto("/search");
    await waitForHydration(page);
    await page.getByRole("link", { name: "Restaurant", exact: true }).tap();
    await page.getByRole("link", { name: /Aswan Eats/ }).tap();
    await expect.poll(() => pathname(page)).toBe("/bs/aswan.eats");
    await waitForHydration(page);

    await tab(page, "/search").tap();
    await expect.poll(() => pathname(page)).toBe("/search");
  });

  test("searching filters by name or category", async ({ page }) => {
    await page.goto("/search");
    await waitForHydration(page);
    const field = page.getByRole("searchbox", { name: "Search Qura" });

    await field.fill("pharmacy");
    await field.press("Enter");
    await expect(page.getByRole("link", { name: /El Shifa Pharmacy/ })).toBeVisible();
    await expect(page.getByRole("link")).toHaveCount(1 + 3); // result + tab bar

    await field.fill("مقهى"); // category name in Arabic
    await field.press("Enter");
    await expect(page.getByRole("link", { name: /Nile Breeze Café/ })).toBeVisible();
  });

  test("a business with no reviews: row and screen say so", async ({ page }) => {
    await page.goto("/bs/souq.spices");
    await waitForHydration(page);
    await page.getByRole("link", { name: "No reviews yet." }).tap();
    await expect.poll(() => pathname(page)).toBe("/bs/souq.spices/reviews");
    await expect(page.getByText("No reviews yet. Be the first!")).toBeVisible();
  });

  test("reviews: a row in the details card opens the reviews screen", async ({ page }) => {
    await page.goto("/bs/nileview");
    await waitForHydration(page);
    // No separate reviews card on the profile any more.
    await expect(page.getByRole("region", { name: /^Reviews/ })).toHaveCount(0);

    await page.getByRole("link", { name: /· \d+ reviews$/ }).tap();
    await expect.poll(() => pathname(page)).toBe("/bs/nileview/reviews");
    await waitForHydration(page);
    await expect(page.getByRole("img", { name: /out of 5 stars/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Write a review" })).toBeVisible();
    await expect.poll(() => page.getByRole("article").count()).toBeGreaterThan(3);
  });

  test("reviews screen: a brief of the business and “Write a review”", async ({ page }) => {
    await page.goto("/bs/nilebreeze/reviews");
    await waitForHydration(page);
    await expect(page.getByRole("heading", { name: /Nile Breeze Café/ })).toBeVisible();
    await expect(page.getByText("@nilebreeze")).toBeVisible();
    await expect(page.getByRole("img", { name: "Verified" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Write a review" })).toBeVisible();
  });

  test("back arrows: reviews → business → category → Search", async ({ page }) => {
    await page.goto("/search");
    await waitForHydration(page);
    await page.getByRole("link", { name: "Hotel", exact: true }).tap();
    await page.getByRole("link", { name: /Nile View Hotel/ }).tap();
    await expect.poll(() => pathname(page)).toBe("/bs/nileview");
    await waitForHydration(page);
    await page.getByRole("link", { name: /· \d+ reviews$/ }).tap();
    await expect.poll(() => pathname(page)).toBe("/bs/nileview/reviews");
    await waitForHydration(page);

    await page.getByRole("button", { name: "Back" }).tap();
    await expect.poll(() => pathname(page)).toBe("/bs/nileview");
    await waitForHydration(page);
    await page.getByRole("button", { name: "Back" }).tap();
    await expect.poll(() => pathname(page)).toBe("/c/hotel");
    await waitForHydration(page);
    await page.getByRole("button", { name: "Back" }).tap();
    await expect.poll(() => pathname(page)).toBe("/search");
  });

  test("the map shows the pin and opens it in Maps", async ({ page }) => {
    await page.goto("/bs/nileview");
    await waitForHydration(page);
    const map = page.getByRole("link", { name: "Open in Maps" });
    await expect(map).toHaveAttribute("href", /query=24\.0905,32\.897$/);
    const frame = map.locator("iframe");
    await expect(frame).toHaveAttribute("src", /maps\.google\.com\/maps\?q=24\.0905%2C32\.897/);
    // Google actually drew a map in it (no key needed).
    await expect(
      map.frameLocator("iframe").locator(".gm-style, img").first(),
    ).toBeAttached({ timeout: 15_000 });
  });

  test("the bar shows the name only once the page's name has scrolled away", async ({
    page,
    context,
  }) => {
    await makeTall(context); // enough page to scroll the name away
    await page.goto("/bs/nileview");
    await waitForHydration(page);
    const barTitle = page.locator("header p", { hasText: "Nile View Hotel" });
    await expect(barTitle).toHaveClass(/opacity-0/);

    await page.mouse.wheel(0, 400);
    await expect(barTitle).toHaveClass(/opacity-100/);
    await page.mouse.wheel(0, -400);
    await expect(barTitle).toHaveClass(/opacity-0/);
  });

  test("write a review: signed out, asks to sign in", async ({ page }) => {
    await page.goto("/bs/nileview/reviews");
    await waitForHydration(page);
    await page.getByRole("button", { name: "Write a review" }).tap();
    await expect(page.getByRole("dialog", { name: "Sign in to Qura" })).toBeVisible();
  });

  test("your own business: no “Write a review”", async ({ page, signIn }) => {
    await signIn();
    await page.goto("/bs/nilebreeze/reviews");
    await expect(page.getByText("@nilebreeze")).toBeVisible();
    await expect(page.getByRole("button", { name: "Write a review" })).toHaveCount(0);
  });

  test("write a review: stars required, posted, then shown and editable", async ({
    page,
    signIn,
  }) => {
    await signIn();
    await page.goto("/bs/nileview/reviews");
    await waitForHydration(page);
    await page.getByRole("button", { name: "Write a review" }).tap();

    const sheet = page.getByRole("dialog", { name: "Write a review" });
    await expect(sheet).toBeVisible();
    const post = sheet.getByRole("button", { name: "Post review" });
    await expect(post).toBeDisabled();

    await sheet.getByRole("radio", { name: "4 out of 5 stars" }).tap();
    await expect(sheet.getByRole("radio", { name: "4 out of 5 stars" })).toBeChecked();
    await sheet.getByRole("textbox", { name: "Your review" }).fill("Lovely view!");
    await post.tap();

    await expect(sheet).toBeHidden();
    await expect(page.getByText("Thanks for your review!")).toBeVisible();

    // Saved: newest first, and writing again edits it.
    await page.reload();
    await waitForHydration(page);
    await expect(page.getByText("Lovely view!")).toBeVisible();
    await page.getByRole("button", { name: "Edit your review" }).tap();
    const edit = page.getByRole("dialog", { name: "Edit your review" });
    await expect(edit.getByRole("radio", { name: "4 out of 5 stars" })).toBeChecked();
    await expect(edit.getByRole("textbox", { name: "Your review" })).toHaveValue("Lovely view!");
  });

  test("contact and links: slides open; every entry is a link", async ({ page }) => {
    await page.goto("/bs/nileview");
    await waitForHydration(page);
    const row = page.getByRole("button", { name: /Contact and links/ });
    await expect(row).toHaveAttribute("aria-expanded", "false");
    await row.tap();
    await expect(row).toHaveAttribute("aria-expanded", "true");

    const links = page.locator('[data-slot="accordion-content"]').getByRole("link");
    // WhatsApp first (required), then its three numbers, website, 4 networks.
    await expect(links).toHaveCount(9);
    await expect(links.first()).toHaveAccessibleName("WhatsApp: +201205550101");
    await expect(page.getByRole("link", { name: /^Call: / })).toHaveCount(3);
    await expect(page.getByRole("link", { name: "Website: nileview.example" })).toHaveAttribute(
      "href",
      "https://nileview.example",
    );
    const instagram = page.getByRole("link", { name: "Instagram: @nileview.aswan" });
    await expect(instagram).toHaveAttribute("href", "https://instagram.com/nileview.aswan");
    await expect(instagram).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("link", { name: "YouTube: @nileviewaswan" })).toBeVisible();
  });

  test("social icons use their brand colours", async ({ page }) => {
    await page.goto("/bs/aswan.eats");
    await waitForHydration(page);
    await page.getByRole("button", { name: /Contact and links/ }).tap();
    const badge = (name: RegExp) => page.getByRole("link", { name }).locator("span").first();
    await expect(badge(/^Facebook:/)).toHaveCSS("background-color", "rgb(24, 119, 242)");
    await expect(badge(/^WhatsApp:/)).toHaveCSS("background-color", "rgb(37, 211, 102)");
    await expect(badge(/^Instagram:/)).toHaveCSS("background-image", /linear-gradient/);
  });

  test("share in the top bar; order on WhatsApp next to Follow", async ({ page }) => {
    await page.goto("/bs/aswan.eats");
    await waitForHydration(page);
    await expect(page.locator("header").getByRole("button", { name: "Share profile" })).toBeVisible();

    const order = page.getByRole("link", { name: "Order on WhatsApp" });
    const url = new URL((await order.getAttribute("href"))!);
    expect(url.origin + url.pathname).toBe("https://wa.me/201002345678");
    expect(url.searchParams.get("text")).toContain("Aswan Eats");
    await expect(order).toHaveAttribute("target", "_blank");
  });

  test("two branches: the address row opens the other one", async ({ page }) => {
    await page.goto("/bs/aswan.eats");
    await waitForHydration(page);
    // One row: the first address + "+1" + chevron; the first branch's map below.
    const more = page.getByRole("button", { name: /Other branches/ });
    await expect(more).toContainText("Abtal El Tahrir St");
    await expect(more).toContainText("+1");
    await expect(page.getByRole("link", { name: "Open in Maps" })).toHaveCount(1);

    await expect(more).toHaveAttribute("aria-expanded", "false");
    await more.tap();
    const branch = page.getByRole("link", { name: /^Sadat Rd, next to Aswan University/ });
    await expect(branch).toHaveAttribute("href", /query=24.0745,32.8795$/);
    await expect(branch).toHaveAttribute("target", "_blank");
  });

  test("one branch: no “Other branches” row", async ({ page }) => {
    await page.goto("/bs/nileview");
    await waitForHydration(page);
    await expect(page.getByRole("link", { name: "Open in Maps" })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /Other branches/ })).toHaveCount(0);
  });

  test("a phone number is a call link", async ({ page }) => {
    await page.goto("/bs/felucca.tours");
    await waitForHydration(page);
    await page.getByRole("button", { name: /Contact and links/ }).tap();
    await expect(page.getByRole("link", { name: "Call: +20 122 345 6789" })).toHaveAttribute(
      "href",
      "tel:+20 122 345 6789",
    );
  });

  test("details card: one accordion — opening a row closes the other", async ({ page }) => {
    await page.goto("/bs/aswan.eats");
    await waitForHydration(page);
    const hours = page.getByRole("button", { name: "Working hours" });
    const links = page.getByRole("button", { name: /Contact and links/ });
    await hours.tap();
    await expect(hours).toHaveAttribute("aria-expanded", "true");
    await links.tap();
    await expect(links).toHaveAttribute("aria-expanded", "true");
    await expect(hours).toHaveAttribute("aria-expanded", "false");
  });

  test("name, bio and address follow the app language (English fallback)", async ({
    page,
    setLang,
  }) => {
    await setLang("ar");
    await page.goto("/bs/aswan.eats");
    await waitForHydration(page);
    await expect(page.getByRole("heading", { level: 2, name: "مطاعم أسوان" })).toBeVisible();
    await expect(page.getByText(/كشري وسمك مشوي/)).toBeVisible();
    await expect(page.getByText("شارع أبطال التحرير، قرب محطة القطار، أسوان")).toBeVisible();

    // No French name written → English.
    await setLang("fr");
    await page.goto("/bs/felucca.tours");
    await waitForHydration(page);
    await expect(
      page.getByRole("heading", { level: 2, name: "Elephantine Felucca Tours" }),
    ).toBeVisible();
  });

  test("search finds a business by its name in another language", async ({ page }) => {
    await page.goto("/search");
    await waitForHydration(page);
    const field = page.getByRole("searchbox", { name: "Search Qura" });
    await field.fill("صيدلية");
    await field.press("Enter");
    await expect(page.getByRole("link", { name: /El Shifa Pharmacy/ })).toBeVisible();
  });

  test("counts use the language's plural forms", async ({ page, setLang }) => {
    await page.goto("/bs/nileview/reviews");
    await waitForHydration(page);
    await expect(page.getByText(/^\d+ reviews$/)).toBeVisible();
    // Stars bars: "1 star", "2 stars"…
    await expect(page.getByRole("progressbar", { name: /^1 star: / })).toHaveCount(1);
    await expect(page.getByRole("progressbar", { name: /^2 stars: / })).toHaveCount(1);

    await setLang("ar");
    await page.reload();
    await waitForHydration(page);
    // Arabic: 2 → dual (نجمتان), 3–5 → نجوم.
    await expect(page.getByRole("progressbar", { name: /^[2٢] نجمتان: / })).toHaveCount(1);
    await expect(page.getByRole("progressbar", { name: /^[3٣] نجوم: / })).toHaveCount(1);
  });

  test("an unknown business is not found", async ({ page }) => {
    await page.goto("/bs/nobody-here");
    await expect(page.getByText("Page not found")).toBeVisible();
  });
});
