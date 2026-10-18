// Every flow between people — users, place admins, the super admin —
// against the database, through the same functions the server actions call
// (`lib/tickets/server.ts`, `runAction`…). Each check prints PASS / FAIL;
// everything it makes is removed at the end. `pnpm test:flows` (run by
// e2e/flows.spec.ts). Exits 1 when a check fails.
import { and, eq, inArray, like, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  businessFollows,
  businessLocations,
  businessReviews,
  businesses,
  history,
  placeAdmins,
  places,
  placeTypes,
  posts,
  tickets,
  users,
} from "@/db/schema";
import { runAction, type Tx } from "@/lib/actions/run";
import { allowedRequest, allowedStatuses, canDelete, canManage, roleFor } from "@/lib/business-status";
import { getBusiness, getMyBusiness, getMyBusinesses } from "@/lib/data/businesses";
import { findVisiblePostRow, getPost, getReplies, postingBusinesses } from "@/lib/data/posts";
import { applyStatus, NotReadyToGoLive } from "@/lib/data/status-writes";
import { answerTicket, cancelTicket, decisionsFor, openTicket, type Actor } from "@/lib/tickets/server";
import { anonymizeUser } from "@/lib/users/anonymize";

const results: { name: string; ok: boolean }[] = [];
function check(name: string, ok: boolean, detail?: unknown) {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  →  ${JSON.stringify(detail)}`}`);
}

/** Test accounts and records: `e2e-flow…` (e2e/global-setup.ts removes them too). */
const P = "e2e-flow";
const OLD = new Date(Date.now() - 30 * 86400_000);

const setup = <T>(work: (tx: Tx) => Promise<T>) => runAction({ action: "flow.setup", actorId: null, source: "system" }, work);

async function person(name: string, role: "member" | "super_admin" = "member"): Promise<Actor> {
  const [row] = await db
    .insert(users)
    .values({ name: `Flow ${name}`, email: `${P}-${name}@qura.test`, emailVerified: true, username: `e2e_flow_${name}`, role, createdAt: OLD })
    .returning({ id: users.id, role: users.role, status: users.status });
  return row;
}
const postBy = (by: Actor, placeId: string, body: string) =>
  setup(async (tx) => (await tx.insert(posts).values({ createdById: by.id, type: "general", body, placeId }).returning({ id: posts.id }))[0].id);
async function business(handle: string, owner: Actor | null, creator: Actor, placeId: string, status: "active" | "closed" = "active") {
  return setup(async (tx) => {
    const [row] = await tx
      .insert(businesses)
      .values({ username: `${P}.${handle}`, name: { en: `Flow ${handle}` }, category: "cafe", timeZone: "Africa/Cairo", ownerId: owner?.id ?? null, createdById: creator.id, status })
      .returning({ id: businesses.id });
    await tx.insert(businessLocations).values({ businessId: row.id, position: 0, address: { en: "Street" }, lat: 25.69, lng: 32.64, placeId });
    return row.id;
  });
}
const postStatus = async (id: string) => (await db.select({ s: posts.status }).from(posts).where(eq(posts.id, id)))[0]?.s;
const businessStatus = async (id: string) => (await db.select({ s: businesses.status }).from(businesses).where(eq(businesses.id, id)))[0]?.s;
const ticketStatus = async (id: string) => (await db.select({ s: tickets.status }).from(tickets).where(eq(tickets.id, id)))[0]?.s;
const idOf = (result: { ok: boolean; id?: string }) => (result.ok && result.id) || "";

