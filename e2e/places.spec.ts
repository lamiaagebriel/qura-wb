import type { Browser, Page } from "@playwright/test";

import { ADMIN_EMAIL, db, EMAIL, signIn } from "./auth";
import { expect, hideDevBadge, test, waitForHydration } from "./fixtures";

// Places as a tree, requests for new ones, place admins and moderation.
// The test user is a regular user (and, here, an admin of Luxor); the test
// super admin works in the dashboard, in its own desktop-sized browser.
// global-setup.ts removes everything these tests create ("E2E …" places,
// requests, reports). In order: some tests build on the place admin set up
// in beforeAll.
test.describe.configure({ mode: "serial" });

const TARGET_EMAIL = "e2e-target@qura.test";

const userId = async (email: string) => {
  const [row] = await db()<{ id: string }[]>`select id from users where email = ${email}`;
  return row.id;
};

/** A "new place" request, as `openTicket` writes it (waiting, one per sender and name). */
async function requestPlace(email: string, parent: string, data: { name: { en: string }; typeId?: string; customType?: string; reason: string }) {
  const sql = db();
  const [place] = await sql<{ id: string }[]>`select id from places where slug = ${parent}`;
  const by = await userId(email);
  const name = data.name.en;
  await sql`
    insert into tickets (type, created_by_id, refs, data, open_key)
    values ('new_place', ${by}, ${sql.json([{ table: "places", id: place.id }])}, ${sql.json(data)},
      ${`new_place:${by}:places:${place.id}:${name.toLowerCase()}`})`;
}

/** The test super admin's own browser, on a desktop-sized screen. */
async function adminPage(browser: Browser, baseURL: string): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await hideDevBadge(context);
  await signIn(context, baseURL, "admin");
  return context.newPage();
}

