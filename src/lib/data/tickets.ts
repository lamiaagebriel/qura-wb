import "server-only";

import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  businessLocations,
  businessReviews,
  businesses,
  history,
  placeAdmins,
  places,
  posts,
  tickets,
  users,
  type TicketRef,
} from "@/db/schema";
import type { Localized } from "@/lib/localized";
import { OPEN_STATUSES, type TicketStatus } from "@/lib/tickets/statuses";
import type { TicketType } from "@/lib/tickets/types";

/** What a ref points at, ready to show (never an id on its own). */
export type RefView =
  | { table: "places"; id: string; slug: string; name: Localized }
  | { table: "businesses"; id: string; username: string; name: Localized; status: string }
  | { table: "posts"; id: string; body: string; status: string; placeId: string }
  | { table: "business_reviews"; id: string; text: string; rating: number; businessName: Localized }
  | { table: "users"; id: string; name: string; username: string }
  | { table: string; id: string; missing: true };

export type TicketView = {
  id: string;
  type: TicketType;
  status: TicketStatus;
  createdAt: Date;
  data: Record<string, unknown>;
  sender: { id: string; name: string; username: string };
  refs: RefView[];
  /** The latest answer, from history: who, when, why, what it created. */
  answer: { action: string; note: string | null; at: Date; by: string | null; resultId: string | null } | null;
};

const columns = {
  id: tickets.id,
  type: tickets.type,
  status: tickets.status,
  createdAt: tickets.createdAt,
  data: tickets.data,
  refs: tickets.refs,
  sender: { id: users.id, name: users.name, username: users.username },
};

type Row = Awaited<ReturnType<typeof baseQuery>>[number];

function baseQuery(where: SQL | undefined, order: "oldest" | "newest", limit: number) {
  return db
    .select(columns)
    .from(tickets)
    .innerJoin(users, eq(users.id, tickets.createdById))
    .where(where)
    .orderBy(order === "oldest" ? asc(tickets.createdAt) : desc(tickets.createdAt))
    .limit(limit);
}

/** The records the tickets point at, one query per table. */
export async function resolveRefs(rows: { refs: TicketRef[] }[]): Promise<Map<string, RefView>> {
  const ids = (table: string) => [...new Set(rows.flatMap((r) => r.refs.filter((x) => x.table === table).map((x) => x.id)))];
  const out = new Map<string, RefView>();
  const key = (table: string, id: string) => `${table}:${id}`;
  const [placeRows, businessRows, postRows, reviewRows, userRows] = await Promise.all([
    ids("places").length
      ? db.select({ id: places.id, slug: places.slug, name: places.name }).from(places).where(inArray(places.id, ids("places")))
      : [],
    ids("businesses").length
      ? db
          .select({ id: businesses.id, username: businesses.username, name: businesses.name, status: businesses.status })
          .from(businesses)
          .where(inArray(businesses.id, ids("businesses")))
      : [],
    ids("posts").length
      ? db
          .select({ id: posts.id, body: posts.body, status: posts.status, placeId: posts.placeId })
          .from(posts)
          .where(inArray(posts.id, ids("posts")))
      : [],
    ids("business_reviews").length
      ? db
          .select({ id: businessReviews.id, text: businessReviews.text, rating: businessReviews.rating, businessName: businesses.name })
          .from(businessReviews)
          .innerJoin(businesses, eq(businesses.id, businessReviews.businessId))
          .where(inArray(businessReviews.id, ids("business_reviews")))
      : [],
    ids("users").length
      ? db.select({ id: users.id, name: users.name, username: users.username }).from(users).where(inArray(users.id, ids("users")))
      : [],
  ]);
  for (const r of placeRows) out.set(key("places", r.id), { table: "places", ...r });
  for (const r of businessRows) out.set(key("businesses", r.id), { table: "businesses", ...r });
  for (const r of postRows) out.set(key("posts", r.id), { table: "posts", ...r });
  for (const r of reviewRows) out.set(key("business_reviews", r.id), { table: "business_reviews", ...r });
  for (const r of userRows) out.set(key("users", r.id), { table: "users", ...r });
  return out;
}

/** Each ticket's latest answer (`ticket.*` actions in history). */
export async function answersOf(ids: string[]) {
  if (!ids.length) return new Map<string, TicketView["answer"]>();
  const rows = await db
    .select({
      ticketId: sql<string>`${history.input}->>'ticketId'`,
      action: history.action,
      note: history.note,
      at: history.at,
      by: users.name,
      resultId: sql<string | null>`${history.input}->>'resultId'`,
    })
    .from(history)
    .leftJoin(users, eq(users.id, history.actorId))
    .where(
      and(
        eq(history.entry, "action"),
        inArray(history.action, ["ticket.approve", "ticket.reject", "ticket.dismiss", "ticket.escalate", "ticket.cancel"]),
        sql`${history.input}->>'ticketId' in (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`,
      ),
    )
    .orderBy(asc(history.id));
  // Later rows win: the latest answer.
  const out = new Map<string, TicketView["answer"]>();
  for (const row of rows) out.set(row.ticketId, { action: row.action ?? "", note: row.note, at: row.at, by: row.by, resultId: row.resultId });
  return out;
}

