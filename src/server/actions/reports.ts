"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { isValidId } from "@/db/helpers";
import { businesses } from "@/db/schema";
import { AGAIN, done, fail, type ActionResult } from "@/lib/action-result";
import { currentActor } from "@/server/actor";
import { openTicket } from "@/server/tickets";

// Reporting (anyone signed in). Reports are tickets, recorded in history.

/** Reports any record (a post, a review, a business, a person). */
export async function report(
  table: unknown,
  id: unknown,
  reason: unknown,
  note: unknown = "",
): Promise<ActionResult> {
  const me = await currentActor("report", 30);
  if ("error" in me) return fail(me.error);
  const type = (
    { posts: "report_post", business_reviews: "report_review", businesses: "report_business", users: "report_user" } as const
  )[String(table) as "posts"];
  if (!type || typeof id !== "string" || !isValidId(id)) return AGAIN;
  const result = await openTicket(me.actor, type, [{ table: String(table), id }], { reason, note });
  return result.ok ? done() : result;
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
  if (!business) return fail("This business no longer exists.");
  return report("businesses", business.id, reason, note);
}
