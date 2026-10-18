import "server-only";

import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { tickets, users } from "@/db/schema";
import { answersOf, resolveRefs, type RefView } from "@/lib/data/tickets";
import { getPlaceIndex } from "@/lib/data/places";
import { inLocale } from "@/lib/localized";
import { placeLabel } from "@/lib/places";
import { TICKET_STATUS_LABELS, TICKET_STATUSES, type TicketStatus } from "@/lib/tickets/statuses";
import { answerTicket, decisionsFor, DECISIONS, type Actor, type Decision } from "@/lib/tickets/server";
import { isTicketType, REASON_LABELS, TICKET_TYPE_KEYS, TICKET_TYPES, type TicketType } from "@/lib/tickets/types";

import { recordHref } from "../links";
import {
  badge,
  date,
  filterValue,
  likePattern,
  link,
  orderBy,
  pageOf,
  text,
  totalCount,
  totalOf,
  type Ctx,
  type Resource,
  type WriteResult,
} from "../resource";
import type { Cell, RecordAction, Row, Tone } from "../types";

/** A table's records live on these dashboard pages. */
export const RECORD_PAGES: Record<string, string> = {
  users: "users",
  businesses: "businesses",
  business_locations: "branches",
  business_reviews: "reviews",
  posts: "posts",
  places: "places",
  place_types: "place-types",
  place_admins: "place-admins",
  tickets: "tickets",
};

export const STATUS_TONES: Record<TicketStatus, Tone> = {
  open: "amber",
  escalated: "violet",
  approved: "green",
  rejected: "red",
  dismissed: "neutral",
  cancelled: "neutral",
};

const statusCell = (status: string, ctx: Ctx): Cell =>
  badge(ctx.t(TICKET_STATUS_LABELS[status as TicketStatus] ?? "Waiting"), STATUS_TONES[status as TicketStatus] ?? "neutral");

const typeLabel = (type: string, ctx: Ctx) => (isTicketType(type) ? ctx.t(TICKET_TYPES[type].label) : type);

/** What a ref points at, as a cell linking to its record. */
async function refCell(ref: RefView, ctx: Ctx): Promise<Cell> {
  if ("missing" in ref) return text(ctx.t("Gone"));
  const page = RECORD_PAGES[ref.table];
  const to = page ? recordHref(page, ref.id) : null;
  const value =
    ref.table === "places"
      ? placeLabel(await getPlaceIndex(), (ref as { slug: string }).slug, ctx.locale)
      : ref.table === "businesses"
        ? inLocale((ref as { name: Record<string, string> }).name, ctx.locale)
        : ref.table === "posts"
          ? (ref as { body: string }).body.slice(0, 80)
          : ref.table === "business_reviews"
            ? `${(ref as { rating: number }).rating} ★ · ${inLocale((ref as { businessName: Record<string, string> }).businessName, ctx.locale)}`
            : ref.table === "users"
              ? (ref as { name: string }).name
              : (ref as { id: string }).id;
  return to ? link(value, to) : text(value);
}

const DECISION_LABELS = {
  approve: "Approve",
  reject: "Reject",
  dismiss: "Nothing wrong",
  escalate: "Send to the Qura team",
} as const satisfies Record<Decision, string>;

/** What approving a report does, said plainly. */
const UPHOLD_LABELS = {
  report_post: "Hide post",
  report_review: "Hide review",
  report_business: "Suspend",
  report_user: "Suspend",
} as const;

const decisionLabel = (type: string, decision: Decision, ctx: Ctx) =>
  ctx.t(decision === "approve" && type in UPHOLD_LABELS ? UPHOLD_LABELS[type as keyof typeof UPHOLD_LABELS] : DECISION_LABELS[decision]);

type TicketRow = {
  id: string;
  type: string;
  status: string;
  refs: { table: string; id: string }[];
  data: unknown;
  createdAt: Date;
  sender: { id: string; name: string };
};

/** A ticket's cells, as the tables show them. */
async function rowCells(row: TicketRow, refs: Map<string, RefView>, ctx: Ctx): Promise<Record<string, Cell>> {
  const first = row.refs[0];
  const view = first ? refs.get(`${first.table}:${first.id}`) : undefined;
  const data = row.data as { reason?: string; note?: string; name?: Record<string, string> };
  const target = row.refs[1] ? refs.get(`${row.refs[1].table}:${row.refs[1].id}`) : undefined;
  const who = target && "username" in target ? `@${target.username}` : null;
  return {
    type: badge(typeLabel(row.type, ctx), isTicketType(row.type) && TICKET_TYPES[row.type].kind === "report" ? "red" : "blue"),
    about: view ? await refCell(view, ctx) : { kind: "empty" as const },
    from: link(row.sender.name, recordHref("users", row.sender.id)),
    detail: text(
      who ?? (data.name ? inLocale(data.name, ctx.locale) : data.reason ? ctx.t(REASON_LABELS[data.reason] ?? "Something else") : (data.note ?? "")),
      (data.reason || who) && data.note ? data.note : undefined,
    ),
    status: statusCell(row.status, ctx),
    sent: date(row.createdAt),
  };
}

