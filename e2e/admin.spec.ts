import { execSync } from "node:child_process";

import { db, EMAIL } from "./auth";
import { expect, test, waitForHydration } from "./fixtures";

// Its own business (added by the test user, so global-setup.ts removes it),
// since other specs rely on every sample business being visible.
const HANDLE = "e2e.suspended";

test.describe("admin: pnpm admin", () => {
  test.beforeAll(async () => {
    const sql = db();
    const [{ id }] = await sql`
      insert into businesses (username, name, category, time_zone, created_by_id, owner_id)
      select ${HANDLE}, ${sql.json({ en: "Hidden Kiosk" })}, 'cafe', 'Africa/Cairo', id, id
      from users where email = ${EMAIL}
      on conflict (username) do update set suspended_at = null
      returning id`;
    await sql`delete from business_locations where business_id = ${id}`;
    await sql`delete from business_links where business_id = ${id}`;
    await sql`
      insert into business_locations (business_id, position, address, lat, lng)
      values (${id}, 0, ${sql.json({ en: "Aswan" })}, 24.09, 32.9)`;
    await sql`
      insert into business_links (business_id, position, platform, url)
      values (${id}, 0, 'whatsapp', 'https://wa.me/201000000000')`;
  });

  test("suspend hides a business from visitors (not its owner); restore brings it back", async ({
    page,
    signIn,
    pageErrors,
  }) => {
    const admin = (command: string) =>
      execSync(`pnpm -s admin ${command} @${HANDLE}`, { encoding: "utf8" });

    await page.goto(`/bs/${HANDLE}`);
    await expect(page.getByRole("heading", { level: 2, name: "Hidden Kiosk" })).toBeVisible();

    expect(admin("suspend")).toContain("suspendedAt");
    await page.goto(`/bs/${HANDLE}`);
    await expect(page.getByText("Page not found")).toBeVisible();
    pageErrors.splice(0, pageErrors.length, ...pageErrors.filter((e) => !e.includes("404")));
    await page.goto(`/search?q=${encodeURIComponent("Hidden Kiosk")}`);
    await waitForHydration(page);
    await expect(page.getByText("No results for “Hidden Kiosk”")).toBeVisible();

    // Its owner still has it, to fix whatever got it suspended.
    await signIn();
    await page.goto("/profile/businesses");
    await expect(page.getByRole("link", { name: /Hidden Kiosk/ })).toBeVisible();

    admin("restore");
    await page.goto(`/bs/${HANDLE}`);
    await expect(page.getByRole("heading", { level: 2, name: "Hidden Kiosk" })).toBeVisible();
  });
});