test.describe("places", () => {
  test.beforeAll(async () => {
    const sql = db();
    await sql`
      insert into users (name, email, email_verified, username)
      values ('Target Person', ${TARGET_EMAIL}, true, 'e2e_target')
      on conflict (email) do update set status = 'active', role = 'member'`;
    await sql`
      insert into users (name, email, email_verified, username, role)
      values ('E2E Admin', ${ADMIN_EMAIL}, true, 'e2e_admin', 'super_admin')
      on conflict (email) do update set status = 'active', role = 'super_admin'`;
    // The test user (created on first sign-in) looks after Luxor.
    await sql`
      insert into users (name, email, email_verified, username)
      values ('E2E Tester', ${EMAIL}, true, 'e2e_tester')
      on conflict (email) do nothing`;
    await sql`
      insert into place_admins (place_id, user_id)
      select p.id, u.id from places p, users u
      where p.slug = 'luxor' and u.email = ${EMAIL}
      on conflict do nothing`;
  });

  test("can't find a place: request it from the picker, see it waiting, cancel it", async ({
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

  test("the super admin approves a request: the place exists and is in the picker", async ({
    page,
    signIn,
    browser,
    baseURL,
  }) => {
    const sql = db();
    // An "Other" type: it joins the list once the place is approved.
    await requestPlace(TARGET_EMAIL, "luxor", { name: { en: "E2E Karnak" }, customType: "E2E Temple town", reason: "Temples" });

    // Only the super admin answers place requests (in the dashboard).
    const admin = await adminPage(browser, baseURL!);
    await admin.goto("/admin/requests");
    await admin.getByRole("row", { name: /E2E Karnak/ }).getByRole("button", { name: "Approve" }).click();
    await expect(admin.getByText("Done: Approve")).toBeVisible();
    await admin.context().close();

    const [place] = await sql`
      select p.slug, t.listed from places p join place_types t on t.id = p.type_id
      where p.slug = 'e2e-karnak'`;
    expect(place).toMatchObject({ slug: "e2e-karnak", listed: true });

    // It's in the picker, inside Luxor.
    await signIn();
    await page.goto("/");
    await waitForHydration(page);
    await page.getByRole("button", { name: "City: Aswan" }).tap();
    await page.getByRole("button", { name: "Places in Luxor" }).tap();
    await page.getByRole("radio", { name: "E2E Karnak" }).tap();
    await expect(page.getByRole("button", { name: "City: E2E Karnak" })).toBeVisible();
  });

  test("the super admin rejects a request with a reason the requester sees", async ({
    page,
    signIn,
    browser,
    baseURL,
  }) => {
    await signIn();
    const [type] = await db()<{ id: string }[]>`select id from place_types where listed order by created_at limit 1`;
    await requestPlace(EMAIL, "qena", { name: { en: "E2E Nowhere" }, typeId: type.id, reason: "" });

    const admin = await adminPage(browser, baseURL!);
    await admin.goto("/admin/requests");
    const row = admin.getByRole("row", { name: /E2E Nowhere/ });
    await row.getByRole("button", { name: "Reject" }).click();
    await admin.getByRole("alertdialog").getByRole("textbox", { name: "Reason" }).fill("Not a real place");
    await admin.getByRole("alertdialog").getByRole("button", { name: "Reject" }).click();
    await expect(admin.getByText("Done: Reject")).toBeVisible();
    await admin.context().close();

    await page.goto("/profile/places");
    const card = page.getByRole("listitem").filter({ hasText: "E2E Nowhere" });
    await expect(card.getByText("Rejected")).toBeVisible();
    await expect(card.getByText("Not a real place")).toBeVisible();
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

  test("report → hidden for everyone but its author → edited → shown again", async ({
    page,
    signIn,
    browser,
    baseURL,
    context,
  }) => {
    const sql = db();
    const [post] = await sql<{ id: string }[]>`
      insert into posts (created_by_id, type, body, place_id)
      select ${await userId(EMAIL)}, 'general', 'E2E reported post, call 0100', id from places where slug = 'luxor'
      returning id`;

    // Someone reports it…
    const admin = await adminPage(browser, baseURL!);
    await admin.goto(`/p/${post.id}`);
    await admin.getByRole("button", { name: "Report post" }).click();
    await admin.getByRole("button", { name: "Spam or scam" }).click();
    await expect(admin.getByText("Thanks, an admin will look at it.")).toBeVisible();

    // …and it's hidden from the dashboard, with a reason.
    await admin.goto("/admin/reports");
    const row = admin.getByRole("row", { name: /E2E reported post/ });
    await row.getByRole("button", { name: "Hide post" }).click();
    await admin.getByRole("alertdialog").getByRole("textbox", { name: "Reason" }).fill("Please remove the phone number");
    await admin.getByRole("alertdialog").getByRole("button", { name: "Hide post" }).click();
    await expect(admin.getByText("Done: Hide post")).toBeVisible();

    // Gone from Luxor's feed; its author still sees it, and why.
    await signIn();
    await context.addCookies([{ name: "qura__city", value: "luxor", url: baseURL! }]);
    await page.goto("/posts");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("E2E reported post")).toHaveCount(0);
    await page.goto(`/p/${post.id}`);
    await expect(page.getByText("Hidden by an admin: only you can see this post")).toBeVisible();
    await expect(page.getByText("Please remove the phone number")).toBeVisible();

    // The author fixes it: it goes back to the admin.
    await page.goto(`/p/${post.id}/edit`);
    await waitForHydration(page);
    await page.getByRole("textbox").last().fill("E2E reported post, fixed");
    await page.getByRole("button", { name: "Save" }).tap();
    await expect(page.getByText("Post updated")).toBeVisible();
    await page.goto(`/p/${post.id}`);
    await expect(page.getByText("Hidden: an admin is looking at your edit")).toBeVisible();

    await admin.goto("/admin/reports");
    await admin
      .getByRole("row", { name: /E2E reported post, fixed/ })
      .getByRole("button", { name: "Show again" })
      .click();
    await expect(admin.getByText("Done: Show again")).toBeVisible();
    await admin.context().close();

    await page.goto("/posts");
    await expect(page.getByText("E2E reported post, fixed")).toBeVisible();
  });

  test("a business report reaches the dashboard", async ({ page, signIn, browser, baseURL }) => {
    await signIn();
    await page.goto("/bs/nileview");
    await waitForHydration(page);
    await page.getByRole("button", { name: "More options" }).tap();
    await page.getByRole("button", { name: "Report this business" }).tap();
    await page.getByRole("button", { name: "Wrong information" }).tap();
    await expect(page.getByText("Thanks, an admin will look at it.")).toBeVisible();

    const admin = await adminPage(browser, baseURL!);
    await admin.goto("/admin/reports");
    const row = admin.getByRole("row", { name: /Nile View Hotel/ });
    await expect(row.getByText("Wrong information")).toBeVisible();
    await row.getByRole("button", { name: "Nothing wrong" }).click();
    await expect(admin.getByText("Done: Nothing wrong")).toBeVisible();
    await admin.context().close();
  });
});
