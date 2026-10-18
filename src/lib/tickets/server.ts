import "server-only";

import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

import { db } from "@/db";
import {
  businessReviews,
  businesses,
  history,
  placeAdmins,
  places,
  placeTypes,
  posts,
  sessions,
  tickets,
  users,
  type TicketRef,
} from "@/db/schema";
import { runAction, type Tx } from "@/lib/actions/run";
import { allowedRequest, roleFor } from "@/lib/business-status";
import { BUSINESSES_TAG } from "@/lib/data/businesses";
import { PLACES_TAG } from "@/lib/data/places";
import { applyStatus, NOT_READY, NotReadyToGoLive, refreshStatus } from "@/lib/data/status-writes";
import type { MessageKey } from "@/lib/i18n/types";
import { slugify } from "@/lib/places";

import { OPEN_STATUSES, type TicketStatus } from "./statuses";
import { isTicketType, TICKET_TYPES, type TicketType } from "./types";

/** Who's acting (a fresh session's user). */
export type Actor = { id: string; role: string; status: string };

export type TicketResult<T = object> = ({ ok: true } & T) | { ok: false; error: MessageKey; fields?: Record<string, MessageKey> };

type Failure = { ok: false; error: MessageKey };
const AGAIN: Failure = { ok: false, error: "Something went wrong. Please try again." };
const NOT_ALLOWED: Failure = { ok: false, error: "You can't do that." };
const HANDLED: Failure = { ok: false, error: "This request was already handled." };
const STALE: Failure = { ok: false, error: "This request no longer applies." };

/** What answering a ticket can do (each type allows some). */
export const DECISIONS = ["approve", "reject", "dismiss", "escalate"] as const;
export type Decision = (typeof DECISIONS)[number];

const DECIDED: Record<Decision, TicketStatus> = {
  approve: "approved",
  reject: "rejected",
  dismiss: "dismissed",
  escalate: "escalated",
};

const isSuper = (actor: Actor) => actor.role === "super_admin";

/** Thrown inside a transaction to undo it: the ticket was answered meanwhile. */
class AlreadyHandled extends Error {}

/** Thrown inside a transaction to undo it: what was asked no longer makes sense. */
class NoLongerApplies extends Error {}

/**
 * Whether approving still makes sense now (read with a lock, in the
 * answer's transaction): what was asked may have changed since it was
 * sent — a business deleted or suspended, a person suspended, an admin
 * already added. Requests that only create something (a new place) always
 * apply; their place may have gone, which cancels them (trigger).
 */
async function stillApplies(tx: Tx, type: TicketType, refs: TicketRef[]) {
  const [ref, second] = refs;
  const business = async () =>
    (await tx.select({ status: businesses.status }).from(businesses).where(eq(businesses.id, ref.id)).for("update").limit(1))[0];
  const person = async (id: string) =>
    (await tx.select({ status: users.status }).from(users).where(eq(users.id, id)).for("update").limit(1))[0];
  const isAdmin = async () =>
    (await tx.$count(placeAdmins, and(eq(placeAdmins.placeId, ref.id), eq(placeAdmins.userId, second.id)))) > 0;
  switch (type) {
    case "close_business":
      return (await business())?.status === "active";
    case "reopen_business":
      return (await business())?.status === "closed";
    case "report_business": {
      const status = (await business())?.status;
      return !!status && status !== "deleted";
    }
    case "report_user":
      return (await person(ref.id))?.status === "active";
    case "add_admin":
      return (await person(second.id))?.status === "active" && !(await isAdmin());
    case "remove_admin":
      return isAdmin();
    default:
      return true;
  }
}

/** A place under `parentId` with the same name (either language, any case). */
async function existingPlace(parentId: string, name: { en?: string; ar?: string }) {
  const wanted = [name.en, name.ar].filter((v): v is string => !!v).map((v) => v.trim().toLowerCase());
  if (!wanted.length) return undefined;
  const [found] = await db
    .select({ id: places.id })
    .from(places)
    .where(
      and(
        eq(places.parentId, parentId),
        sql`(lower(${places.name}->>'en') in ${wanted} or lower(${places.name}->>'ar') in ${wanted})`,
      ),
    )
    .limit(1);
  return found;
}

