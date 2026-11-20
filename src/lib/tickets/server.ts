import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { businessReviews, businesses, places, posts, tickets, users, type TicketRef } from "@/db/schema";
import { runAction } from "@/lib/actions/run";
import { allowedRequest, roleFor } from "@/lib/business-status";
import type { MessageKey } from "@/lib/i18n/types";

import { OPEN_STATUSES } from "./statuses";
import { isTicketType, TICKET_TYPES } from "./types";

/** Who's acting (a fresh session's user). */
export type Actor = { id: string; status: string };

export type TicketResult<T = object> = ({ ok: true } & T) | { ok: false; error: MessageKey; fields?: Record<string, MessageKey> };

/** Thrown inside a transaction to undo it: the ticket was cancelled meanwhile. */
class AlreadyHandled extends Error {}

type Failure = { ok: false; error: MessageKey };
const AGAIN: Failure = { ok: false, error: "Something went wrong. Please try again." };
const NOT_ALLOWED: Failure = { ok: false, error: "You can't do that." };
const HANDLED: Failure = { ok: false, error: "This request was already handled." };

/** The refs in a stable order, for `openKey` and lookups. */
const keyOf = (type: string, actorId: string, refs: TicketRef[], extra = "") =>
  [type, actorId, ...refs.map((r) => `${r.table}:${r.id}`), extra].filter(Boolean).join(":").slice(0, 400);

/** Each ref's record, if it exists (only the tables tickets point at). */
async function loadRef(ref: TicketRef) {
  switch (ref.table) {
    case "businesses":
      return (await db.select().from(businesses).where(eq(businesses.id, ref.id)).limit(1))[0];
    case "places":
      return (await db.select().from(places).where(eq(places.id, ref.id)).limit(1))[0];
    case "posts":
      return (await db.select().from(posts).where(eq(posts.id, ref.id)).limit(1))[0];
    case "business_reviews":
      return (await db.select().from(businessReviews).where(eq(businessReviews.id, ref.id)).limit(1))[0];
    case "users":
      return (await db.select().from(users).where(eq(users.id, ref.id)).limit(1))[0];
    default:
      return undefined;
  }
}

// ── Sending ─────────────────────────────────────────────────────────────

/**
 * Sends a ticket: checks the type, its data (zod), that every ref exists
 * and is the kind of record the type points at, and that `actor` may send
 * it; one open ticket per sender and subject (`openKey`). Tickets are only
 * recorded: nobody answers them in the app.
 */
export async function openTicket(
  actor: Actor,
  type: unknown,
  refs: unknown,
  data: unknown,
): Promise<TicketResult<{ id: string }>> {
  if (!isTicketType(type)) return AGAIN;
  const info = TICKET_TYPES[type];
  const parsedRefs = Array.isArray(refs) ? (refs as TicketRef[]) : [];
  if (
    parsedRefs.length !== info.refs.length ||
    parsedRefs.some((ref, i) => ref?.table !== info.refs[i] || typeof ref.id !== "string")
  ) {
    return AGAIN;
  }
  const parsed = info.data.safeParse(data ?? {});
  if (!parsed.success) {
    const fields: Record<string, MessageKey> = {};
    for (const issue of parsed.error.issues) fields[issue.path.join(".")] ??= issue.message as MessageKey;
    return { ok: false, error: "Something went wrong. Please try again.", fields };
  }
  const values = parsed.data as Record<string, unknown>;
  const records = await Promise.all(parsedRefs.map(loadRef));
  if (records.some((record) => !record)) return { ok: false, error: "This no longer exists." };
  const [subject] = records as Record<string, unknown>[];

  // Who may send it.
  switch (type) {
    case "close_business":
    case "reopen_business": {
      const business = subject as typeof businesses.$inferSelect;
      const role = roleFor(business, actor);
      const kind = allowedRequest(role, business.status);
      if ((type === "close_business" ? "close" : "reopen") !== kind) return NOT_ALLOWED;
      break;
    }
    case "new_place":
      break;
    case "report_post": {
      const post = subject as typeof posts.$inferSelect;
      if (post.createdById === actor.id || post.status !== "visible") return NOT_ALLOWED;
      break;
    }
    case "report_review": {
      const review = subject as typeof businessReviews.$inferSelect;
      if (review.authorId === actor.id || review.status !== "visible") return NOT_ALLOWED;
      break;
    }
    case "report_business": {
      const business = subject as typeof businesses.$inferSelect;
      if (business.ownerId === actor.id || business.createdById === actor.id) return NOT_ALLOWED;
      break;
    }
    case "report_user":
      if (parsedRefs[0].id === actor.id) return NOT_ALLOWED;
      break;
  }

  const extra = type === "new_place" ? String(((values.name as Record<string, string>).en ?? (values.name as Record<string, string>).ar ?? "")).toLowerCase() : "";
  const openKey = keyOf(type, actor.id, parsedRefs, extra);
  const [taken] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(and(eq(tickets.openKey, openKey), inArray(tickets.status, [...OPEN_STATUSES])))
    .limit(1);
  // Already sent and still waiting: nothing new to send.
  if (taken) return { ok: true, id: taken.id };

  const id = await runAction(
    { action: "ticket.open", actorId: actor.id, input: { type, refs: parsedRefs, data: values } },
    async (tx) => {
      const [row] = await tx
        .insert(tickets)
        .values({ type, createdById: actor.id, refs: parsedRefs, data: values, openKey })
        .returning({ id: tickets.id });
      return row.id;
    },
  );
  revalidatePath("/profile", "layout");
  return { ok: true, id };
}

/** Takes back your own waiting ticket. */
export async function cancelTicket(actor: Actor, ticketId: unknown): Promise<TicketResult> {
  if (typeof ticketId !== "string") return AGAIN;
  const done = await runAction({ action: "ticket.cancel", actorId: actor.id, input: { ticketId } }, async (tx) => {
    const rows = await tx
      .update(tickets)
      .set({ status: "cancelled" })
      .where(and(eq(tickets.id, ticketId), eq(tickets.createdById, actor.id), inArray(tickets.status, [...OPEN_STATUSES])))
      .returning({ id: tickets.id });
    if (!rows.length) throw new AlreadyHandled();
    return true;
  }).catch((error) => {
    if (error instanceof AlreadyHandled) return false;
    throw error;
  });
  if (!done) return HANDLED;
  revalidatePath("/profile", "layout");
  return { ok: true };
}
