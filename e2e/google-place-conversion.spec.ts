import { expect, test, type Page } from "@playwright/test";
import { eq, inArray, like } from "drizzle-orm";

import { db, schema } from "@/db";

import { runId } from "./fixtures";

/**
 * Phase 22 — the one thing every prior phase's real-Postgres harness
 * couldn't reach: does clicking "Add to Qura" in an actual browser, on
 * the actual running Next.js app, actually walk a real signed-in user
 * through to a connected profile? `playwright.config.ts` boots a real
 * `next dev` server with only the Google Places HTTP boundary stubbed
 * (`src/instrumentation.ts`) — everything else (cookies, sessions,
 * server actions, the database) is exactly what a real user would hit.
 */

const RUN = runId();

function uniqueUsername(label: string): string {
  return `${RUN}_${label}`.toLowerCase();
}

async function signUp(page: Page, label: string) {
  const email = `${RUN}_${label}@example.invalid`;
  await page.goto("/signup");
  await page.getByLabel("Full name").fill(`${RUN} ${label}`);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("correct horse battery staple 1");
  await page.getByRole("button", { name: "Create my profile" }).click();
  // Emails aren't verified in this harness (`requireEmailVerification:
  // false`, see `lib/auth/auth.ts`) — signup still redirects to
  // `/verify-email`, which is fine: `getGuardedUser()` doesn't require
  // `emailVerified`, only a non-suspended session, and neither `/search`
  // nor `/categories` are gated by the proxy either.
  await page.waitForURL(/\/verify-email/);
}

async function resultRow(page: Page, placeName: string) {
  const row = page.locator("li", { hasText: placeName });
  await expect(row).toBeVisible({ timeout: 10_000 });
  return row;
}

async function searchFor(page: Page, query: string) {
  await page.goto("/search");
  await page.getByPlaceholder("Search businesses").fill(query);
  // Search view debounces 300ms before firing.
  await page.waitForTimeout(500);
}

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  // ─── Cleanup — every fixture this file created, by RUN prefix ─────────
  await db
    .delete(schema.googlePlaceClaimConflicts)
    .where(
      inArray(
        schema.googlePlaceClaimConflicts.googlePlaceId,
        (await db.query.businessGooglePlaces.findMany({
          where: like(schema.businessGooglePlaces.googlePlaceId, `${RUN}_place_%`),
          columns: { googlePlaceId: true },
        })).map((b) => b.googlePlaceId),
      ),
    );
  const fixtureUsers = await db.query.users.findMany({
    where: like(schema.users.username, `${RUN}%`),
    columns: { id: true },
  });
  if (fixtureUsers.length > 0) {
    await db.delete(schema.users).where(
      inArray(
        schema.users.id,
        fixtureUsers.map((u) => u.id),
      ),
    );
  }
  const leftover = await db.query.users.findMany({
    where: like(schema.users.username, `${RUN}%`),
  });
  expect(leftover.length, "every Phase 22 E2E fixture row was cleaned up").toBe(0);
});

