import { db } from "./auth";
import { expect, test, waitForHydration } from "./fixtures";

// Places as a tree, requests for new ones, and reporting a business.
// global-setup.ts removes everything these tests create ("E2E …" places,
// requests, reports).
test.describe.configure({ mode: "serial" });

test.describe("places", () => {
  // Place requests aren't launched yet (PLACE_REQUESTS in lib/features.ts).
  test.skip("can't find a place: request it from the picker, see it waiting, cancel it", async ({
    page,
    signIn,
  }) => {
    await signIn();
    await page.goto("/");
    await waitForHydration(page);
    await page.getByRole("button", { name: "City: Aswan" }).tap();
    await page.getByRole("button", { name: "Can't find your place? Request it" }).tap();
    await expect(page.getByRole("heading", { name: "Request a place" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Inside: Aswan" })).toBeVisible();

    await page.getByRole("textbox", { name: "Name (English)" }).fill("E2E Nubian Village");
    await page.getByRole("radio", { name: "Village" }).tap();
    await page.getByRole("textbox", { name: "Why add it? (optional)" }).fill("My village");
    await page.getByRole("button", { name: "Send request" }).tap();
    await expect(page.getByText("Request sent")).toBeVisible();

    await page.goto("/profile/places");
    const card = page.getByRole("listitem").filter({ hasText: "E2E Nubian Village" });
    await expect(card.getByText("Waiting")).toBeVisible();
    await waitForHydration(page);
    await card.getByRole("button", { name: "Cancel request" }).tap();
    await page.getByRole("dialog").getByRole("button", { name: "Cancel request" }).tap();
    await expect(card.getByText("Cancelled")).toBeVisible();
  });

  test("a post goes to the place picked in the form", async ({ page, signIn, context, baseURL }) => {
    await signIn();
    await page.goto("/posts/new");
    await waitForHydration(page);
    await page.getByRole("button", { name: "Where: Aswan" }).tap();
    await page.getByRole("button", { name: "Places in Aswan" }).tap();
    await page.getByRole("radio", { name: "Edfu" }).tap();
    await expect(page.getByRole("button", { name: "Where: Edfu, Aswan" })).toBeVisible();
    await page.getByRole("textbox").last().fill("E2E post for Edfu");
    await page.getByRole("button", { name: "Post", exact: true }).tap();
    await expect(page.getByText("Posted!")).toBeVisible();

    const [row] = await db()`
      select p.slug from posts join places p on p.id = posts.place_id
      where posts.body = 'E2E post for Edfu'`;
    expect(row.slug).toBe("edfu");
    // Edfu's feed has it.
    await context.addCookies([{ name: "qura__city", value: "edfu", url: baseURL! }]);
    await page.goto("/posts");
    await expect(page.getByText("E2E post for Edfu")).toBeVisible();
  });

  test("a business report is recorded", async ({ page, signIn }) => {
    await signIn();
    await page.goto("/bs/nileview");
    await waitForHydration(page);
    await page.getByRole("button", { name: "More options" }).tap();
    await page.getByRole("button", { name: "Report this business" }).tap();
    await page.getByRole("button", { name: "Wrong information" }).tap();
    await expect(page.getByText("Thanks for letting us know.")).toBeVisible();

    const [row] = await db()`
      select t.status from tickets t join businesses b on t.refs @> jsonb_build_array(jsonb_build_object('table', 'businesses', 'id', b.id::text))
      where t.type = 'report_business' and b.username = 'nileview' and t.data->>'reason' = 'wrong_info'`;
    expect(row.status).toBe("open");
  });
});