async function toViews(rows: Row[]): Promise<TicketView[]> {
  const [refs, answers] = await Promise.all([resolveRefs(rows), answersOf(rows.map((r) => r.id))]);
  return rows.map((row) => ({
    id: row.id,
    type: row.type as TicketType,
    status: row.status as TicketStatus,
    createdAt: row.createdAt,
    data: row.data,
    sender: row.sender,
    refs: row.refs.map((ref) => refs.get(`${ref.table}:${ref.id}`) ?? { table: ref.table, id: ref.id, missing: true }),
    answer: answers.get(row.id) ?? null,
  }));
}

/** A ref as stored, for `@>` lookups. */
const about = (ref: TicketRef) => sql`${tickets.refs} @> ${JSON.stringify([ref])}::jsonb`;

/** Tickets someone sent, newest first (their "My places" / requests). */
export async function ticketsSentBy(userId: string, types?: TicketType[], limit = 50) {
  const rows = await baseQuery(
    and(eq(tickets.createdById, userId), types ? inArray(tickets.type, types) : undefined),
    "newest",
    limit,
  );
  return toViews(rows);
}

/** Waiting tickets of these types (oldest first), optionally about one record. */
export async function openTickets(types: TicketType[], ref?: TicketRef, limit = 200) {
  const rows = await baseQuery(
    and(inArray(tickets.type, types), inArray(tickets.status, [...OPEN_STATUSES]), ref ? about(ref) : undefined),
    "oldest",
    limit,
  );
  return toViews(rows);
}

/** Every ticket about one record, newest first (a record page's history of reports…). */
export async function ticketsAbout(ref: TicketRef, limit = 50) {
  return toViews(await baseQuery(about(ref), "newest", limit));
}

/** One ticket, ready to show. */
export async function getTicket(id: string) {
  const [row] = await baseQuery(eq(tickets.id, id), "newest", 1);
  return row ? (await toViews([row]))[0] : undefined;
}

/**
 * What waits for a place admin in their places (never the places inside
 * them): new places asked for right under them, reported posts in them,
 * reports about businesses with a branch there (not yet sent on).
 */
export async function placeAdminQueue(userId: string, placeIds?: string[]) {
  const mine = placeIds ?? (await db.select({ id: placeAdmins.placeId }).from(placeAdmins).where(eq(placeAdmins.userId, userId))).map((r) => r.id);
  if (!mine.length) return [];
  const inMine = (table: string) =>
    sql`exists (select 1 from jsonb_array_elements(${tickets.refs}) r where r->>'table' = ${table} and (r->>'id')::uuid in (${sql.join(mine.map((id) => sql`${id}::uuid`), sql`, `)}))`;
  const rows = await baseQuery(
    and(
      eq(tickets.status, "open"),
      sql`(
        (${tickets.type} = 'new_place' and ${inMine("places")})
        or (${tickets.type} = 'report_post' and exists (
          select 1 from ${posts} p
          where p.id = (${tickets.refs}->0->>'id')::uuid
            and p.place_id in (${sql.join(mine.map((id) => sql`${id}::uuid`), sql`, `)})))
        or (${tickets.type} = 'report_business' and exists (
          select 1 from ${businessLocations} l
          where l.business_id = (${tickets.refs}->0->>'id')::uuid
            and l.place_id in (${sql.join(mine.map((id) => sql`${id}::uuid`), sql`, `)})))
      )`,
    ),
    "oldest",
    200,
  );
  const views = await toViews(rows);
  // Which of their places each one is about (a business: every place it has a branch in).
  const businessIds = views.flatMap((v) => (v.type === "report_business" && v.refs[0] ? [v.refs[0].id] : []));
  const branches = businessIds.length
    ? await db
        .select({ businessId: businessLocations.businessId, placeId: businessLocations.placeId })
        .from(businessLocations)
        .where(and(inArray(businessLocations.businessId, businessIds), inArray(businessLocations.placeId, mine)))
    : [];
  return views.map((view) => {
    const ref = view.refs[0];
    const placeIds =
      !ref || "missing" in ref
        ? []
        : ref.table === "places"
          ? [ref.id]
          : ref.table === "posts"
            ? [(ref as { placeId: string }).placeId]
            : [...new Set(branches.filter((b) => b.businessId === ref.id).map((b) => b.placeId))];
    return { ...view, placeIds };
  });
}

/** What waits for the super admin: open tickets and businesses to approve. */
export async function adminQueueCount(): Promise<number> {
  const [open, pending] = await Promise.all([
    db.$count(tickets, inArray(tickets.status, [...OPEN_STATUSES])),
    db.$count(businesses, eq(businesses.status, "pending")),
  ]);
  return open + pending;
}

/**
 * Whether `userId` has a waiting close / reopen ticket about a business
 * (its page says "Thanks, we'll check" instead of asking again).
 */
export async function myOpenBusinessRequest(businessId: string, userId: string): Promise<"close" | "reopen" | null> {
  const [row] = await db
    .select({ type: tickets.type })
    .from(tickets)
    .where(
      and(
        eq(tickets.createdById, userId),
        inArray(tickets.type, ["close_business", "reopen_business"]),
        inArray(tickets.status, [...OPEN_STATUSES]),
        about({ table: "businesses", id: businessId }),
      ),
    )
    .limit(1);
  return row ? (row.type === "reopen_business" ? "reopen" : "close") : null;
}
