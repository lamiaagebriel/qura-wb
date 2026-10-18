import type { Page } from "@playwright/test";

import { ADMIN_EMAIL, db, EMAIL } from "./auth";
import { expect, pathname, test } from "./fixtures";

// The super admin dashboard (`app/(admin)`): every table, record pages
// (edit / actions / locked fields / delete), the inbox and history. Desktop-
// sized except where noted. Its own business, user and post to act on, so
// the other specs aren't affected.
const HANDLE = "e2e.dashboard";
const TARGET_EMAIL = "e2e-target@qura.test";
// Anonymized by a test (made again, as new, before each run).
const ANON_EMAIL = "e2e-anon@qura.test";

const TABLES = [
  "users", "place-admins", "follows", "businesses", "branches", "reviews", "posts", "votes",
  "saves", "places", "place-types", "tickets", "history", "sessions", "accounts",
  "verifications", "rate-limits",
];

/** Hydrated: the sidebar's links are React's. */
async function waitForDashboard(page: Page) {
  await page.waitForFunction(() => {
    const link = document.querySelector("[data-slot=sidebar-menu-button]");
    return !!link && Object.keys(link).some((k) => k.startsWith("__reactProps$"));
  });
  await page.waitForLoadState("networkidle");
}

/** Opens a table's first row matching `text`, from a search. */
async function openRecord(page: Page, table: string, text: string) {
  await page.goto(`/admin/${table}?q=${encodeURIComponent(text)}`);
  await waitForDashboard(page);
  // The first cell: other cells may hold links (an owner, a place…).
  await page.getByRole("row", { name: new RegExp(text) }).first().getByRole("cell").first().click();
  await expect(page).toHaveURL(new RegExp(`/admin/${table}/[0-9a-f-]{36}`));
  await waitForDashboard(page);
}