test("1. signed-out visitor sees the Google-only result, but Add to Qura requires sign-in", async ({
  page,
}) => {
  await searchFor(page, `${RUN} Happy Cafe`);
  const row = await resultRow(page, `${RUN} Happy Cafe`);

  const addButton = row.getByRole("button", { name: "Add to Qura" });
  await expect(addButton).toBeVisible();
  // Not rendered as a clickable Qura profile — no /profile link for a
  // Google-only result.
  await expect(row.locator("a")).toHaveCount(0);

  await addButton.click();
  await expect(page.getByText("You need to sign in to do that.")).toBeVisible();
  // No sheet/dialog opened — the guarded check failed before any UI did.
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("2. signed-in user completes the full conversion flow, with edits persisted", async ({
  page,
}) => {
  await signUp(page, "happy_owner");

  await searchFor(page, `${RUN} Happy Cafe`);
  const row = await resultRow(page, `${RUN} Happy Cafe`);
  await row.getByRole("button", { name: "Add to Qura" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // Preview step: Google-attributed, honest, no verification claim.
  await expect(dialog.getByText(`${RUN} Happy Cafe`, { exact: true })).toBeVisible();
  await expect(dialog.getByText(`${RUN} Happy Cafe address`)).toBeVisible();
  await expect(
    dialog.getByText(
      "This creates a new Qura profile connected to this Google Place. It doesn't verify that you own or manage the real business.",
    ),
  ).toBeVisible();

  await dialog.getByRole("button", { name: "Continue" }).click();

  // Form step: Google name prefilled, username left for the user to
  // choose (never silently derived), category pre-suggested from
  // `types: ["cafe"]` -> "food-drinks" but still an editable Select.
  const nameInput = dialog.locator("#atq-name");
  await expect(nameInput).toHaveValue(`${RUN} Happy Cafe`);
  await expect(dialog.locator("#atq-username")).toHaveValue("");
  await expect(dialog.locator("#atq-category")).toContainText("Food & Drinks");
  await expect(dialog.locator("#atq-city")).toContainText("Aswan");

  const username = uniqueUsername("happy_biz");
  await dialog.locator("#atq-username").fill(username);

  // City is user-editable and the user's final choice must persist.
  await dialog.locator("#atq-city").click();
  await page.getByRole("option", { name: "Luxor" }).click();
  await expect(dialog.locator("#atq-city")).toContainText("Luxor");

  await dialog.getByRole("button", { name: "Add to Qura" }).click();

  await expect(
    dialog.getByText("Your Qura profile is connected to this Google Place."),
  ).toBeVisible({ timeout: 10_000 });
  await dialog.getByRole("button", { name: "Done" }).click();

  await page.waitForURL(new RegExp(`/profile/${username}`));

  // ─── Real-database assertions against what the browser flow produced ──
  const business = await db.query.users.findFirst({
    where: eq(schema.users.username, username),
  });
  expect(business, "exactly one business row was created").toBeTruthy();
  expect(business?.status).toBe("active");

  const block = await db.query.businessBlocks.findFirst({
    where: eq(schema.businessBlocks.businessId, business!.id),
  });
  const connection = await db.query.businessGooglePlaces.findFirst({
    where: eq(schema.businessGooglePlaces.businessId, business!.id),
  });
  expect(connection?.googlePlaceId).toBe(`${RUN}_place_happy`);
  expect(block?.category).toBe("food-drinks");
  // The user's final city choice (Luxor), not the server's default (Aswan).
  expect(block?.city).toBe("luxor");
});

test("3a. the same place, searched under a DIFFERENT city than the new business, still reads as Google-only (Phase 18 city scoping, not a bug)", async ({
  page,
}) => {
  await searchFor(page, `${RUN} Happy Cafe`);
  const row = await resultRow(page, `${RUN} Happy Cafe`);
  await expect(row.getByRole("button", { name: "Add to Qura" })).toBeVisible();
});

test("3. after conversion, the same place resurfaces as a connected result, not Google-only", async ({
  page,
}) => {
  // Test 2 created the business in Luxor (the user's own city choice on
  // the form), and Phase 18's city scoping deliberately excludes a
  // connected-but-different-city business from a search's "connected"
  // group entirely — so this has to search under Luxor's active-city
  // scope to see the connection; under the default Aswan scope the same
  // place correctly still renders as Google-only (verified separately,
  // see the report's city-scope observation).
  await page.context().addCookies([
    { name: "qura__active_city", value: "luxor", domain: "localhost", path: "/" },
  ]);

  // No sign-in needed — this is what any subsequent visitor's search sees.
  await searchFor(page, `${RUN} Happy Cafe`);
  const row = await resultRow(page, `${RUN} Happy Cafe`);

  // The row is now a real Qura profile link; "Add to Qura" is gone.
  // (Observation for the Phase 22 report: this also means the click-time
  // same-user dedup check and a second independent user's conflict path
  // are exercised at the server-action layer only — see the report.)
  await expect(row.getByRole("button", { name: "Add to Qura" })).toHaveCount(0);
  await expect(row.locator("a")).toHaveCount(1);
});

test("4. canceling at either step creates nothing", async ({ page }) => {
  await signUp(page, "cancel_owner");

  await searchFor(page, `${RUN} Cancel Cafe`);
  let row = await resultRow(page, `${RUN} Cancel Cafe`);
  await row.getByRole("button", { name: "Add to Qura" }).click();

  let dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();

  await searchFor(page, `${RUN} Cancel Cafe`);
  row = await resultRow(page, `${RUN} Cancel Cafe`);
  await row.getByRole("button", { name: "Add to Qura" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Continue" }).click();
  await dialog.getByRole("button", { name: "Back" }).click();
  await expect(dialog.getByRole("button", { name: "Continue" })).toBeVisible();

  const connection = await db.query.businessGooglePlaces.findFirst({
    where: eq(schema.businessGooglePlaces.googlePlaceId, `${RUN}_place_cancel`),
  });
  expect(connection, "no connection was created by opening/canceling the sheet").toBeFalsy();
});

test("5. username validation: invalid, then taken, then valid", async ({ page }) => {
  const takenUsername = uniqueUsername("taken");
  // Seed a pre-existing username collision directly against the real DB —
  // equivalent to another real signup having already taken it.
  await db.insert(schema.users).values({
    name: `${RUN} Taken`,
    email: `${RUN}_taken@example.invalid`,
    emailVerified: true,
    username: takenUsername,
    role: "business_owner",
    status: "active",
  });

  await signUp(page, "validate_owner");
  await searchFor(page, `${RUN} Validate Cafe`);
  const row = await resultRow(page, `${RUN} Validate Cafe`);
  await row.getByRole("button", { name: "Add to Qura" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Continue" }).click();
  const usernameInput = dialog.locator("#atq-username");

  // Invalid characters — rejected server-side. NOTE (Phase 22 finding):
  // `AddToQuraSheet` calls `handleAppError(result.error)` with no `form`
  // argument (it's plain `useState`, not `react-hook-form` like
  // `createBusinessAction`'s form), so every validation issue — even a
  // field-shaped one — surfaces as a page-level toast, not an inline
  // error next to the username input the way the manual creation form
  // does. Asserted against the toast region here, not the dialog.
  await usernameInput.fill("Invalid Username!!");
  await dialog.getByRole("button", { name: "Add to Qura" }).click();
  await expect(page.getByText(/lowercase letters, numbers, underscores/i)).toBeVisible();
  await expect(dialog).toBeVisible();

  // Already-taken username.
  await usernameInput.fill(takenUsername);
  await dialog.getByRole("button", { name: "Add to Qura" }).click();
  await expect(page.getByText("That username is already taken.")).toBeVisible();
  await expect(dialog).toBeVisible();

  const noPartialConnection = await db.query.businessGooglePlaces.findFirst({
    where: eq(schema.businessGooglePlaces.googlePlaceId, `${RUN}_place_validate`),
  });
  expect(
    noPartialConnection,
    "no partial business was created by either failed attempt",
  ).toBeFalsy();

  // Now a genuinely valid, available username succeeds.
  const goodUsername = uniqueUsername("validate_biz");
  await usernameInput.fill(goodUsername);
  await dialog.getByRole("button", { name: "Add to Qura" }).click();
  await expect(
    dialog.getByText("Your Qura profile is connected to this Google Place."),
  ).toBeVisible({ timeout: 10_000 });
});

test("6. the same entry point works from category discovery, not just unified search", async ({
  page,
}) => {
  await signUp(page, "category_owner");
  await page.goto("/categories/food-drinks");

  const row = page.locator("li", { hasText: `${RUN} Category Cafe` });
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.getByRole("button", { name: "Add to Qura" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
});

test("7. the manual 'Create business profile' form can also start from a picked Google Place, prefilling fields", async ({
  page,
}) => {
  await signUp(page, "create_owner");
  await page.goto("/account/business");

  await page.getByRole("button", { name: "Start from a Google Place" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await sheet.getByPlaceholder("Search for your business...").fill(`${RUN} Create Cafe`);
  await sheet.getByText(`${RUN} Create Cafe`, { exact: true }).click();
  await expect(sheet).toBeHidden();

  // Name prefilled from the picked place; category auto-suggested from
  // its `types: ["cafe"]` -> food-drinks, still an editable Select.
  await expect(page.getByLabel("Business name")).toHaveValue(`${RUN} Create Cafe`);
  await expect(page.getByText(`${RUN} Create Cafe address`).first()).toBeVisible();

  const username = uniqueUsername("create_biz");
  await page.getByLabel("Username").fill(username);
  // The auto-suggested "Food & Drinks" category still requires its own
  // "Cuisine" field, same as the blank manual-creation path — Google's
  // `types` are a category signal only, never a substitute for the
  // category-specific block fields the create form still needs filled.
  await page.getByLabel("Cuisine").fill("Coffee");
  await page.getByRole("button", { name: "Save" }).click();

  await page.waitForURL(/\/account$/);

  const business = await db.query.users.findFirst({ where: eq(schema.users.username, username) });
  expect(business, "business row created from the picked Google Place").toBeTruthy();
  const connection = await db.query.businessGooglePlaces.findFirst({
    where: eq(schema.businessGooglePlaces.businessId, business!.id),
  });
  expect(connection?.googlePlaceId).toBe(`${RUN}_place_create`);
  const block = await db.query.businessBlocks.findFirst({
    where: eq(schema.businessBlocks.businessId, business!.id),
  });
  expect(block?.category).toBe("food-drinks");
});
