import "server-only";

import { and, asc, eq, ilike, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  businessFollows,
  businessReviews,
  businesses,
  POST_STATUSES,
  posts,
  postSaves,
  postVotes,
  REVIEW_STATUSES,
  tickets,
  users,
} from "@/db/schema";
import { POST_TYPE_META } from "@/components/posts/type-meta";
import { runAction } from "@/lib/actions/run";
import { ticketsAbout } from "@/lib/data/tickets";
import { getPlaceIndex, inPlaceTree } from "@/lib/data/places";
import { POST_TYPES, type PostType } from "@/lib/posts";
import { placeLabel } from "@/lib/places";
import { href } from "@/lib/routes";
import { OPEN_STATUSES, TICKET_STATUS_LABELS } from "@/lib/tickets/statuses";
import { answerTicket } from "@/lib/tickets/server";
import { REASON_LABELS, type TicketType } from "@/lib/tickets/types";

import { recordHref } from "../links";
import {
  allLanguages,
  badge,
  date,
  diff,
  filterValue,
  likePattern,
  link,
  localized,
  number,
  orderBy,
  pageOf,
  text,
  totalCount,
  totalOf,
  type Ctx,
  type Resource,
  type WriteResult,
} from "../resource";
import type { Cell, RecordAction, Related } from "../types";
import { STATUS_TONES as TICKET_TONES } from "./tickets";

const authors = alias(users, "authors");
const parents = alias(posts, "parents");

type PostStatus = (typeof POST_STATUSES)[number];

const typeCell = (type: PostType, ctx: Ctx): Cell => badge(ctx.t(POST_TYPE_META[type].label), "neutral");

const POST_STATUS_LABELS = { visible: "Visible", hidden: "Hidden", under_review: "Edited, waiting" } as const;
const POST_STATUS_TONES = { visible: "green", hidden: "red", under_review: "amber" } as const;

const statusCell = (status: PostStatus, ctx: Ctx): Cell => badge(ctx.t(POST_STATUS_LABELS[status]), POST_STATUS_TONES[status]);

/** Open reports about a record, counted in SQL (`refs` holds it). */
const openReports = (table: string, id: unknown) => sql<number>`(
  select count(*) from tickets t
  where t.status in ('open', 'escalated')
    and t.refs @> jsonb_build_array(jsonb_build_object('table', ${table}::text, 'id', ${id}::text))
)::int`;

/**
 * Hides or shows a post or review from the dashboard. Hiding with open
 * reports approves them (the reporters get an answer); otherwise it's a
 * direct `post.hide` / `review.hide` action, its note the reason the
 * author sees.
 */
async function moderate(ctx: Ctx, kind: "post" | "review", id: string, hide: boolean, note: string): Promise<WriteResult> {
  const table = kind === "post" ? posts : businessReviews;
  const type: TicketType = kind === "post" ? "report_post" : "report_review";
  const ref = { table: kind === "post" ? "posts" : "business_reviews", id };
  if (hide && !note) return { ok: false, error: "Something went wrong. Please try again." };
  if (hide) {
    const [open] = await db
      .select({ id: tickets.id })
      .from(tickets)
      .where(and(eq(tickets.type, type), inArray(tickets.status, [...OPEN_STATUSES]), sql`${tickets.refs} @> ${JSON.stringify([ref])}::jsonb`))
      .limit(1);
    if (open) {
      const actor = { id: ctx.adminId, role: "super_admin", status: "active" };
      const result = await answerTicket(actor, open.id, "approve", note);
      return result.ok ? { ok: true, label: id } : { ok: false, error: result.error, fields: result.fields };
    }
  }
  await runAction({ action: `${kind}.${hide ? "hide" : "show"}`, actorId: ctx.adminId, source: "dashboard", input: { [`${kind}Id`]: id }, note: note || undefined }, (tx) =>
    tx.update(table).set({ status: hide ? "hidden" : "visible" }).where(eq(table.id, id)),
  );
  return { ok: true, label: id };
}