async function isAdminOf(userId: string, placeIds: string[]) {
  if (!placeIds.length) return false;
  return (
    (await db.$count(placeAdmins, and(eq(placeAdmins.userId, userId), inArray(placeAdmins.placeId, placeIds)))) > 0
  );
}

/** The refs in a stable order, for `openKey` and lookups. */
const keyOf = (type: string, actorId: string, refs: TicketRef[], extra = "") =>
  [type, actorId, ...refs.map((r) => `${r.table}:${r.id}`), extra].filter(Boolean).join(":").slice(0, 400);

/** A ref as stored (the containment lookups use the same shape). */
const refJson = (ref: TicketRef) => JSON.stringify([ref]);

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
 * it; one open ticket per sender and subject (`openKey`). A report never
 * hides anything by itself: an admin decides.
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
  const [subject, second] = records as Record<string, unknown>[];

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
    case "add_admin":
    case "remove_admin": {
      if (!(await isAdminOf(actor.id, [parsedRefs[0].id]))) return NOT_ALLOWED;
      const already = await isAdminOf(parsedRefs[1].id, [parsedRefs[0].id]);
      if (type === "add_admin" && already) {
        return { ok: false, error: "Something went wrong. Please try again.", fields: { username: "Already an admin here" } };
      }
      if (type === "remove_admin" && !already) return AGAIN;
      void second;
      break;
    }
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
  revalidatePath("/admin", "layout");
  return { ok: true, id };
}

/** What upholding a report does to its subject (an admin's decision). */
async function hide(tx: Tx, type: TicketType, ref: TicketRef) {
  if (type === "report_post") await tx.update(posts).set({ status: "hidden" }).where(eq(posts.id, ref.id));
  if (type === "report_review") await tx.update(businessReviews).set({ status: "hidden" }).where(eq(businessReviews.id, ref.id));
  if (type === "report_business") await tx.update(businesses).set({ status: "suspended" }).where(eq(businesses.id, ref.id));
  if (type === "report_user") {
    // Never the last super admin (the database refuses it anyway).
    const [person] = await tx.select({ role: users.role }).from(users).where(eq(users.id, ref.id)).limit(1);
    if (person?.role === "super_admin") return;
    await tx.update(users).set({ status: "suspended" }).where(eq(users.id, ref.id));
    await tx.delete(sessions).where(eq(sessions.userId, ref.id));
  }
}

// ── Answering ───────────────────────────────────────────────────────────

/** Which answers `actor` may give a ticket right now (the screens show these). */
export async function decisionsFor(
  actor: Actor,
  ticket: { type: string; status: string; refs: TicketRef[] },
): Promise<Decision[]> {
  if (!isTicketType(ticket.type) || !OPEN_STATUSES.includes(ticket.status as TicketStatus)) return [];
  const type = ticket.type;
  const kind = TICKET_TYPES[type].kind;
  const full: Decision[] = kind === "request" ? ["approve", "reject"] : ["approve", "dismiss"];
  if (isSuper(actor)) return full;
  // For now only the super admin answers anything (NOTEPAD Step A): place
  // admins keep their rows but no powers, until co-admins come back. Then:
  // what's in their place → full for new places and post reports, and
  // dismiss / "send on" (escalate) for business reports.
  return [];
}

/**
 * Answers a ticket: its effect (creating the place, hiding the post…), its
 * new status, and a `ticket.<decision>` entry in history with the reason
 * (`note`, shown to the sender) and what it created (`resultId`) — all in
 * one transaction.
 */
