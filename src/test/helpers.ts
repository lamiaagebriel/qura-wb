import { eq } from "drizzle-orm";

import { db } from "@/db";
import { businessLocations, businesses, places, posts, tickets, users } from "@/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { runAction, type Tx } from "@/server/run-action";

import { cookieJar, session, type TestUser } from "./session";

// Shared by the test files: make people and records, sign in as someone.
// Every write goes through `runAction`, like the app's.

/** An action's data, or the test fails with its error. */
export function data<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(`${result.error}${result.field ? ` (${result.field})` : ""}`);
  return result.data;
}

/** The error an action refused with (the test fails if it succeeded). */
export function refused<T>(result: ActionResult<T>) {
  if (result.ok) throw new Error("expected the action to refuse, it succeeded");
  return result.error;
}

/** Writes test setup the way the app does (recorded in history as `test.setup`). */
export const setup = <T>(work: (tx: Tx) => Promise<T>) =>
  runAction({ action: "test.setup", actorId: null, source: "system" }, work);

/** A person with a unique email and @handle. */
export async function person(name: string): Promise<TestUser> {
  const tag = crypto.randomUUID().slice(0, 8);
  const [row] = await setup((tx) =>
    tx
      .insert(users)
      .values({ name, email: `${tag}@test.local`, emailVerified: true, username: `t_${tag}` })
      .returning(),
  );
  return { id: row.id, name: row.name, email: row.email, username: row.username, status: row.status, image: row.image, bio: row.bio };
}

/** Acts as `user` from now on (`null`: signed out). */
export function signIn(user: TestUser | null) {
  session.user = user;
}

/** Browsing `slug` (the picked-place cookie). */
export function browse(slug: string) {
  cookieJar.set("qura__city", slug);
}

export async function placeId(slug: string) {
  const [row] = await db.select({ id: places.id }).from(places).where(eq(places.slug, slug));
  if (!row) throw new Error(`no place "${slug}"`);
  return row.id;
}

/** A live business with one branch in `place`. `owner: null` = added for someone else. */
export async function business(
  creator: TestUser,
  { owner = creator, place = "luxor", status = "active" }: { owner?: TestUser | null; place?: string; status?: "active" | "closed" | "pending" } = {},
) {
  const where = await placeId(place);
  const username = `t.${crypto.randomUUID().slice(0, 8)}`;
  return setup(async (tx) => {
    const [row] = await tx
      .insert(businesses)
      .values({
        username,
        name: { en: `Business ${username}` },
        category: "cafe",
        timeZone: "Africa/Cairo",
        ownerId: owner?.id ?? null,
        createdById: creator.id,
        status,
        links: [{ platform: "whatsapp", url: "https://wa.me/201000000000" }],
      })
      .returning();
    await tx.insert(businessLocations).values({ businessId: row.id, position: 0, address: { en: "Street" }, lat: 25.69, lng: 32.64, placeId: where });
    return row;
  });
}

/** A post (or a reply, with `parentId`) straight in the database. */
export async function post(
  by: TestUser,
  { place = "luxor", body = "A post", parentId = null, status = "visible" }: { place?: string; body?: string; parentId?: string | null; status?: "visible" | "hidden" } = {},
) {
  const where = await placeId(place);
  return setup(async (tx) => {
    const [row] = await tx
      .insert(posts)
      .values({ createdById: by.id, type: "general", body, placeId: where, parentId, status })
      .returning({ id: posts.id });
    return row.id;
  });
}

export const statusOf = {
  post: async (id: string) => (await db.select({ s: posts.status }).from(posts).where(eq(posts.id, id)))[0]?.s,
  business: async (id: string) => (await db.select({ s: businesses.status }).from(businesses).where(eq(businesses.id, id)))[0]?.s,
  ticket: async (id: string) => (await db.select({ s: tickets.status }).from(tickets).where(eq(tickets.id, id)))[0]?.s,
};