async function main() {
  const [luxor] = await db.select({ id: places.id }).from(places).where(eq(places.slug, "luxor"));
  const [aswan] = await db.select({ id: places.id }).from(places).where(eq(places.slug, "aswan"));
  const alice = await person("alice");
  const bob = await person("bob");
  const carol = await person("carol");
  const reporters = await Promise.all(["r1", "r2", "r3", "r4", "r5"].map((n) => person(n)));
  const padmin = await person("padmin");
  const root = await person("root", "super_admin");
  await setup((tx) => tx.insert(placeAdmins).values({ placeId: luxor.id, userId: padmin.id }));

  // ── Reporting (user ↔ user) ──────────────────────────────────────────
  const p1 = await postBy(alice, luxor.id, "Flow post one");
  check("can't report your own post", !(await openTicket(alice, "report_post", [{ table: "posts", id: p1 }], { reason: "spam" })).ok);
  const r1 = await openTicket(bob, "report_post", [{ table: "posts", id: p1 }], { reason: "spam", note: "ad" });
  const r1again = await openTicket(bob, "report_post", [{ table: "posts", id: p1 }], { reason: "offensive" });
  check("reporting twice keeps one open ticket", r1.ok && r1again.ok && idOf(r1) === idOf(r1again), { r1, r1again });
  check("an unknown reason is refused", !(await openTicket(bob, "report_post", [{ table: "posts", id: p1 }], { reason: "nope" })).ok);

  // ── No auto-hide: reports never hide by themselves ───────────────────
  const p2 = await postBy(alice, luxor.id, "Flow post two");
  for (const r of reporters) await openTicket(r, "report_post", [{ table: "posts", id: p2 }], { reason: "spam" });
  check("5 reports don't hide a post", (await postStatus(p2)) === "visible", await postStatus(p2));
  const shop = await business("shop", alice, alice, luxor.id);
  for (const r of reporters) await openTicket(r, "report_business", [{ table: "businesses", id: shop }], { reason: "fake" });
  check("5 reports don't suspend a business", (await businessStatus(shop)) === "active", await businessStatus(shop));

  // ── Moderation (super admin ↔ user; place admins answer nothing for now)
  const elsewhere = await postBy(alice, aswan.id, "Flow Aswan post");
  check("an admin of another place can't answer", (await decisionsFor(padmin, { type: "report_post", status: "open", refs: [{ table: "posts", id: elsewhere }] })).length === 0);
  check("…nor an admin of its own place (super admin only, NOTEPAD Step A)", (await decisionsFor(padmin, { type: "report_post", status: "open", refs: [{ table: "posts", id: p1 }] })).length === 0 && !(await answerTicket(padmin, idOf(r1), "approve", "No")).ok);
  check("hiding needs a reason", !(await answerTicket(root, idOf(r1), "approve", "")).ok);
  const hid = await answerTicket(root, idOf(r1), "approve", "No ads please");
  check("the super admin hides a reported post", hid.ok && (await postStatus(p1)) === "hidden", { hid, status: await postStatus(p1) });
  check("an answered ticket can't be answered again", !(await answerTicket(root, idOf(r1), "dismiss")).ok);
  const [noted] = await db.select({ note: history.note }).from(history).where(and(eq(history.action, "ticket.approve"), sql`${history.input}->>'ticketId' = ${idOf(r1)}`));
  check("the reason is in history", noted?.note === "No ads please", noted);
  check("a hidden post can't be reported", !(await openTicket(carol, "report_post", [{ table: "posts", id: p1 }], { reason: "spam" })).ok);
  const p3 = await postBy(alice, luxor.id, "Flow post three");
  const r3 = await openTicket(bob, "report_post", [{ table: "posts", id: p3 }], { reason: "spam" });
  const race = await Promise.all([answerTicket(root, idOf(r3), "dismiss"), answerTicket(root, idOf(r3), "dismiss")]);
  const answers = await db.$count(history, and(eq(history.action, "ticket.dismiss"), sql`${history.input}->>'ticketId' = ${idOf(r3)}`));
  check("two admins answering at once: one answer", race.filter((r) => r.ok).length === 1 && answers === 1, { race, answers });

  // ── Old answers re-check what they're about (fix 2) ──────────────────
  const cafe = await business("cafe", alice, alice, luxor.id);
  check("an owner closes it themselves (can't ask)", !(await openTicket(alice, "close_business", [{ table: "businesses", id: cafe }], {})).ok);
  const closeAsk = await openTicket(bob, "close_business", [{ table: "businesses", id: cafe }], { note: "Shut" });
  check("a visitor reports it closed", closeAsk.ok, closeAsk);
  await runAction({ action: "business.delete", actorId: alice.id }, (tx) => tx.update(businesses).set({ status: "deleted" }).where(eq(businesses.id, cafe)));
  const lateClose = await answerTicket(root, idOf(closeAsk), "approve");
  check("approving an old 'closed' ticket keeps a deleted business deleted", (await businessStatus(cafe)) === "deleted", await businessStatus(cafe));
  check("…and closes the ticket as no longer applying", !lateClose.ok && lateClose.error === "This request no longer applies." && (await ticketStatus(idOf(closeAsk))) === "cancelled", { lateClose, status: await ticketStatus(idOf(closeAsk)) });
  const [why] = await db.select({ note: history.note }).from(history).where(and(eq(history.action, "ticket.cancel"), sql`${history.input}->>'ticketId' = ${idOf(closeAsk)}`));
  check("…with why, in history", why?.note === "No longer applies", why);

  // Whoever added an unowned business runs it like an owner (Step A).
  const kiosk = await business("kiosk", null, bob, luxor.id, "closed");
  const [kioskRow] = await db.select().from(businesses).where(eq(businesses.id, kiosk));
  check("its creator can't ask to reopen it…", !(await openTicket(bob, "reopen_business", [{ table: "businesses", id: kiosk }], {})).ok);
  check("…they reopen (or delete) it directly", allowedStatuses(roleFor(kioskRow, bob), "closed").join() === "active,deleted");

  const diner = await business("diner", bob, bob, luxor.id);
  const close2 = await openTicket(carol, "close_business", [{ table: "businesses", id: diner }], {});
  const approved = await answerTicket(root, idOf(close2), "approve");
  check("a fresh 'closed' ticket still closes it", approved.ok && (await businessStatus(diner)) === "closed", { approved, status: await businessStatus(diner) });

  // ── New places, no duplicates (fix 3) ────────────────────────────────
  const ask1 = await openTicket(alice, "new_place", [{ table: "places", id: luxor.id }], { name: { en: "Flow Karnak", ar: "" }, customType: "Flow Temple town" });
  const ask2 = await openTicket(bob, "new_place", [{ table: "places", id: luxor.id }], { name: { en: "flow karnak", ar: "" }, customType: "Flow Temple town" });
  check("the parent's admin can't approve it (super admin only)", !(await answerTicket(padmin, idOf(ask1), "approve")).ok);
  const made = await answerTicket(root, idOf(ask1), "approve");
  const [karnak] = await db.select({ id: places.id }).from(places).where(eq(places.slug, "flow-karnak"));
  check("the super admin approves a new place", made.ok && !!karnak, made);
  check("its requester looks after it", !!karnak && (await db.$count(placeAdmins, and(eq(placeAdmins.placeId, karnak.id), eq(placeAdmins.userId, alice.id)))) === 1);
  check("the same name waiting from someone else is turned down", (await ticketStatus(idOf(ask2))) === "rejected", await ticketStatus(idOf(ask2)));
  const ask3 = await openTicket(carol, "new_place", [{ table: "places", id: luxor.id }], { name: { en: "FLOW KARNAK", ar: "" }, customType: "Flow Temple town" });
  const dup = await answerTicket(root, idOf(ask3), "approve");
  const karnaks = await db.$count(places, and(eq(places.parentId, luxor.id), like(places.slug, "flow-karnak%")));
  check("approving a place that already exists makes no second one", karnaks === 1, { karnaks, dup });
  const [pointer] = await db.select({ input: history.input, note: history.note }).from(history).where(and(eq(history.action, "ticket.reject"), sql`${history.input}->>'ticketId' = ${idOf(ask3)}`));
  check("…it's turned down 'Already added', pointing at the place", (await ticketStatus(idOf(ask3))) === "rejected" && pointer?.note === "Already added" && (pointer.input as { resultId?: string }).resultId === karnak?.id, pointer);
  const ask4 = await openTicket(carol, "new_place", [{ table: "places", id: luxor.id }], { name: { en: "Flow Luxor East", ar: "" }, customType: "flow temple TOWN" });
  await answerTicket(root, idOf(ask4), "approve");
  const kinds = await db.$count(placeTypes, sql`lower(${placeTypes.name}->>'en') = 'flow temple town'`);
  check("an 'Other' kind with the same name is reused", kinds === 1, { kinds });
  const dupKind = await setup((tx) => tx.insert(placeTypes).values({ name: { en: "FLOW TEMPLE TOWN" } })).then(() => "saved", (e: Error) => String(e.cause ?? e.message));
  check("the database refuses a duplicate kind name", dupKind !== "saved", dupKind);
  const cancel = await openTicket(bob, "new_place", [{ table: "places", id: luxor.id }], { name: { en: "Flow Cancel me", ar: "" }, customType: "Flow Temple town" });
  check("only its sender cancels a request", !(await cancelTicket(alice, idOf(cancel))).ok && (await cancelTicket(bob, idOf(cancel))).ok);

  // ── Co-admins (place admin ↔ super admin) ────────────────────────────
  check("only a place's admin asks for a co-admin", !(await openTicket(bob, "add_admin", [{ table: "places", id: luxor.id }, { table: "users", id: carol.id }], {})).ok);
  const add = await openTicket(padmin, "add_admin", [{ table: "places", id: luxor.id }, { table: "users", id: bob.id }], { note: "Helpful" });
  check("a place admin can't approve their own request", (await decisionsFor(padmin, { type: "add_admin", status: "open", refs: [{ table: "places", id: luxor.id }, { table: "users", id: bob.id }] })).length === 0);
  await answerTicket(root, idOf(add), "approve");
  check("the super admin adds the co-admin", (await db.$count(placeAdmins, and(eq(placeAdmins.placeId, luxor.id), eq(placeAdmins.userId, bob.id)))) === 1);
  const addCarol = await openTicket(padmin, "add_admin", [{ table: "places", id: luxor.id }, { table: "users", id: carol.id }], {});
  await setup((tx) => tx.update(users).set({ status: "suspended" }).where(eq(users.id, carol.id)));
  const late = await answerTicket(root, idOf(addCarol), "approve");
  check("a person suspended since isn't made an admin", !late.ok && (await db.$count(placeAdmins, and(eq(placeAdmins.placeId, luxor.id), eq(placeAdmins.userId, carol.id)))) === 0, late);
  await setup((tx) => tx.update(users).set({ status: "active" }).where(eq(users.id, carol.id)));
  const remove = await openTicket(padmin, "remove_admin", [{ table: "places", id: luxor.id }, { table: "users", id: bob.id }], {});
  await answerTicket(root, idOf(remove), "approve");
  check("…and removes them", (await db.$count(placeAdmins, and(eq(placeAdmins.placeId, luxor.id), eq(placeAdmins.userId, bob.id)))) === 0);

  // ── Reviews and people ───────────────────────────────────────────────
  const [review] = await setup((tx) => tx.insert(businessReviews).values({ businessId: diner, authorId: alice.id, rating: 1, text: "Bad" }).returning({ id: businessReviews.id }));
  check("an owner reports a review of their business", (await openTicket(bob, "report_review", [{ table: "business_reviews", id: review.id }], { reason: "fake" })).ok);
  check("place admins don't answer review reports", (await decisionsFor(padmin, { type: "report_review", status: "open", refs: [{ table: "business_reviews", id: review.id }] })).length === 0);
  check("a person is reported", (await openTicket(bob, "report_user", [{ table: "users", id: alice.id }], { reason: "spam" })).ok);

  // ── Who runs a business: its adder only until someone owns it ────────
  const stall = await business("stall", null, carol, luxor.id);
  const stallRow = async () => (await db.select().from(businesses).where(eq(businesses.id, stall)))[0];
  check("its adder runs an unclaimed business", canManage(roleFor(await stallRow(), carol)) && !!(await getMyBusiness(`${P}.stall`, carol.id)));
  check("…and can post as it", (await postingBusinesses(carol.id, "en")).some((b) => b.username === `${P}.stall`));
  await setup((tx) => tx.update(businesses).set({ ownerId: bob.id }).where(eq(businesses.id, stall)));
  const claimed = await stallRow();
  check("once claimed, the adder is a visitor to it", roleFor(claimed, carol) === "visitor" && !canManage(roleFor(claimed, carol)));
  check("…can't edit it", (await getMyBusiness(`${P}.stall`, carol.id)) === undefined);
  check("…it's gone from their businesses", !(await getMyBusinesses(carol.id)).some((b) => b.username === `${P}.stall`));
  check("…they can't post as it", !(await postingBusinesses(carol.id, "en")).some((b) => b.username === `${P}.stall`));
  check("…or delete it", !canDelete(roleFor(claimed, carol), true));
  check("…or change its status", allowedStatuses(roleFor(claimed, carol), claimed.status).length === 0);
  check("…but can still report it closed, like anyone", allowedRequest(roleFor(claimed, carol), claimed.status) === "close");
  check("the owner runs it", canManage(roleFor(claimed, bob)) && !!(await getMyBusiness(`${P}.stall`, bob.id)) && (await postingBusinesses(bob.id, "en")).some((b) => b.username === `${P}.stall`));

  // ── Reply counts (public reads) ──────────────────────────────────────
  const dan = await person("dan");
  const thread = await postBy(bob, luxor.id, "Flow thread");
  const replyBy = (by: Actor, body: string, status: "visible" | "hidden" = "visible") =>
    setup(async (tx) => (await tx.insert(posts).values({ createdById: by.id, type: "general", body, placeId: luxor.id, parentId: thread, status }).returning({ id: posts.id }))[0].id);
  const shown = await replyBy(carol, "Flow visible reply");
  const hiddenReply = await replyBy(carol, "Flow hidden reply", "hidden");
  const byDan = await replyBy(dan, "Flow reply by a suspended person");
  await setup((tx) => tx.update(users).set({ status: "suspended" }).where(eq(users.id, dan.id)));
  const counted = (await getPost(thread, undefined))?.replyCount;
  const listed = (await getReplies(thread, undefined)).length;
  check("the reply count skips hidden replies and suspended writers", counted === 1 && listed === 1, { counted, listed });

  // ── Replying / voting only on what everyone sees ─────────────────────
  const hiddenPost = await setup(async (tx) => (await tx.insert(posts).values({ createdById: bob.id, type: "general", body: "Flow hidden post", placeId: luxor.id, status: "hidden" }).returning({ id: posts.id }))[0].id);
  check("a visible post or reply can be replied to and voted on", !!(await findVisiblePostRow(thread)) && !!(await findVisiblePostRow(shown)));
  check("a hidden post can't be replied to or voted on", (await findVisiblePostRow(hiddenPost)) === undefined);
  check("…nor a hidden reply, or one by a suspended person", (await findVisiblePostRow(hiddenReply)) === undefined && (await findVisiblePostRow(byDan)) === undefined);

  // ── Replies under a hidden post ──────────────────────────────────────
  const hideThread = (status: "visible" | "hidden") => setup((tx) => tx.update(posts).set({ status }).where(eq(posts.id, thread)));
  await hideThread("hidden");
  const asAuthor = await getPost(thread, bob.id);
  check("replies under a hidden post aren't in any public read", (await getReplies(thread, undefined)).length === 0 && (await findVisiblePostRow(shown)) === undefined && asAuthor?.replyCount === 0, { replyCount: asAuthor?.replyCount });
  check("…but keep their own status", (await postStatus(shown)) === "visible");
  await hideThread("visible");
  check("showing the post again brings them back", (await getReplies(thread, undefined)).length === 1 && !!(await findVisiblePostRow(shown)));

  // ── Follower counts ──────────────────────────────────────────────────
  // dan is suspended (above); bob and carol are active.
  const bakery = await business("bakery", bob, bob, luxor.id);
  await setup((tx) => tx.insert(businessFollows).values([bob, carol, dan].map((p) => ({ userId: p.id, businessId: bakery }))));
  const followers = (await getBusiness(`${P}.bakery`))?.stats.followers;
  check("a suspended follower doesn't count", followers === 2, { followers });

  // ── Going live needs a branch and WhatsApp ───────────────────────────
  const pending = (handle: string, links: { platform: "whatsapp"; url: string }[]) =>
    setup(async (tx) => (await tx.insert(businesses).values({ username: `${P}.${handle}`, name: { en: `Flow ${handle}` }, category: "cafe", timeZone: "Africa/Cairo", ownerId: bob.id, createdById: bob.id, status: "pending", links }).returning({ id: businesses.id }))[0].id);
  const goLive = (id: string) =>
    runAction({ action: "business.set_status", actorId: root.id, source: "dashboard" }, (tx) => applyStatus(tx, { id }, "active", root.id)).then(
      () => "live",
      (error: unknown) => (error instanceof NotReadyToGoLive ? "refused" : error),
    );
  const bare = await pending("bare", []);
  check("a business with no branch or WhatsApp can't go live", (await goLive(bare)) === "refused" && (await businessStatus(bare)) === "pending");
  const noBranch = await pending("nobranch", [{ platform: "whatsapp", url: "https://wa.me/201000000000" }]);
  check("…nor with WhatsApp but no branch", (await goLive(noBranch)) === "refused" && (await businessStatus(noBranch)) === "pending");
  const complete = await pending("complete", [{ platform: "whatsapp", url: "https://wa.me/201000000000" }]);
  await setup((tx) => tx.insert(businessLocations).values({ businessId: complete, position: 0, address: { en: "Street" }, lat: 25.69, lng: 32.64, placeId: luxor.id }));
  const result = await goLive(complete);
  check("a complete one goes live", result === "live" && (await businessStatus(complete)) === "active", { result: String(result), status: await businessStatus(complete) });

  // ── Erase for good (super admin) ─────────────────────────────────────
  const aliceAsk = await openTicket(alice, "new_place", [{ table: "places", id: aswan.id }], { name: { en: "Flow Alice place", ar: "" }, customType: "Flow Temple town" });
  await runAction({ action: "users.anonymize", actorId: root.id, source: "dashboard" }, (tx) => anonymizeUser(tx, alice.id));
  const [anon] = await db.select().from(users).where(eq(users.id, alice.id));
  check("erased: name, username, email, photo, bio", anon.name === "Deleted account" && anon.username.startsWith("deleted-") && anon.status === "deleted" && !anon.image && !anon.bio, anon);
  check("their open tickets are cancelled", (await ticketStatus(idOf(aliceAsk))) === "cancelled");
  check("their businesses lose their owner", (await db.$count(businesses, eq(businesses.ownerId, alice.id))) === 0);
  check("their place-admin roles go", (await db.$count(placeAdmins, eq(placeAdmins.userId, alice.id))) === 0);
  const kept = await db.$count(history, sql`${history.tableName} = 'users' and ${history.recordId} = ${alice.id} and ${history.changes}::text like '%Flow alice%'`);
  check("their old name is gone from history", kept === 0, { kept });
}