test.describe("admin dashboard", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    const sql = db();
    await sql`
      insert into users (name, email, email_verified, username, role)
      values ('E2E Admin', ${ADMIN_EMAIL}, true, 'e2e_admin', 'super_admin')
      on conflict (email) do update set status = 'active', role = 'super_admin'`;
    await sql`
      insert into users (name, email, email_verified, username)
      values ('Target Person', ${TARGET_EMAIL}, true, 'e2e_target')
      on conflict (email) do update set status = 'active', role = 'member', name = 'Target Person', username = 'e2e_target'`;
    // Added by the test user, so global-setup.ts removes it.
    await sql`
      insert into businesses (username, name, category, time_zone, created_by_id, owner_id, status)
      select ${HANDLE}, ${sql.json({ en: "Dashboard Bakery" })}, 'cafe', 'Africa/Cairo', id, id, 'active'
      from users where email = ${EMAIL}
      on conflict (username) do update set status = 'active', verified = false, name = excluded.name, links = '[]'`;
    // No branch or WhatsApp yet: it can't be made live until it has both.
    await sql`delete from business_locations where business_id = (select id from businesses where username = ${HANDLE})`;
  });

  test("every table opens, with no errors", async ({ page, signIn }) => {
    await signIn("admin");
    for (const table of TABLES) {
      await page.goto(`/admin/${table}`);
      await expect(page.getByRole("heading", { level: 1 }), table).toBeVisible();
      await expect(page.getByRole("table"), table).toBeVisible();
    }
  });

  test("overview: what's waiting, then the numbers with their trends", async ({ page, signIn }) => {
    await signIn("admin");
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open requests/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open reports/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Numbers/ })).toBeVisible();
    await expect(page.locator("[data-slot=chart]")).toHaveCount(3);
  });

  test("the sidebar moves between sections", async ({ page, signIn }) => {
    await signIn("admin");
    await page.goto("/admin");
    await waitForDashboard(page);
    const sidebar = page.locator("[data-slot=sidebar]");
    await sidebar.getByRole("link", { name: "Businesses", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: /Businesses/ })).toBeVisible();
    expect(pathname(page)).toBe("/admin/businesses");
    await sidebar.getByRole("link", { name: "History" }).click();
    await expect(page.getByRole("heading", { level: 1, name: /History/ })).toBeVisible();
  });

  test("tables search, filter, sort and hide columns — all in the URL", async ({ page, signIn }) => {
    await signIn("admin");
    await page.goto("/admin/businesses");
    await waitForDashboard(page);
    await page.getByRole("searchbox", { name: "Search by name or @username" }).fill("Dashboard Bakery");
    await expect(page).toHaveURL(/q=Dashboard\+Bakery/);
    await expect(page.getByRole("row", { name: /Dashboard Bakery/ })).toHaveCount(1);
    // No ids anywhere: the owner is a name, linking to their user page.
    const row = page.getByRole("row", { name: /Dashboard Bakery/ });
    await expect(row.getByRole("link", { name: "E2E Tester" })).toHaveAttribute("href", /\/admin\/users\//);
    await expect(row).not.toContainText(/[0-9a-f]{8}-[0-9a-f]{4}-/);

    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Suspended" }).click();
    await expect(page).toHaveURL(/status=suspended/);
    await expect(page.getByText("Nothing found")).toBeVisible();
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page).not.toHaveURL(/status=/);

    await page.getByRole("button", { name: "Sort by Added" }).click();
    await expect(page).toHaveURL(/sort=/);

    await page.getByRole("button", { name: "Columns" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Category" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("columnheader", { name: "Category" })).toHaveCount(0);
  });

  test("a business: edit (zod-checked), actions, locked fields, history", async ({ page, signIn }) => {
    await signIn("admin");
    await openRecord(page, "businesses", "Dashboard Bakery");
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard Bakery" })).toBeVisible();

    // Locked, with why.
    const locked = page.getByRole("complementary");
    await expect(locked.getByText("Its page address: shared links would break. Its owner can change it.")).toBeVisible();

    // The form refuses an empty name (zod), then saves a real one.
    const name = page.getByRole("textbox", { name: "Name (English)" });
    await name.fill("");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Required").first()).toBeVisible();
    await name.fill("Dashboard Bakery & Co");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Saved")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard Bakery & Co" })).toBeVisible();

    // An unknown owner is refused by the server, on the field.
    await page.getByRole("textbox", { name: /Owner's @username/ }).fill("nobody_here_xyz");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Nobody has this username")).toBeVisible();
    await page.getByRole("button", { name: "Undo changes" }).click();

    // Actions: verify; suspend asks first; make live again.
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page.getByText("Done: Verify")).toBeVisible();
    await page.getByRole("button", { name: "Suspend" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Suspend" }).click();
    await expect(page.getByText("Suspended").first()).toBeVisible();
    // Going live needs a branch and a WhatsApp link: refused without them…
    await page.getByRole("button", { name: "Make live" }).click();
    await expect(page.getByText("It needs a branch and a WhatsApp number first.")).toBeVisible();
    // …and works once it has both.
    const sql = db();
    await sql`
      update businesses set links = ${sql.json([{ platform: "whatsapp", url: "https://wa.me/201000000000" }])}
      where username = ${HANDLE}`;
    await sql`
      insert into business_locations (business_id, position, address, lat, lng, place_id)
      select b.id, 0, ${sql.json({ en: "Corniche" })}, 24.09, 32.9, p.id
      from businesses b, places p where b.username = ${HANDLE} and p.slug = 'aswan'`;
    await page.reload();
    await page.getByRole("button", { name: "Make live" }).click();
    await expect(page.getByText("Done: Make live")).toBeVisible();

    // Every action is in history, with the rows it changed. History is
    // never cleared: earlier runs are there too, newest first.
    await page.goto("/admin/history?q=businesses.");
    await expect(page.getByRole("row", { name: /businesses\.update/ }).first()).toBeVisible();
    await expect(page.getByRole("row", { name: /businesses\.verify/ }).first()).toBeVisible();
    await expect(page.getByRole("row", { name: /businesses\.status:suspended/ }).first()).toBeVisible();
    // An action opens its changes: the name, before → after.
    await page.getByRole("row", { name: /businesses\.update/ }).first().getByRole("cell").first().click();
    await expect(page).toHaveURL(/actionId=\d+/);
    await expect(page.getByRole("row", { name: /Dashboard Bakery → Dashboard Bakery & Co/ }).first()).toBeVisible();
  });

  test("a user: suspend (asks first), restore, admin role; a taken username is refused", async ({ page, signIn }) => {
    await signIn("admin");
    await openRecord(page, "users", "Target Person");
    await page.getByRole("button", { name: "Suspend" }).click();
    await expect(page.getByRole("alertdialog").getByText("Suspend Target Person?")).toBeVisible();
    await page.getByRole("alertdialog").getByRole("button", { name: "Suspend" }).click();
    await expect(page.getByRole("button", { name: "Restore" })).toBeVisible();
    await page.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByRole("button", { name: "Suspend" })).toBeVisible();

    await page.getByRole("button", { name: "Make admin" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Make admin" }).click();
    await expect(page.getByRole("button", { name: "Remove admin" })).toBeVisible();
    await page.getByRole("button", { name: "Remove admin" }).click();
    await expect(page.getByRole("button", { name: "Make admin" })).toBeVisible();

    await page.getByRole("textbox", { name: "Username" }).fill("e2e_admin");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("This username is taken")).toBeVisible();
  });

  test("your own user page has no actions (you can't lock yourself out)", async ({ page, signIn }) => {
    await signIn("admin");
    await openRecord(page, "users", "E2E Admin");
    await expect(page.getByRole("button", { name: "Suspend" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Remove admin" })).toHaveCount(0);
  });

  test("a post: deleting needs the typed word", async ({ page, signIn }) => {
    const sql = db();
    await sql`
      insert into posts (created_by_id, type, body, place_id)
      select u.id, 'general', 'E2E spam to delete', p.id
      from users u, places p where u.email = ${TARGET_EMAIL} and p.slug = 'aswan'`;
    await signIn("admin");
    await openRecord(page, "posts", "E2E spam to delete");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    const dialog = page.getByRole("alertdialog");
    const confirm = dialog.getByRole("button", { name: "Delete" });
    await expect(confirm).toBeDisabled();
    await dialog.getByRole("textbox").fill("delete");
    await confirm.click();
    await expect(page).toHaveURL(/\/admin\/posts$/);
    const [left] = await sql`select count(*)::int as n from posts where body = 'E2E spam to delete'`;
    expect(left.n).toBe(0);
  });

  test("reports inbox: a report is answered in place, and leaves the inbox", async ({ page, signIn }) => {
    const sql = db();
    const [post] = await sql`
      insert into posts (created_by_id, type, body, place_id)
      select u.id, 'general', 'E2E reported post', p.id
      from users u, places p where u.email = ${TARGET_EMAIL} and p.slug = 'aswan'
      returning id`;
    await sql`
      insert into tickets (type, created_by_id, refs, data, open_key)
      select 'report_post', id, ${sql.json([{ table: "posts", id: post.id }])},
        ${sql.json({ reason: "spam", note: "E2E looks like spam" })}, 'e2e-report-' || ${post.id}
      from users where email = ${EMAIL}`;

    await signIn("admin");
    await page.goto("/admin/reports");
    await waitForDashboard(page);
    const row = page.getByRole("row", { name: /E2E reported post/ });
    await expect(row).toContainText("Spam or scam");
    await expect(row).toContainText("E2E looks like spam");
    await row.getByRole("button", { name: "Nothing wrong" }).click();
    await expect(page.getByText("Done: Nothing wrong")).toBeVisible();
    await expect(page.getByRole("row", { name: /E2E reported post/ })).toHaveCount(0);

    // The ticket is dismissed, with its answer in history; the post stays.
    const [ticket] = await sql`select status from tickets where refs @> ${sql.json([{ table: "posts", id: post.id }])}`;
    expect(ticket.status).toBe("dismissed");
    const [kept] = await sql`select status from posts where id = ${post.id}`;
    expect(kept.status).toBe("visible");
  });

  test("a review: hiding asks for a reason, showing brings it back", async ({ page, signIn }) => {
    const sql = db();
    await sql`
      insert into business_reviews (business_id, author_id, rating, text)
      select b.id, u.id, 1, 'E2E unfair review'
      from businesses b, users u where b.username = ${HANDLE} and u.email = ${TARGET_EMAIL}
      on conflict (business_id, author_id) do update set status = 'visible', text = excluded.text`;
    await signIn("admin");
    // Its first cell links to the business: open it from the review's text.
    await page.goto(`/admin/reviews?q=${encodeURIComponent("E2E unfair review")}`);
    await waitForDashboard(page);
    await page.getByRole("cell", { name: "E2E unfair review" }).first().click();
    await expect(page).toHaveURL(/\/admin\/reviews\/[0-9a-f-]{36}/);
    await waitForDashboard(page);
    await page.getByRole("button", { name: "Hide review" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByRole("button", { name: "Hide review" })).toBeDisabled();
    await dialog.getByRole("textbox").fill("Not a real visit.");
    await dialog.getByRole("button", { name: "Hide review" }).click();
    await expect(page.getByRole("button", { name: "Show again" })).toBeVisible();
    await page.getByRole("button", { name: "Show again" }).click();
    await expect(page.getByRole("button", { name: "Hide review" })).toBeVisible();
  });

  test("a user: 'Erase for good' needs their @username typed, then anonymizes them", async ({ page, signIn }) => {
    const sql = db();
    // A fresh person each run (the last run's is "Deleted account" now).
    await sql`
      insert into users (name, email, email_verified, username, bio)
      values ('Anon Person', ${ANON_EMAIL}, true, 'e2e_anon', 'Private bio')
      on conflict (email) do nothing`;
    await signIn("admin");
    await openRecord(page, "users", "Anon Person");
    await page.getByRole("button", { name: "Erase for good" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText("Erase Anon Person for good?")).toBeVisible();
    const erase = dialog.getByRole("button", { name: "Erase for good" });
    // Only the exact @username lets it through.
    await dialog.getByRole("textbox").fill("e2e_anon");
    await expect(erase).toBeDisabled();
    await dialog.getByRole("textbox").fill("@e2e_anon");
    await erase.click();
    await expect(page.getByRole("heading", { level: 1, name: "Deleted account" })).toBeVisible();
    // Nothing left to do with it.
    await expect(page.getByRole("button", { name: "Suspend" })).toHaveCount(0);

    const [gone] = await sql`select count(*)::int as n from users where email = ${ANON_EMAIL}`;
    expect(gone.n).toBe(0);
    // Its old name and bio aren't in history either.
    const [kept] = await sql`select count(*)::int as n from history where changes::text like '%Private bio%'`;
    expect(kept.n).toBe(0);
  });

  test("places: add one, add an admin to it, delete it while empty", async ({ page, signIn }) => {
    await signIn("admin");
    await page.goto("/admin/places");
    await waitForDashboard(page);
    await page.getByRole("link", { name: "Add" }).click();
    await waitForDashboard(page);
    await page.getByRole("textbox", { name: "Name (English)" }).fill("E2E Dash Town");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "E2E Dash Town" })).toBeVisible();

    await page.getByRole("button", { name: "Add an admin" }).click();
    await page.getByRole("alertdialog").getByRole("textbox").fill("@e2e_target");
    await page.getByRole("alertdialog").getByRole("button", { name: "Add an admin" }).click();
    await expect(page.getByRole("link", { name: "Target Person" })).toBeVisible();

    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("textbox").fill("delete");
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(/\/admin\/places$/);
  });
});

test.describe("admin dashboard on a phone", () => {
  test("the sidebar opens as a sheet and closes after picking a section", async ({ page, signIn }) => {
    await signIn("admin");
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("link", { name: "Requests", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: /Requests/ })).toBeVisible();
    await expect(sheet).toBeHidden();
  });

  test("non-admins get a 404", async ({ page, signIn, pageErrors }) => {
    await signIn();
    await page.goto("/admin/users");
    await expect(page.getByText("Page not found")).toBeVisible();
    pageErrors.splice(0, pageErrors.length, ...pageErrors.filter((e) => !e.includes("404")));
  });
});
