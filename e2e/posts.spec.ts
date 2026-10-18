import type { Page } from "@playwright/test";

import { ADMIN_EMAIL, db, EMAIL } from "./auth";
import {
  expect,
  pathname,
  recordTransitions,
  test,
  transitionOf,
  waitForHydration,
} from "./fixtures";

// Runs against the sample posts (`pnpm db:seed`): every type in every
// city, more than a page of general posts and questions in Aswan, and
// offers / announcements from the test user's businesses. The test
// user's own posts, votes and bookmarks are wiped before every run.
test.describe("posts", () => {
  test("home: offers as coupons, the latest posts in a row; See all slides to Posts", async ({
    page,
    context,
  }) => {
    await recordTransitions(context);
    await page.goto("/");
    await waitForHydration(page);
    // Offers today: coupons with the deal.
    const offers = page.getByRole("region", { name: "Offers today" });
    const coupon = offers.getByRole("link", { name: /Breakfast for two/ });
    await expect(coupon).toBeVisible();
    await expect(coupon).toContainText("20% off");
    // Latest: one sideways row of cards, every type but offers.
    const latest = page.getByRole("list", { name: "Latest in Aswan" });
    await expect(latest).toHaveCount(1);
    await expect(latest.getByRole("listitem")).toHaveCount(16);
    await expect(latest.getByText("Breakfast for two")).toHaveCount(0);
    // The floating + (signed out: asks to sign in).
    await expect(page.getByRole("button", { name: "New post" })).toBeVisible();

    const animations = await transitionOf(page, async () => {
      await page.getByRole("link", { name: "See all: Latest in Aswan" }).tap();
      await page.waitForURL((url) => url.pathname === "/posts");
    });
    expect(animations.find((a) => a.layer === "new")?.from).toBe("100%");
    await expect(
      page.getByRole("button", { name: "Filter by type: All types" }),
    ).toBeVisible();
  });

  test("Posts: every type from people and businesses, filtered by the pill", async ({
    page,
  }) => {
    await page.goto("/posts");
    await waitForHydration(page);
    const filter = page.getByRole("button", {
      name: "Filter by type: All types",
    });
    await expect(filter).toBeVisible();
    // Mixed: a business's offer and people's posts of other types.
    await expect(
      page.getByRole("article", { name: "Offer" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("article").filter({ hasText: "@" }).first(),
    ).toBeVisible();
    const types = await page
      .getByRole("article")
      .evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")));
    expect(new Set(types).size).toBeGreaterThan(2);

    await filter.tap();
    const sheet = page.getByRole("dialog", { name: "Filter by type" });
    await sheet.getByRole("button", { name: /^Housing · \d+$/ }).tap();
    await expect.poll(() => new URL(page.url()).search).toBe("?type=housing");
    await expect(
      page.getByRole("button", { name: "Filter by type: Housing" }),
    ).toBeVisible();
    const filtered = await page
      .getByRole("article")
      .evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")));
    expect(new Set(filtered)).toEqual(new Set(["Housing"]));
  });

  test("a type's page loads more as you scroll, to the end", async ({
    page,
  }) => {
    await page.goto("/posts?type=general");
    await waitForHydration(page);
    const cards = page.getByRole("article", { name: "General" });
    await expect(cards).toHaveCount(20);

    await cards.last().scrollIntoViewIfNeeded();
    await expect.poll(() => cards.count()).toBeGreaterThan(20);
    // Keep scrolling to the end of the list.
    await expect(async () => {
      await page.mouse.wheel(0, 5000);
      await expect(page.getByText("You're all caught up")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    // No post shown twice.
    const ids = await cards.evaluateAll((els) =>
      els.map((el) => el.querySelector('a[href^="/p/"]')?.getAttribute("href")),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("an unknown type or post is not found", async ({ page, pageErrors }) => {
    await page.goto("/posts/nope");
    await expect(page.getByText("Page not found")).toBeVisible();
    await page.goto("/p/00000000-0000-4000-8000-000000000000");
    await expect(page.getByText("Page not found")).toBeVisible();
    pageErrors.splice(
      0,
      pageErrors.length,
      ...pageErrors.filter((e) => !e.includes("404")),
    );
  });

  test("signed out: voting and posting ask to sign in", async ({ page }) => {
    await page.goto("/posts?type=question");
    await waitForHydration(page);
    await page
      .getByRole("button", { name: "Helpful", exact: true })
      .first()
      .tap();
    await expect(
      page.getByRole("dialog", { name: "Sign in to Qura" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.getByRole("button", { name: "New post" }).tap();
    await expect(
      page.getByRole("dialog", { name: "Sign in to Qura" }),
    ).toBeVisible();
  });

  test("write, reply, vote, save, edit and delete a post", async ({
    page,
    signIn,
    pageErrors,
  }) => {
    await signIn();
    await page.goto("/posts?type=question");
    await waitForHydration(page);

    // Posting: the + opens the New post screen on this type; posting goes back.
    await page.getByRole("link", { name: "New post" }).tap();
    await expect.poll(() => pathname(page)).toBe("/posts/new");
    await waitForHydration(page);
    const composer = page.getByRole("main");
    await expect(
      composer.getByRole("button", { name: "What is it?: Question" }),
    ).toBeVisible();
    const body = `Best falafel in town? ${Date.now()}`;
    await composer.getByRole("textbox", { name: "Your post" }).fill(body);
    await composer.getByRole("button", { name: "Post", exact: true }).tap();
    await expect(page.getByText("Posted!")).toBeVisible();
    await expect.poll(() => page.url()).toMatch(/\/posts\?type=question$/);

    // Newest first, shown as the test user (not a business).
    const card = page.getByRole("article", { name: "Question" }).first();
    await expect(card).toContainText(body);
    await expect(card).toContainText("@e2e_tester");

    // Its page: reply.
    await card.getByRole("link", { name: body }).tap();
    await expect.poll(() => pathname(page)).toMatch(/^\/p\/[0-9a-f-]{36}$/);
    await waitForHydration(page);
    await page.getByRole("button", { name: "Write a reply" }).tap();
    const replySheet = page.getByRole("dialog", { name: "Write a reply" });
    await replySheet
      .getByRole("textbox", { name: "Your reply" })
      .fill("Try the corner shop.");
    await replySheet.getByRole("button", { name: "Reply", exact: true }).tap();
    await expect(replySheet).toBeHidden();
    const myReply = page.getByRole("article", { name: "Reply" });
    await expect(myReply).toContainText("Try the corner shop.");

    // Your reply: edit it (its own screen, text only; saving comes back)…
    const postUrl = page.url();
    await myReply.getByRole("button", { name: "Edit reply" }).tap();
    await expect.poll(() => pathname(page)).toMatch(/\/edit$/);
    await waitForHydration(page);
    await expect(
      page.getByRole("textbox", { name: "Price or discount" }),
    ).toHaveCount(0);
    await page
      .getByRole("textbox", { name: "Your reply" })
      .fill("Try the shop on the corner.");
    await page.getByRole("button", { name: "Save" }).tap();
    await expect.poll(() => page.url()).toBe(postUrl);
    await expect(myReply).toContainText("Try the shop on the corner.");
    // …or delete it, confirmed, staying on the post.
    await waitForHydration(page);
    await myReply.getByRole("button", { name: "Delete reply" }).tap();
    await page
      .getByRole("dialog", { name: "Delete this reply?" })
      .getByRole("button", { name: "Delete" })
      .tap();
    await expect(page.getByText("Reply deleted")).toBeVisible();
    await expect(myReply).toHaveCount(0);
    expect(page.url()).toBe(postUrl);

    // Your own post: its score, but no voting on it. Saving works.
    const post = page.getByRole("article", { name: "Question" });
    const helpful = post.getByRole("button", { name: "Helpful", exact: true });
    await expect(helpful).toBeDisabled();
    await expect(post.getByRole("button", { name: "Not helpful" })).toBeDisabled();
    await expect(post.getByLabel("Score")).toHaveText("0");
    const save = post.getByRole("button", { name: "Save" });
    await sent(page, () => save.tap());
    await expect(save).toHaveAttribute("aria-pressed", "true");

    // Kept after a reload.
    await page.reload();
    await waitForHydration(page);
    await expect(save).toHaveAttribute("aria-pressed", "true");

    // Saved posts lists it.
    const url = page.url();
    await page.goto("/profile/saved");
    await expect(page.getByText(body)).toBeVisible();

    // Edit: the pencil in the bar opens its screen; saving goes back…
    await page.goto(url);
    await waitForHydration(page);
    await page.getByRole("link", { name: "Edit post" }).tap();
    await expect.poll(() => pathname(page)).toMatch(/\/edit$/);
    await waitForHydration(page);
    await page
      .getByRole("textbox", { name: "Your post" })
      .fill(`${body} (edited)`);
    await page.getByRole("button", { name: "Save" }).tap();
    await expect(page.getByText("Post updated")).toBeVisible();
    await expect.poll(() => page.url()).toBe(url);
    await expect(post).toContainText(`${body} (edited)`);

    // …and deleting it there (confirmed) leaves for the type's page.
    await waitForHydration(page);
    await page.getByRole("link", { name: "Edit post" }).tap();
    await expect.poll(() => pathname(page)).toMatch(/\/edit$/);
    await waitForHydration(page);
    await page.getByRole("button", { name: "Delete post" }).tap();
    const confirm = page.getByRole("dialog", { name: "Delete this post?" });
    await confirm.getByRole("button", { name: "Delete" }).tap();
    await expect(page.getByText("Post deleted")).toBeVisible();
    await expect.poll(() => page.url()).toMatch(/\/posts\?type=question$/);
    await page.goto(url);
    await expect(page.getByText("Page not found")).toBeVisible();
    pageErrors.splice(
      0,
      pageErrors.length,
      ...pageErrors.filter((e) => !e.includes("404")),
    );
  });

  test("voting on someone else's post toggles and is kept", async ({ page, signIn }) => {
    // A post by someone else, from the sample data (global-setup.ts clears
    // the test user's votes before every run).
    const [other] = await db()<{ id: string; score: number }[]>`
      select p.id, coalesce((select sum(v.value) from post_votes v where v.post_id = p.id), 0)::int as score
      from posts p join users u on u.id = p.created_by_id
      where p.parent_id is null and p.status = 'visible' and p.business_id is null
        and u.status = 'active' and u.email <> ${EMAIL}
      order by p.created_at desc limit 1`;
    await signIn();
    await page.goto(`/p/${other.id}`);
    await waitForHydration(page);
    const post = page.getByRole("article").first();
    const helpful = post.getByRole("button", { name: "Helpful", exact: true });
    const notHelpful = post.getByRole("button", { name: "Not helpful" });
    const score = post.getByLabel("Score");
    await expect(helpful).toBeEnabled();

    await sent(page, () => helpful.tap());
    await expect(helpful).toHaveAttribute("aria-pressed", "true");
    await expect(score).toHaveText(String(other.score + 1));
    // Not helpful replaces it; tapping it again takes the vote back.
    await sent(page, () => notHelpful.tap());
    await expect(notHelpful).toHaveAttribute("aria-pressed", "true");
    await expect(score).toHaveText(String(other.score - 1));
    await sent(page, () => helpful.tap());

    await page.reload();
    await waitForHydration(page);
    await expect(helpful).toHaveAttribute("aria-pressed", "true");
    await expect(score).toHaveText(String(other.score + 1));
  });

  test("an offer is posted as one of your businesses, with its price", async ({
    page,
    signIn,
  }) => {
    await signIn();
    await page.goto("/posts?type=offer");
    await waitForHydration(page);
    await page.getByRole("link", { name: "New post" }).tap();
    await expect.poll(() => pathname(page)).toBe("/posts/new");
    await waitForHydration(page);
    const composer = page.getByRole("main");
    // An offer is a business type: it starts as your first business.
    const asBusiness = composer.getByRole("button", {
      name: /Nile Breeze Café/,
    });
    await expect(asBusiness).toHaveAttribute("aria-pressed", "true");
    const typeSelect = composer.getByRole("button", {
      name: /^What is it\?: /,
    });
    await expect(typeSelect).toHaveAccessibleName("What is it?: Offer");
    // The select lists the types of whoever posts.
    const options = page.getByRole("dialog", { name: "What is it?" });
    const typesShown = async () => {
      await typeSelect.tap();
      await expect(options).toBeVisible();
      const names = await options.getByRole("button").allInnerTexts();
      await options.getByRole("button", { name: "Cancel" }).tap();
      await expect(options).toBeHidden();
      return names.map((n) => n.trim());
    };
    // Yourself → personal types only (the offer falls back to the first)…
    await composer.getByRole("button", { name: /E2E Tester/ }).tap();
    await expect(typeSelect).toHaveAccessibleName("What is it?: General");
    let names = await typesShown();
    expect(names).toContain("Experience");
    expect(names).not.toContain("Offer");
    // …a business → business types (no Experience; shared ones like Job stay).
    await asBusiness.tap();
    names = await typesShown();
    expect(names).not.toContain("Experience");
    expect(names).toContain("Job");
    await typeSelect.tap();
    await options.getByRole("button", { name: "Offer" }).tap();
    await expect(typeSelect).toHaveAccessibleName("What is it?: Offer");
    const body = `Two coffees for one ${Date.now()}`;
    await composer.getByRole("textbox", { name: "Your post" }).fill(body);
    await composer
      .getByRole("textbox", { name: "Price or discount" })
      .fill("2 for 1");
    await composer.getByRole("button", { name: "Post", exact: true }).tap();
    await expect.poll(() => page.url()).toMatch(/\/posts\?type=offer$/);

    const card = page.getByRole("article", { name: "Offer" }).first();
    await expect(card).toContainText(body);
    await expect(card).toContainText("Nile Breeze Café");
    await expect(card).toContainText("2 for 1");

    // And on the business's page.
    await page.goto("/bs/nilebreeze");
    await expect(
      page.getByRole("region", { name: "Posts" }).getByText(body),
    ).toBeVisible();
  });

  test("a business's posts can be filtered by type", async ({ page }) => {
    await page.goto("/bs/nilebreeze");
    await waitForHydration(page);
    const section = page.getByRole("region", { name: "Posts" });
    const filter = section.getByRole("button", {
      name: "Filter by type: All types",
    });
    await expect(filter).toBeVisible();
    // Mixed types to start with.
    await expect(
      section.getByRole("article", { name: "Offer" }).first(),
    ).toBeVisible();
    await expect(
      section.getByRole("article", { name: "Job" }).first(),
    ).toBeVisible();

    await filter.tap();
    const sheet = page.getByRole("dialog", { name: "Filter by type" });
    // Only the types it posted, with counts.
    await expect(sheet.getByRole("button", { name: /^Housing/ })).toHaveCount(
      0,
    );
    await sheet.getByRole("button", { name: /^Offers · \d+$/ }).tap();
    await expect.poll(() => new URL(page.url()).search).toBe("?type=offer");
    await expect(
      section.getByRole("button", { name: "Filter by type: Offers" }),
    ).toBeVisible();
    await expect(section.getByRole("article", { name: "Job" })).toHaveCount(0);
    await expect(
      section.getByRole("article", { name: "Offer" }).first(),
    ).toBeVisible();

    // Back to all.
    await section.getByRole("button", { name: "Filter by type: Offers" }).tap();
    await sheet.getByRole("button", { name: "All types" }).tap();
    await expect.poll(() => new URL(page.url()).search).toBe("");
    await expect(
      section.getByRole("article", { name: "Job" }).first(),
    ).toBeVisible();
  });

  test("Arabic: the home sections are translated", async ({
    page,
    setLang,
  }) => {
    await setLang("ar");
    await page.goto("/");
    await waitForHydration(page);
    await expect(
      page.getByRole("heading", { level: 2, name: "اكتشف الأماكن" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "عرض الكل: عروض اليوم" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "آخر ما نُشر في أسوان" }),
    ).toBeVisible();
  });
});

/** Runs `action` and waits for the server action it sends to answer. */
async function sent(page: Page, action: () => Promise<void>) {
  const response = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" && !!r.request().headers()["next-action"],
  );
  await action();
  await response;
}

test.describe("hidden replies", () => {
  test("your hidden reply shows to you, with why; not to others", async ({
    page,
    signIn,
    browser,
  }) => {
    const sql = db();
    const [{ id: me }] = await sql<{ id: string }[]>`select id from users where email = ${EMAIL}`;
    const [post] = await sql<{ id: string }[]>`
      insert into posts (created_by_id, type, body, place_id)
      select u.id, 'general', 'E2E post with a hidden reply', p.id
      from users u, places p where u.email = ${ADMIN_EMAIL} and p.slug = 'luxor'
      returning id`;
    const [reply] = await sql<{ id: string }[]>`
      insert into posts (created_by_id, parent_id, type, body, place_id, status)
      select ${me}, id, type, 'E2E my hidden reply', place_id, 'hidden' from posts where id = ${post.id}
      returning id`;
    // Hidden the way a moderator hides it: the reason is on the action.
    await sql`
      insert into history (entry, source, action, input, note)
      values ('action', 'system', 'post.hide', ${sql.json({ postId: reply.id })}, 'No phone numbers in replies')`;

    await signIn();
    await page.goto(`/p/${post.id}`);
    await expect(page.getByText("E2E my hidden reply")).toBeVisible();
    await expect(page.getByText("Hidden by an admin: only you can see this reply")).toBeVisible();
    await expect(page.getByText("No phone numbers in replies")).toBeVisible();

    // Signed out: the post, but not the reply.
    const other = await browser.newContext();
    const visitor = await other.newPage();
    await visitor.goto(`/p/${post.id}`);
    await expect(visitor.getByRole("main").getByText("E2E post with a hidden reply")).toBeVisible();
    await expect(visitor.getByText("E2E my hidden reply")).toHaveCount(0);
    await expect(visitor.getByText("No replies yet. Be the first!")).toBeVisible();
    await other.close();
  });
});