async function cleanup() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('qura.allow_user_delete', 'on', true)`);
    const ids = (
      await tx
        .select({ id: users.id })
        .from(users)
        .where(sql`${users.email} like ${`${P}-%@qura.test`} or (${users.name} = 'Deleted account' and ${users.id} in (select created_by_id from posts where body like 'Flow %'))`)
    ).map((r) => r.id);
    await tx.delete(businesses).where(like(businesses.username, `${P}.%`));
    if (ids.length) {
      await tx.delete(tickets).where(inArray(tickets.createdById, ids));
      await tx.delete(posts).where(inArray(posts.createdById, ids));
      await tx.delete(businessReviews).where(inArray(businessReviews.authorId, ids));
      await tx.delete(placeAdmins).where(inArray(placeAdmins.userId, ids));
    }
    await tx.delete(places).where(like(places.slug, "flow-%"));
    await tx.delete(placeTypes).where(sql`lower(${placeTypes.name}->>'en') like 'flow %'`);
    if (ids.length) await tx.delete(users).where(inArray(users.id, ids));
  });
}

void (async () => {
  let crashed = false;
  await cleanup();
  try {
    await main();
  } catch (error) {
    crashed = true;
    console.error("CRASH", error);
  } finally {
    await cleanup();
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed} passed, ${failed} failed${crashed ? ", crashed" : ""}`);
    process.exitCode = failed || crashed ? 1 : 0;
    await db.$client.end();
  }
})();