/** Every report about a record, as a related table on its page. */
async function reportsAbout(table: string, id: string, ctx: Ctx): Promise<Related> {
  const reports = (await ticketsAbout({ table, id })).filter((t) => t.type.startsWith("report_"));
  return {
    title: ctx.t("Reports"),
    columns: [
      { key: "reason", label: ctx.t("Reason") },
      { key: "by", label: ctx.t("By") },
      { key: "state", label: ctx.t("Status") },
    ],
    rows: reports.map((r) => {
      const data = r.data as { reason?: string; note?: string };
      return {
        href: recordHref("tickets", r.id),
        cells: {
          reason: text(ctx.t(REASON_LABELS[data.reason ?? "other"] ?? "Something else"), data.note || undefined),
          by: text(r.sender.name),
          state: badge(ctx.t(TICKET_STATUS_LABELS[r.status]), TICKET_TONES[r.status]),
        },
      };
    }),
  };
}

function refreshPosts() {
  revalidatePath("/", "layout");
}

export const postsResource: Resource = {
  key: "posts",
  // Hide / show record their own action (or answer the reports).
  actsOnItsOwn: true,
  defaultSort: "-posted",
  search: (ctx) => ctx.t("Search the text"),
  columns: (ctx) => [
    { key: "post", label: ctx.t("Post") },
    { key: "type", label: ctx.t("Type") },
    { key: "author", label: ctx.t("By") },
    { key: "as", label: ctx.t("As business"), hidden: true },
    { key: "place", label: ctx.t("Place") },
    { key: "replies", label: ctx.t("Replies"), sortable: true, align: "end" },
    { key: "score", label: ctx.t("Score"), sortable: true, align: "end", hidden: true },
    { key: "reports", label: ctx.t("Reports"), sortable: true, align: "end" },
    { key: "visibility", label: ctx.t("Visibility") },
    { key: "posted", label: ctx.t("Posted"), sortable: true },
  ],
  async filters(ctx) {
    const index = await getPlaceIndex();
    return [
      {
        key: "kind",
        label: ctx.t("Kind"),
        options: [
          { value: "posts", label: ctx.t("Posts") },
          { value: "replies", label: ctx.t("Replies") },
        ],
      },
      { key: "type", label: ctx.t("Type"), options: POST_TYPES.map((value) => ({ value, label: ctx.t(POST_TYPE_META[value].label) })) },
      {
        key: "visibility",
        label: ctx.t("Visibility"),
        options: POST_STATUSES.map((value) => ({ value, label: ctx.t(POST_STATUS_LABELS[value]) })),
      },
      { key: "place", label: ctx.t("Place"), options: index.all.map((p) => ({ value: p.slug, label: placeLabel(index, p.slug, ctx.locale) })) },
    ];
  },
  async list(params, ctx) {
    const index = await getPlaceIndex();
    const type = filterValue(params, "type", POST_TYPES);
    const status = filterValue(params, "visibility", POST_STATUSES);
    const place = index.has(params.filters.place) ? params.filters.place : null;
    const pattern = params.q ? likePattern(params.q) : null;
    const replies = sql<number>`(select count(*) from posts r where r.parent_id = "posts"."id")::int`;
    const score = sql<number>`coalesce((select sum(v.value) from post_votes v where v.post_id = "posts"."id"), 0)::int`;
    const reports = openReports("posts", sql`"posts"."id"`);
    const rows = await db
      .select({
        id: posts.id,
        type: posts.type,
        body: posts.body,
        placeId: posts.placeId,
        parentId: posts.parentId,
        status: posts.status,
        createdAt: posts.createdAt,
        author: { id: authors.id, name: authors.name },
        business: { id: businesses.id, name: businesses.name },
        replies,
        score,
        reports,
        total: totalCount,
      })
      .from(posts)
      .innerJoin(authors, eq(authors.id, posts.createdById))
      .leftJoin(businesses, eq(businesses.id, posts.businessId))
      .where(
        and(
          params.filters.kind === "posts" ? isNull(posts.parentId) : params.filters.kind === "replies" ? isNotNull(posts.parentId) : undefined,
          type ? eq(posts.type, type) : undefined,
          status ? eq(posts.status, status) : undefined,
          place ? inPlaceTree(posts.placeId, place) : undefined,
          params.filters.author ? eq(authors.username, params.filters.author) : undefined,
          params.filters.business ? eq(businesses.username, params.filters.business) : undefined,
          pattern ? ilike(posts.body, pattern) : undefined,
        ),
      )
      .orderBy(...orderBy(params.sort, { posted: posts.createdAt, replies, score, reports }, "-posted"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    return {
      total: totalOf(rows),
      rows: rows.map((row) => {
        const place = index.getById(row.placeId);
        return {
          href: recordHref("posts", row.id),
          cells: {
            post: text(row.body.length > 90 ? `${row.body.slice(0, 90)}…` : row.body, row.parentId ? ctx.t("Reply") : undefined),
            type: typeCell(row.type, ctx),
            author: link(row.author.name, recordHref("users", row.author.id)),
            as: row.business?.id ? link(localized(row.business.name, ctx.locale), recordHref("businesses", row.business.id)) : { kind: "empty" },
            place: place ? link(placeLabel(index, place.slug, ctx.locale), recordHref("places", place.id)) : { kind: "empty" },
            replies: number(row.replies),
            score: number(row.score),
            reports: row.reports ? badge(String(row.reports), "red") : number(0),
            visibility: statusCell(row.status, ctx),
            posted: date(row.createdAt),
          },
        };
      }),
    };
  },

  async view(id, ctx) {
    const [row] = await db
      .select({ post: posts, author: { id: authors.id, name: authors.name }, business: { id: businesses.id, name: businesses.name }, parent: { id: parents.id, body: parents.body } })
      .from(posts)
      .innerJoin(authors, eq(authors.id, posts.createdById))
      .leftJoin(businesses, eq(businesses.id, posts.businessId))
      .leftJoin(parents, eq(parents.id, posts.parentId))
      .where(eq(posts.id, id))
      .limit(1);
    if (!row) return null;
    const p = row.post;
    const index = await getPlaceIndex();
    const [replyRows, reports] = await Promise.all([
      db.select({ id: posts.id, body: posts.body, author: users.name, createdAt: posts.createdAt })
        .from(posts).innerJoin(users, eq(users.id, posts.createdById)).where(eq(posts.parentId, id)).orderBy(asc(posts.createdAt)).limit(20),
      reportsAbout("posts", id, ctx),
    ]);
    const place = index.getById(p.placeId);

    const hide: RecordAction = {
      key: "hide",
      label: p.status === "under_review" ? ctx.t("Keep hidden") : ctx.t("Hide post"),
      tone: "destructive",
      confirm: { title: ctx.t("Hide this post?"), description: ctx.t("Only its author will see it, with your reason, to edit or delete it."), input: ctx.t("Reason") },
    };
    const actions: RecordAction[] =
      p.status === "visible" ? [hide] : p.status === "hidden" ? [{ key: "show", label: ctx.t("Show again") }] : [{ key: "show", label: ctx.t("Show again") }, hide];

    return {
      title: p.parentId ? ctx.t("Reply") : ctx.t(POST_TYPE_META[p.type].label),
      subtitle: row.author.name,
      badges: [{ value: ctx.t(POST_STATUS_LABELS[p.status]), tone: POST_STATUS_TONES[p.status] }],
      publicHref: href("post", { params: { id: p.parentId ?? p.id } }),
      fields: [{ name: "body", label: ctx.t("Text"), kind: "textarea", max: 500 }],
      values: { body: p.body },
      locked: [
        { label: ctx.t("By"), value: link(row.author.name, recordHref("users", row.author.id)), reason: ctx.t("A post's author never changes.") },
        ...(row.business?.id ? [{ label: ctx.t("As business"), value: link(localized(row.business.name, ctx.locale), recordHref("businesses", row.business.id)), reason: ctx.t("Chosen when it was posted.") }] : []),
        { label: ctx.t("Type"), value: typeCell(p.type, ctx), reason: ctx.t("Its fields depend on its type.") },
        { label: ctx.t("Place"), value: place ? link(placeLabel(index, place.slug, ctx.locale), recordHref("places", place.id)) : { kind: "empty" }, reason: ctx.t("Chosen when it was posted.") },
        ...(row.parent?.id ? [{ label: ctx.t("Reply to"), value: link(row.parent.body.slice(0, 80), recordHref("posts", row.parent.id)), reason: ctx.t("A reply stays under its post.") }] : []),
        { label: ctx.t("Visibility"), value: statusCell(p.status, ctx), reason: ctx.t("Changes with Show again / Hide.") },
        { label: ctx.t("Posted"), value: date(p.createdAt), reason: ctx.t("Set when it was posted.") },
      ],
      actions,
      related: [
        reports,
        {
          title: ctx.t("Replies"),
          columns: [
            { key: "body", label: ctx.t("Reply") },
            { key: "by", label: ctx.t("By") },
            { key: "created", label: ctx.t("Posted") },
          ],
          rows: replyRows.map((r) => ({ href: recordHref("posts", r.id), cells: { body: text(r.body.slice(0, 120)), by: text(r.author), created: date(r.createdAt) } })),
        },
      ],
      deletion: {
        warning: ctx.t("Its replies, votes and saves are deleted with it, and its open reports are cancelled. This can't be undone."),
        confirmWord: ctx.t("delete"),
      },
    };
  },

  async update(id, values, ctx): Promise<WriteResult> {
    const tx = ctx.tx!;
    const [p] = await tx.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!p) return { ok: false, error: "This post no longer exists." };
    const body = values.body as string;
    await tx.update(posts).set({ body }).where(eq(posts.id, id));
    refreshPosts();
    return { ok: true, label: p.body.slice(0, 80), changes: diff({ body: p.body }, { body }) };
  },

  async act(id, action, input, ctx): Promise<WriteResult> {
    const [p] = await db.select({ status: posts.status }).from(posts).where(eq(posts.id, id)).limit(1);
    if (!p) return { ok: false, error: "This post no longer exists." };
    const note = input.trim().slice(0, 500);
    if ((action === "hide" && p.status !== "hidden") || (action === "show" && p.status !== "visible")) {
      const result = await moderate(ctx, "post", id, action === "hide", note);
      refreshPosts();
      return result;
    }
    return { ok: false, error: "You can't do that." };
  },

  async remove(id, ctx): Promise<WriteResult> {
    const tx = ctx.tx!;
    const [p] = await tx.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!p) return { ok: false, error: "This post no longer exists." };
    await tx.delete(posts).where(eq(posts.id, id));
    refreshPosts();
    return { ok: true, label: p.body.slice(0, 80) };
  },
};