/** The answers `decisions` as buttons (a reason asked where the sender sees it). */
function answerButtons(type: string, decisions: Decision[], ctx: Ctx): RecordAction[] {
  return decisions.map((decision) => {
    const needsReason = decision === "reject" || (decision === "approve" && type === "report_post");
    return {
      key: decision,
      label: decisionLabel(type, decision, ctx),
      tone: decision === "reject" || (decision === "approve" && TICKET_TYPES[type as TicketType]?.kind === "report") ? "destructive" : "default",
      confirm: needsReason ? { title: decisionLabel(type, decision, ctx), description: ctx.t("They'll see your reason."), input: ctx.t("Reason") } : undefined,
    };
  });
}

const adminActor = async (ctx: Ctx): Promise<Actor | undefined> =>
  (await db.select({ id: users.id, role: users.role, status: users.status }).from(users).where(eq(users.id, ctx.adminId)).limit(1))[0];

/**
 * The inbox: open (and sent-on) tickets of one kind, oldest first, each
 * with the answers the super admin can give.
 */
export async function ticketInbox(kind: "request" | "report", ctx: Ctx): Promise<(Row & { id: string; actions: RecordAction[] })[]> {
  const types = TICKET_TYPE_KEYS.filter((t) => TICKET_TYPES[t].kind === kind);
  const rows = await db
    .select({
      id: tickets.id,
      type: tickets.type,
      status: tickets.status,
      refs: tickets.refs,
      data: tickets.data,
      createdAt: tickets.createdAt,
      createdById: tickets.createdById,
      openKey: tickets.openKey,
      sender: { id: users.id, name: users.name },
    })
    .from(tickets)
    .innerJoin(users, eq(users.id, tickets.createdById))
    .where(and(inArray(tickets.type, types), inArray(tickets.status, ["open", "escalated"])))
    // The most-reported first (open tickets of the same type about the same
    // record), then the oldest.
    .orderBy(
      desc(sql`(
        select count(*) from tickets same
        where same.type = "tickets"."type" and same.status in ('open', 'escalated')
          and same.refs->0 = "tickets"."refs"->0
      )`),
      asc(tickets.createdAt),
    )
    .limit(200);
  const [refs, actor] = await Promise.all([resolveRefs(rows), adminActor(ctx)]);
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      href: recordHref("tickets", row.id),
      cells: await rowCells(row, refs, ctx),
      actions: actor ? answerButtons(row.type, await decisionsFor(actor, row as Parameters<typeof decisionsFor>[1]), ctx) : [],
    })),
  );
}

