"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { isValidId } from "@/db/helpers";
import { businesses, posts, tickets } from "@/db/schema";
import { currentActor } from "@/lib/actions/actor";
import { runAction } from "@/lib/actions/run";
import { BUSINESSES_TAG } from "@/lib/data/businesses";
import { adminPlaceIds } from "@/lib/data/place-admins";
import type { MessageKey } from "@/lib/i18n/types";
import { OPEN_STATUSES } from "@/lib/tickets/statuses";
import { answerTicket, openTicket, type Actor } from "@/lib/tickets/server";

// Reporting (anyone signed in) and moderating (place admins in their
// place, the super admin anywhere). Reports are tickets; hiding and showing
// posts are actions on the post. Everything is recorded in history.

export type ModerationResult = { ok: true } | { ok: false; error: MessageKey };

const AGAIN = { ok: false, error: "Something went wrong. Please try again." } as const;
const NOT_ALLOWED = { ok: false, error: "You can't do that." } as const;

const done = (result: { ok: boolean; error?: MessageKey }): ModerationResult =>
  result.ok ? { ok: true } : { ok: false, error: result.error ?? AGAIN.error };

/** Reports any record (a post, a review, a business, a person). */
export async function report(
  table: unknown,
  id: unknown,
  reason: unknown,
  note: unknown = "",
): Promise<ModerationResult> {
  const me = await currentActor("report", 30);
  if ("error" in me) return { ok: false, error: me.error };
  const type = (
    { posts: "report_post", business_reviews: "report_review", businesses: "report_business", users: "report_user" } as const
  )[String(table) as "posts"];
  if (!type || typeof id !== "string" || !isValidId(id)) return AGAIN;
  return done(await openTicket(me.actor, type, [{ table: String(table), id }], { reason, note }));
}

/** Reports a post (not your own). */
export async function reportPost(postId: unknown, reason: unknown, note: unknown = "") {
  return report("posts", postId, reason, note);
}

/** Reports a business (not yours), by its @handle. */
export async function reportBusiness(username: unknown, reason: unknown, note: unknown = "") {
  const handle = z.string().min(1).max(50).safeParse(username);
  if (!handle.success) return AGAIN;
  const [business] = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.username, handle.data)).limit(1);
  if (!business) return { ok: false, error: "This business no longer exists." } as const;
  return report("businesses", business.id, reason, note);
}

/** The post, if `actor` may moderate it: an admin of its place, or the super admin. */
async function moderatedPost(postId: unknown, actor: Actor) {
  if (typeof postId !== "string" || !isValidId(postId)) return null;
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) return null;
  if (actor.role === "super_admin") return post;
  return (await adminPlaceIds(actor.id)).includes(post.placeId) ? post : null;
}

/** An open report about this post, if any (answering it answers them all). */
async function openReportOn(postId: string) {
  const [ticket] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(
      and(
        eq(tickets.type, "report_post"),
        inArray(tickets.status, [...OPEN_STATUSES]),
        sql`${tickets.refs} @> ${JSON.stringify([{ table: "posts", id: postId }])}::jsonb`,
      ),
    )
    .limit(1);
  return ticket?.id;
}

function refresh() {
  revalidatePath("/", "layout");
}

/**
 * Hides a post, with a reason its author sees: approves its open reports,
 * or hides it directly when there are none.
 */
export async function hidePost(postId: unknown, reason: unknown): Promise<ModerationResult> {
  const me = await currentActor("moderate", 300);
  if ("error" in me) return { ok: false, error: me.error };
  const note = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
  if (!note) return AGAIN;
  const post = await moderatedPost(postId, me.actor);
  if (!post) return NOT_ALLOWED;
  const ticketId = await openReportOn(post.id);
  if (ticketId) return done(await answerTicket(me.actor, ticketId, "approve", note));
  await runAction({ action: "post.hide", actorId: me.actor.id, input: { postId: post.id }, note }, (tx) =>
    tx.update(posts).set({ status: "hidden" }).where(eq(posts.id, post.id)),
  );
  refresh();
  return { ok: true };
}

/** Nothing wrong with it: dismisses every open report about the post. */
export async function dismissPostReports(postId: unknown): Promise<ModerationResult> {
  const me = await currentActor("moderate", 300);
  if ("error" in me) return { ok: false, error: me.error };
  const post = await moderatedPost(postId, me.actor);
  if (!post) return NOT_ALLOWED;
  const ticketId = await openReportOn(post.id);
  if (!ticketId) return { ok: false, error: "This request was already handled." };
  return done(await answerTicket(me.actor, ticketId, "dismiss"));
}

/**
 * A hidden post its author edited: show it again, or keep it hidden with a
 * new reason for the author.
 */
export async function reviewHiddenPost(postId: unknown, approve: unknown, reason: unknown = ""): Promise<ModerationResult> {
  const me = await currentActor("moderate", 300);
  if ("error" in me) return { ok: false, error: me.error };
  const note = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
  if (typeof approve !== "boolean" || (!approve && !note)) return AGAIN;
  const post = await moderatedPost(postId, me.actor);
  if (!post || post.status === "visible") return NOT_ALLOWED;
  await runAction(
    { action: approve ? "post.show" : "post.hide", actorId: me.actor.id, input: { postId: post.id }, note },
    (tx) => tx.update(posts).set({ status: approve ? "visible" : "hidden" }).where(eq(posts.id, post.id)),
  );
  refresh();
  return { ok: true };
}

/**
 * A business report: dismiss it, send it on to the super admin
 * (place admins), or suspend the business (the super admin).
 */
export async function answerBusinessReport(ticketId: unknown, action: unknown): Promise<ModerationResult> {
  const me = await currentActor("moderate", 300);
  if ("error" in me) return { ok: false, error: me.error };
  const decision = ({ dismiss: "dismiss", escalate: "escalate", suspend: "approve" } as const)[String(action) as "dismiss"];
  if (!decision) return AGAIN;
  const result = done(await answerTicket(me.actor, ticketId, decision));
  updateTag(BUSINESSES_TAG);
  return result;
}