const REVIEW_STATUS_LABELS = { visible: "Visible", hidden: "Hidden" } as const;

export const reviewsResource: Resource = {
  key: "reviews",
  actsOnItsOwn: true,
  defaultSort: "-written",
  search: (ctx) => ctx.t("Search the text"),
  columns: (ctx) => [
    { key: "business", label: ctx.t("Business") },
    { key: "author", label: ctx.t("By") },
    { key: "rating", label: ctx.t("Rating"), sortable: true, align: "end" },
    { key: "text", label: ctx.t("Review") },
    { key: "reports", label: ctx.t("Reports"), sortable: true, align: "end", hidden: true },
    { key: "visibility", label: ctx.t("Visibility") },
    { key: "written", label: ctx.t("Written"), sortable: true },
  ],
  filters: (ctx) => [
    { key: "rating", label: ctx.t("Rating"), options: ["1", "2", "3", "4", "5"].map((value) => ({ value, label: `${value} ★` })) },
    { key: "visibility", label: ctx.t("Visibility"), options: REVIEW_STATUSES.map((value) => ({ value, label: ctx.t(REVIEW_STATUS_LABELS[value]) })) },
  ],
  async list(params, ctx) {
    const rating = filterValue(params, "rating", ["1", "2", "3", "4", "5"] as const);
    const status = filterValue(params, "visibility", REVIEW_STATUSES);
    const pattern = params.q ? likePattern(params.q) : null;
    const reports = openReports("business_reviews", sql`"business_reviews"."id"`);
    const rows = await db
      .select({
        id: businessReviews.id,
        rating: businessReviews.rating,
        text: businessReviews.text,
        status: businessReviews.status,
        createdAt: businessReviews.createdAt,
        business: { id: businesses.id, name: businesses.name },
        author: { id: users.id, name: users.name },
        reports,
        total: totalCount,
      })
      .from(businessReviews)
      .innerJoin(businesses, eq(businesses.id, businessReviews.businessId))
      .innerJoin(users, eq(users.id, businessReviews.authorId))
      .where(
        and(
          rating ? eq(businessReviews.rating, Number(rating)) : undefined,
          status ? eq(businessReviews.status, status) : undefined,
          params.filters.business ? eq(businesses.username, params.filters.business) : undefined,
          pattern ? or(ilike(businessReviews.text, pattern), sql`${allLanguages(businesses.name)} ilike ${pattern}`) : undefined,
        ),
      )
      .orderBy(...orderBy(params.sort, { rating: businessReviews.rating, written: businessReviews.createdAt, reports }, "-written"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    return {
      total: totalOf(rows),
      rows: rows.map((row) => ({
        href: recordHref("reviews", row.id),
        cells: {
          business: link(localized(row.business.name, ctx.locale), recordHref("businesses", row.business.id)),
          author: link(row.author.name, recordHref("users", row.author.id)),
          rating: badge(`${row.rating} ★`, row.rating >= 4 ? "green" : row.rating === 3 ? "amber" : "red"),
          text: text(row.text.slice(0, 120)),
          reports: row.reports ? badge(String(row.reports), "red") : number(0),
          visibility: badge(ctx.t(REVIEW_STATUS_LABELS[row.status]), row.status === "visible" ? "green" : "red"),
          written: date(row.createdAt),
        },
      })),
    };
  },
  async view(id, ctx) {
    const [row] = await db
      .select({ review: businessReviews, business: { id: businesses.id, name: businesses.name, username: businesses.username }, author: { id: users.id, name: users.name } })
      .from(businessReviews)
      .innerJoin(businesses, eq(businesses.id, businessReviews.businessId))
      .innerJoin(users, eq(users.id, businessReviews.authorId))
      .where(eq(businessReviews.id, id))
      .limit(1);
    if (!row) return null;
    const r = row.review;
    const words = ctx.t("Written by its author: only they can change it.");
    return {
      title: `${r.rating} ★`,
      subtitle: localized(row.business.name, ctx.locale),
      badges: [{ value: ctx.t(REVIEW_STATUS_LABELS[r.status]), tone: r.status === "visible" ? "green" : "red" }],
      publicHref: href("businessReviews", { params: { username: row.business.username } }),
      fields: [],
      values: {},
      locked: [
        { label: ctx.t("Business"), value: link(localized(row.business.name, ctx.locale), recordHref("businesses", row.business.id)), reason: words },
        { label: ctx.t("By"), value: link(row.author.name, recordHref("users", row.author.id)), reason: words },
        { label: ctx.t("Rating"), value: number(r.rating), reason: words },
        { label: ctx.t("Review"), value: text(r.text), reason: words },
        { label: ctx.t("Written"), value: date(r.createdAt), reason: words },
      ],
      actions:
        r.status === "visible"
          ? [{
              key: "hide",
              label: ctx.t("Hide review"),
              tone: "destructive",
              confirm: { title: ctx.t("Hide this review?"), description: ctx.t("It no longer counts in the rating. Its author still sees it."), input: ctx.t("Reason") },
            }]
          : [{ key: "show", label: ctx.t("Show again") }],
      related: [await reportsAbout("business_reviews", id, ctx)],
    };
  },
  async act(id, action, input, ctx): Promise<WriteResult> {
    const [r] = await db
      .select({ status: businessReviews.status, username: businesses.username })
      .from(businessReviews)
      .innerJoin(businesses, eq(businesses.id, businessReviews.businessId))
      .where(eq(businessReviews.id, id))
      .limit(1);
    if (!r) return { ok: false, error: "Something went wrong. Please try again." };
    if ((action === "hide" && r.status === "visible") || (action === "show" && r.status === "hidden")) {
      const result = await moderate(ctx, "review", id, action === "hide", input.trim().slice(0, 500));
      revalidatePath(`/bs/${r.username}`, "layout");
      return result;
    }
    return { ok: false, error: "You can't do that." };
  },
};

/** Who follows which business: for reference. */
export const followsResource: Resource = {
  key: "follows",
  defaultSort: "-since",
  search: (ctx) => ctx.t("Search by person or business"),
  columns: (ctx) => [
    { key: "person", label: ctx.t("Person") },
    { key: "business", label: ctx.t("Business") },
    { key: "since", label: ctx.t("Since"), sortable: true },
  ],
  async list(params, ctx) {
    const pattern = params.q ? likePattern(params.q) : null;
    const rows = await db
      .select({ createdAt: businessFollows.createdAt, user: { id: users.id, name: users.name }, business: { id: businesses.id, name: businesses.name }, total: totalCount })
      .from(businessFollows)
      .innerJoin(users, eq(users.id, businessFollows.userId))
      .innerJoin(businesses, eq(businesses.id, businessFollows.businessId))
      .where(pattern ? or(ilike(users.name, pattern), sql`${allLanguages(businesses.name)} ilike ${pattern}`) : undefined)
      .orderBy(...orderBy(params.sort, { since: businessFollows.createdAt }, "-since"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    return {
      total: totalOf(rows),
      rows: rows.map((row) => ({
        href: null,
        cells: {
          person: link(row.user.name, recordHref("users", row.user.id)),
          business: link(localized(row.business.name, ctx.locale), recordHref("businesses", row.business.id)),
          since: date(row.createdAt),
        },
      })),
    };
  },
};

/** Helpful / not helpful votes: for reference. */
export const votesResource: Resource = {
  key: "votes",
  defaultSort: "-when",
  search: (ctx) => ctx.t("Search by person"),
  columns: (ctx) => [
    { key: "person", label: ctx.t("Person") },
    { key: "post", label: ctx.t("Post") },
    { key: "vote", label: ctx.t("Vote") },
    { key: "when", label: ctx.t("When"), sortable: true },
  ],
  filters: (ctx) => [
    { key: "vote", label: ctx.t("Vote"), options: [{ value: "1", label: ctx.t("Helpful") }, { value: "-1", label: ctx.t("Not helpful") }] },
  ],
  async list(params, ctx) {
    const vote = filterValue(params, "vote", ["1", "-1"] as const);
    const pattern = params.q ? likePattern(params.q) : null;
    const rows = await db
      .select({ value: postVotes.value, createdAt: postVotes.createdAt, user: { id: users.id, name: users.name }, post: { id: posts.id, body: posts.body }, total: totalCount })
      .from(postVotes)
      .innerJoin(users, eq(users.id, postVotes.userId))
      .innerJoin(posts, eq(posts.id, postVotes.postId))
      .where(and(vote ? eq(postVotes.value, Number(vote)) : undefined, pattern ? ilike(users.name, pattern) : undefined))
      .orderBy(...orderBy(params.sort, { when: postVotes.createdAt }, "-when"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    return {
      total: totalOf(rows),
      rows: rows.map((row) => ({
        href: null,
        cells: {
          person: link(row.user.name, recordHref("users", row.user.id)),
          post: link(row.post.body.slice(0, 80), recordHref("posts", row.post.id)),
          vote: row.value > 0 ? badge(ctx.t("Helpful"), "green") : badge(ctx.t("Not helpful"), "red"),
          when: date(row.createdAt),
        },
      })),
    };
  },
};

/** Bookmarks: for reference (they're private to each person in the app). */
export const savesResource: Resource = {
  key: "saves",
  defaultSort: "-when",
  search: (ctx) => ctx.t("Search by person"),
  columns: (ctx) => [
    { key: "person", label: ctx.t("Person") },
    { key: "post", label: ctx.t("Post") },
    { key: "when", label: ctx.t("When"), sortable: true },
  ],
  async list(params) {
    const pattern = params.q ? likePattern(params.q) : null;
    const rows = await db
      .select({ createdAt: postSaves.createdAt, user: { id: users.id, name: users.name }, post: { id: posts.id, body: posts.body }, total: totalCount })
      .from(postSaves)
      .innerJoin(users, eq(users.id, postSaves.userId))
      .innerJoin(posts, eq(posts.id, postSaves.postId))
      .where(pattern ? ilike(users.name, pattern) : undefined)
      .orderBy(...orderBy(params.sort, { when: postSaves.createdAt }, "-when"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    return {
      total: totalOf(rows),
      rows: rows.map((row) => ({
        href: null,
        cells: {
          person: link(row.user.name, recordHref("users", row.user.id)),
          post: link(row.post.body.slice(0, 80), recordHref("posts", row.post.id)),
          when: date(row.createdAt),
        },
      })),
    };
  },
};