export async function answerTicket(
  actor: Actor,
  ticketId: unknown,
  decision: unknown,
  note: unknown = "",
): Promise<TicketResult> {
  if (typeof ticketId !== "string" || !DECISIONS.includes(decision as Decision)) return AGAIN;
  const reason = typeof note === "string" ? note.trim().slice(0, 500) : "";
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticket || !isTicketType(ticket.type)) return HANDLED;
  const allowed = await decisionsFor(actor, ticket);
  const choice = decision as Decision;
  if (!allowed.includes(choice)) return allowed.length ? NOT_ALLOWED : HANDLED;
  // Turning someone down, or hiding their content, says why.
  if ((choice === "reject" || (choice === "approve" && ticket.type === "report_post")) && !reason) {
    return { ok: false, error: "Something went wrong. Please try again.", fields: { note: "Required" } };
  }

  const type = ticket.type;
  // Asking for a place that's already there: turned down, pointing at it.
  if (choice === "approve" && type === "new_place") {
    const existing = await existingPlace(ticket.refs[0].id, (ticket.data as { name: { en?: string; ar?: string } }).name);
    if (existing) return answerAlreadyAdded(actor, ticket.id, existing.id);
  }
  const refreshes: (() => void)[] = [];
  const done = await runAction(
    { action: `ticket.${choice}`, actorId: actor.id, input: { ticketId: ticket.id, type }, note: reason },
    async (tx, actionId) => {
      // Claim it first: two admins answering at once give one answer.
      const [claimed] = await tx
        .update(tickets)
        .set({ status: DECIDED[choice] })
        .where(and(eq(tickets.id, ticket.id), inArray(tickets.status, [...OPEN_STATUSES])))
        .returning({ id: tickets.id });
      // Someone answered first: undo (no history entry for an answer that didn't happen).
      if (!claimed) throw new AlreadyHandled();
      // "Nothing wrong" answers every open report about the same thing.
      if (choice === "dismiss") {
        await tx
          .update(tickets)
          .set({ status: "dismissed" })
          .where(
            and(
              eq(tickets.type, type),
              ne(tickets.id, ticket.id),
              inArray(tickets.status, [...OPEN_STATUSES]),
              sql`${tickets.refs} @> ${refJson(ticket.refs[0])}::jsonb`,
            ),
          );
      }
      if (choice !== "approve") return true;
      if (!(await stillApplies(tx, type, ticket.refs))) throw new NoLongerApplies();

      const ref = ticket.refs[0];
      switch (type) {
        case "close_business":
        case "reopen_business": {
          const [business] = await tx.select().from(businesses).where(eq(businesses.id, ref.id)).limit(1);
          if (business) {
            await applyStatus(tx, business, type === "close_business" ? "closed" : "active", actor.id);
            refreshes.push(() => refreshStatus(business.username));
          }
          break;
        }
        case "new_place": {
          const resultId = await approveNewPlace(tx, ticket, actor.id);
          await tx
            .update(history)
            .set({ input: sql`${history.input} || ${JSON.stringify({ resultId })}::jsonb` })
            .where(eq(history.id, actionId));
          refreshes.push(() => {
            updateTag(PLACES_TAG);
            revalidatePath("/", "layout");
          });
          break;
        }
        case "add_admin":
          await tx.insert(placeAdmins).values({ placeId: ref.id, userId: ticket.refs[1].id }).onConflictDoNothing();
          break;
        case "remove_admin":
          await tx
            .delete(placeAdmins)
            .where(and(eq(placeAdmins.placeId, ref.id), eq(placeAdmins.userId, ticket.refs[1].id)));
          break;
        case "report_post":
        case "report_review":
        case "report_business":
        case "report_user": {
          await hide(tx, type, ref);
          // Every other open report about the same thing is answered too.
          await tx
            .update(tickets)
            .set({ status: "approved" })
            .where(
              and(
                eq(tickets.type, type),
                ne(tickets.id, ticket.id),
                inArray(tickets.status, [...OPEN_STATUSES]),
                sql`${tickets.refs} @> ${refJson(ref)}::jsonb`,
              ),
            );
          refreshes.push(() => {
            updateTag(BUSINESSES_TAG);
            revalidatePath("/", "layout");
          });
          break;
        }
      }
      return true;
    },
  ).catch((error) => {
    if (error instanceof AlreadyHandled) return false;
    if (error instanceof NoLongerApplies) return "stale" as const;
    if (error instanceof NotReadyToGoLive) return error;
    throw error;
  });
  if (!done) return HANDLED;
  if (done instanceof NotReadyToGoLive) return { ok: false, error: NOT_READY };
  if (done === "stale") {
    // Nothing changed: the ticket is closed as no longer applying.
    await runAction(
      { action: "ticket.cancel", actorId: actor.id, input: { ticketId: ticket.id, type }, note: "No longer applies" },
      (tx) =>
        tx
          .update(tickets)
          .set({ status: "cancelled" })
          .where(and(eq(tickets.id, ticket.id), inArray(tickets.status, [...OPEN_STATUSES]))),
    );
    revalidatePath("/profile", "layout");
    revalidatePath("/admin", "layout");
    return STALE;
  }
  for (const refresh of refreshes) refresh();
  revalidatePath("/profile", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Turns a new-place request down: the place is already there (`resultId` points at it). */
async function answerAlreadyAdded(actor: Actor, ticketId: string, placeId: string): Promise<TicketResult> {
  const done = await runAction(
    { action: "ticket.reject", actorId: actor.id, input: { ticketId, type: "new_place", resultId: placeId }, note: "Already added" },
    async (tx) => {
      const rows = await tx
        .update(tickets)
        .set({ status: "rejected" })
        .where(and(eq(tickets.id, ticketId), inArray(tickets.status, [...OPEN_STATUSES])))
        .returning({ id: tickets.id });
      if (!rows.length) throw new AlreadyHandled();
      return true;
    },
  ).catch((error) => {
    if (error instanceof AlreadyHandled) return false;
    throw error;
  });
  if (!done) return HANDLED;
  revalidatePath("/profile", "layout");
  revalidatePath("/admin", "layout");
  return { ok: false, error: "This place already exists." };
}

/** A slug nobody has: from the name, then with its parent, then numbered (rule 19). */
async function freeSlug(tx: Tx, name: string, parentSlug: string | null) {
  const base = slugify(name) || "place";
  const candidates = [
    base,
    ...(parentSlug ? [`${base}-${parentSlug}`.slice(0, 80)] : []),
    ...Array.from({ length: 50 }, (_, i) => `${base}-${i + 2}`),
  ];
  for (const slug of candidates) {
    if (!(await tx.$count(places, eq(places.slug, slug)))) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Approving a new place: creates it (an "Other" kind joins the list), its
 * requester looks after it, and other waiting requests for the same name
 * under the same place are turned down ("Already added").
 */
async function approveNewPlace(tx: Tx, ticket: typeof tickets.$inferSelect, actorId: string) {
  const data = ticket.data as { name: { en?: string; ar?: string }; typeId?: string; customType?: string };
  const parentId = ticket.refs[0].id;
  const [parent] = await tx.select({ slug: places.slug }).from(places).where(eq(places.id, parentId)).limit(1);
  let typeId = data.typeId;
  if (!typeId) {
    const custom = (data.customType ?? "").trim();
    const key = custom.toLowerCase();
    const [same] = await tx
      .select({ id: placeTypes.id })
      .from(placeTypes)
      .where(sql`(lower(${placeTypes.name}->>'en') = ${key} or lower(${placeTypes.name}->>'ar') = ${key})`)
      .limit(1);
    typeId =
      same?.id ??
      (await tx.insert(placeTypes).values({ name: { en: custom, ar: custom }, listed: true }).returning({ id: placeTypes.id }))[0].id;
  }
  const slug = await freeSlug(tx, data.name.en || data.name.ar || "place", parent?.slug ?? null);
  const [place] = await tx
    .insert(places)
    .values({ slug, parentId, typeId, name: data.name })
    .returning({ id: places.id });
  await tx.insert(placeAdmins).values({ placeId: place.id, userId: ticket.createdById });

  const name = (data.name.en ?? data.name.ar ?? "").toLowerCase();
  const duplicates = await tx
    .update(tickets)
    .set({ status: "rejected" })
    .where(
      and(
        eq(tickets.type, "new_place"),
        ne(tickets.id, ticket.id),
        inArray(tickets.status, [...OPEN_STATUSES]),
        sql`${tickets.refs} @> ${JSON.stringify([{ table: "places", id: parentId }])}::jsonb`,
        sql`lower(coalesce(${tickets.data}->'name'->>'en', ${tickets.data}->'name'->>'ar', '')) = ${name}`,
      ),
    )
    .returning({ id: tickets.id });
  if (duplicates.length)
    await tx.insert(history).values(
      duplicates.map((dup) => ({
        entry: "action",
        actorId,
        source: "app",
        action: "ticket.reject",
        input: { ticketId: dup.id },
        note: "Already added",
      })),
    );
  return place.id;
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
  revalidatePath("/admin", "layout");
  return { ok: true };
}
