import { execSync } from "node:child_process";

import { db, EMAIL } from "./auth";
import { expect, pathname, test, waitForHydration } from "./fixtures";

// Its own businesses (added by the test user, so global-setup.ts removes
// them): one the test user owns, one they only added (owned by nobody).
const OWNED = "e2e.status.owned";
const ADDED = "e2e.status.added";

async function addBusiness(handle: string, name: string, owned: boolean) {
  const sql = db();
  const [{ id }] = await sql`
    insert into businesses (username, name, category, time_zone, created_by_id, owner_id, status)
    select ${handle}, ${sql.json({ en: name })}, 'cafe', 'Africa/Cairo', id, ${owned ? sql`id` : null}, 'pending'
    from users where email = ${EMAIL}
    on conflict (username) do update set status = 'pending'
    returning id`;
  await sql`delete from business_locations where business_id = ${id}`;
  await sql`delete from tickets where refs @> ${sql.json([{ table: "businesses", id }])}`;
  await sql`
    insert into business_locations (business_id, position, address, lat, lng, place_id)
    select ${id}, 0, ${sql.json({ en: "Aswan" })}, 24.09, 32.9, id from places where slug = 'aswan'`;
  await sql`
    update businesses set links = ${sql.json([{ platform: "whatsapp", url: "https://wa.me/201000000000" }])}
    where id = ${id}`;
}

const admin = (command: string, handle: string) =>
  execSync(`pnpm -s admin ${command} @${handle}`, { encoding: "utf8" });

// Serial: every test resets the same two businesses.
test.describe.configure({ mode: "serial" });

test.describe("business status", () => {
  test.beforeEach(async () => {
    await addBusiness(OWNED, "Status Café", true);
    await addBusiness(ADDED, "Added Kiosk", false);
  });

  test("pending: hidden from visitors until approved; then live", async ({ page, pageErrors }) => {
    await page.goto(`/bs/${OWNED}`);
    await expect(page.getByText("Page not found")).toBeVisible();
    pageErrors.splice(0, pageErrors.length, ...pageErrors.filter((e) => !e.includes("404")));

    admin("approve", OWNED);
    await page.goto(`/bs/${OWNED}`);
    await expect(page.getByRole("heading", { level: 2, name: "Status Café" })).toBeVisible();
    await expect(page.getByText("Waiting for approval — only you can see this page.")).toHaveCount(0);
  });

  test("the owner closes and reopens it with the form; closed pages say so", async ({ page, signIn }) => {
    admin("approve", OWNED);
    await signIn();
    const save = async () => {
      await page.getByRole("button", { name: "Save changes" }).tap();
      await expect(page.getByText("Changes saved")).toBeVisible();
    };
    const open = page.getByRole("region", { name: "Status" }).getByRole("switch", { name: /Open/ });

    await page.goto(`/profile/businesses/${OWNED}`);
    await waitForHydration(page);
    await expect(open).toBeChecked();
    // Nothing changes until the form is saved.
    await open.tap();
    await expect(page.getByText("Saved when you save your changes.")).toBeVisible();
    await save();

    await page.goto(`/bs/${OWNED}`);
    await expect(page.getByText("This business has closed.")).toBeVisible();

    await page.goto(`/profile/businesses/${OWNED}`);
    await waitForHydration(page);
    await expect(open).not.toBeChecked();
    await open.tap();
    await save();
    await page.goto(`/profile/businesses/${OWNED}`);
    await expect(open).toBeChecked();
  });

  test("its creator (no owner yet): closes and reopens it directly, like an owner", async ({ page, signIn }) => {
    admin("approve", ADDED);
    await signIn();
    const status = page.getByRole("region", { name: "Status" });
    const open = status.getByRole("switch", { name: /Open/ });
    const save = async () => {
      await page.getByRole("button", { name: "Save changes" }).tap();
      await expect(page.getByText("Changes saved", { exact: true })).toBeVisible();
    };

    await page.goto(`/profile/businesses/${ADDED}`);
    await waitForHydration(page);
    await open.tap();
    // No admin in between (NOTEPAD Step A).
    await expect(status.getByText("Saving will ask an admin to make it “Closed”.")).toHaveCount(0);
    await save();
    await page.goto(`/bs/${ADDED}`);
    await expect(page.getByText("This business has closed.")).toBeVisible();

    await page.goto(`/profile/businesses/${ADDED}`);
    await waitForHydration(page);
    await expect(open).not.toBeChecked();
    await open.tap();
    await save();
    await page.goto(`/profile/businesses/${ADDED}`);
    await expect(open).toBeChecked();
  });

  test("the owner deletes it, after confirming", async ({ page, signIn, pageErrors }) => {
    await signIn();
    await page.goto(`/profile/businesses/${OWNED}`);
    await waitForHydration(page);
    await page.getByRole("button", { name: "Delete business" }).tap();
    await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).tap();
    await expect(page.getByText("Business deleted")).toBeVisible();
    await expect.poll(() => pathname(page)).toBe("/profile/businesses");
    await expect(page.getByRole("link", { name: /Status Café/ })).toHaveCount(0);

    await page.goto(`/bs/${OWNED}`);
    await expect(page.getByText("Page not found")).toBeVisible();
    pageErrors.splice(0, pageErrors.length, ...pageErrors.filter((e) => !e.includes("404")));
  });

  test("a visitor reports a business closed", async ({ page, signIn }) => {
    await signIn();
    await page.goto("/bs/nileview");
    await waitForHydration(page);
    // In the top bar's options sheet.
    await page.getByRole("button", { name: "More options" }).tap();
    await page.getByRole("button", { name: "Has this place closed? Tell us" }).tap();
    await page.getByRole("dialog", { name: "Report it as closed?" }).getByRole("button", { name: "Report" }).tap();
    await expect(page.getByText("Thanks, we'll check if it's closed.")).toBeVisible();
    // Reported: the option is gone, even after a reload.
    await page.reload();
    await waitForHydration(page);
    await page.getByRole("button", { name: "More options" }).tap();
    await expect(page.getByRole("button", { name: "Report this business" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Has this place closed? Tell us" })).toHaveCount(0);
    await expect.poll(() => pathname(page)).toBe("/bs/nileview");
  });

  test("the admin screen is a 404 for non-admins", async ({ page, signIn, pageErrors }) => {
    await signIn();
    await page.goto("/admin");
    await expect(page.getByText("Page not found")).toBeVisible();
    pageErrors.splice(0, pageErrors.length, ...pageErrors.filter((e) => !e.includes("404")));
  });
});