/** Every request and every report, of every type, in one table. */
export const ticketsResource: Resource = {
  key: "tickets",
  actsOnItsOwn: true,
  defaultSort: "-sent",
  search: (ctx) => ctx.t("Search by person"),
  columns: (ctx) => [
    { key: "type", label: ctx.t("Type") },
    { key: "about", label: ctx.t("About") },
    { key: "from", label: ctx.t("From") },
    { key: "detail", label: ctx.t("Details") },
    { key: "status", label: ctx.t("Status") },
    { key: "sent", label: ctx.t("Sent"), sortable: true },
  ],
  filters: (ctx) => [
    {
      key: "kind",
      label: ctx.t("Kind"),
      options: [
        { value: "request", label: ctx.t("Requests") },
        { value: "report", label: ctx.t("Reports") },
      ],
    },
    { key: "type", label: ctx.t("Type"), options: TICKET_TYPE_KEYS.map((value) => ({ value, label: ctx.t(TICKET_TYPES[value].label) })) },
    { key: "status", label: ctx.t("Status"), options: TICKET_STATUSES.map((value) => ({ value, label: ctx.t(TICKET_STATUS_LABELS[value]) })) },
  ],
  async list(params, ctx) {
    const type = filterValue(params, "type", TICKET_TYPE_KEYS);
    const status = filterValue(params, "status", TICKET_STATUSES);
    const kind = params.filters.kind;
    const kindTypes = kind ? TICKET_TYPE_KEYS.filter((t) => TICKET_TYPES[t].kind === kind) : null;
    const pattern = params.q ? likePattern(params.q) : null;
    const rows = await db
      .select({
        id: tickets.id,
        type: tickets.type,
        status: tickets.status,
        refs: tickets.refs,
        data: tickets.data,
        createdAt: tickets.createdAt,
        sender: { id: users.id, name: users.name },
        total: totalCount,
      })
      .from(tickets)
      .innerJoin(users, eq(users.id, tickets.createdById))
      .where(
        and(
          type ? eq(tickets.type, type) : undefined,
          kindTypes ? inArray(tickets.type, kindTypes) : undefined,
          status ? eq(tickets.status, status) : undefined,
          params.filters.open === "yes" ? inArray(tickets.status, ["open", "escalated"]) : undefined,
          pattern ? or(ilike(users.name, pattern), ilike(users.username, pattern)) : undefined,
        ),
      )
      .orderBy(...orderBy(params.sort, { sent: tickets.createdAt }, "-sent"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    const refs = await resolveRefs(rows);
    return {
      total: totalOf(rows),
      rows: await Promise.all(rows.map(async (row) => ({ href: recordHref("tickets", row.id), cells: await rowCells(row, refs, ctx) }))),
    };
  },

  async view(id, ctx) {
    const [row] = await db
      .select({ ticket: tickets, sender: { id: users.id, name: users.name } })
      .from(tickets)
      .innerJoin(users, eq(users.id, tickets.createdById))
      .where(eq(tickets.id, id))
      .limit(1);
    if (!row) return null;
    const t = row.ticket;
    const [refs, answers, admin] = await Promise.all([resolveRefs([t]), answersOf([t.id]), adminActor(ctx)]);
    const answer = answers.get(t.id);
    const decisions = admin ? await decisionsFor(admin, t) : [];
    const data = t.data as { reason?: string; note?: string; name?: Record<string, string>; customType?: string };
    const why = ctx.t("The sender's words: never edited.");

    const actions = answerButtons(t.type, decisions, ctx);

    const refLocks = await Promise.all(
      t.refs.map(async (ref, i) => ({
        label: i === 0 ? ctx.t("About") : ctx.t("Also about"),
        value: await refCell(refs.get(`${ref.table}:${ref.id}`) ?? { table: ref.table, id: ref.id, missing: true }, ctx),
        reason: why,
      })),
    );

    return {
      title: typeLabel(t.type, ctx),
      subtitle: row.sender.name,
      badges: [{ value: ctx.t(TICKET_STATUS_LABELS[t.status as TicketStatus] ?? "Waiting"), tone: STATUS_TONES[t.status as TicketStatus] ?? "neutral" }],
      fields: [],
      values: {},
      locked: [
        ...refLocks,
        { label: ctx.t("From"), value: link(row.sender.name, recordHref("users", row.sender.id)), reason: why },
        ...(data.name ? [{ label: ctx.t("Name"), value: text(inLocale(data.name, ctx.locale)), reason: why }] : []),
        ...(data.customType ? [{ label: ctx.t("Kind of place"), value: text(data.customType), reason: why }] : []),
        ...(data.reason ? [{ label: ctx.t("Reason"), value: text(ctx.t(REASON_LABELS[data.reason] ?? "Something else")), reason: why }] : []),
        ...(data.note ? [{ label: ctx.t("Note"), value: text(data.note), reason: why }] : []),
        { label: ctx.t("Sent"), value: date(t.createdAt), reason: why },
        ...(answer
          ? [
              { label: ctx.t("Answered by"), value: text(answer.by ?? ctx.t("The system")), reason: ctx.t("From its history.") },
              ...(answer.note ? [{ label: ctx.t("Answer"), value: text(answer.note === "Already added" ? ctx.t("Already added") : answer.note), reason: ctx.t("From its history.") }] : []),
            ]
          : []),
      ],
      actions,
      related: [],
    };
  },

  async act(id, action, input, ctx): Promise<WriteResult> {
    if (!DECISIONS.includes(action as Decision)) return { ok: false, error: "You can't do that." };
    const admin = await adminActor(ctx);
    if (!admin) return { ok: false, error: "You can't do that." };
    const result = await answerTicket(admin, id, action, input);
    return result.ok ? { ok: true, label: id } : { ok: false, error: result.error, fields: result.fields };
  },
};

/** How many tickets wait, for the dashboard's badges. */
export async function waitingTickets() {
  const rows = await db
    .select({ type: tickets.type, count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(inArray(tickets.status, ["open", "escalated"]))
    .groupBy(tickets.type);
  const requests = rows.filter((r) => isTicketType(r.type) && TICKET_TYPES[r.type].kind === "request").reduce((s, r) => s + r.count, 0);
  const reports = rows.filter((r) => isTicketType(r.type) && TICKET_TYPES[r.type].kind === "report").reduce((s, r) => s + r.count, 0);
  return { requests, reports };
}

