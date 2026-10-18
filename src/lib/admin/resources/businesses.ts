import "server-only";

import { and, asc, desc, eq, exists, ilike, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { revalidatePath, updateTag } from "next/cache";

import { db } from "@/db";
import { businessLocations, businessReviews, businesses, posts, users } from "@/db/schema";
import {
  allowedStatuses,
  BUSINESS_STATUSES,
  STATUS_LABELS,
  type BusinessStatus,
} from "@/lib/business-status";
import { ALL_CATEGORIES, categoryOf } from "@/lib/categories";
import { BUSINESSES_TAG } from "@/lib/data/businesses";
import { getPlaceIndex, inPlaceTree } from "@/lib/data/places";
import { applyStatus, NOT_READY, readyToGoLive } from "@/lib/data/status-writes";
import { compactLocalized, fillLocalized, type Localized } from "@/lib/localized";
import { placeLabel } from "@/lib/places";
import { href } from "@/lib/routes";

import { recordHref, tableHref } from "../links";
import {
  allLanguages,
  badge,
  bool,
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
import type { Cell, RecordAction, Tone } from "../types";

export const STATUS_TONES: Record<BusinessStatus, Tone> = {
  pending: "amber",
  active: "green",
  suspended: "red",
  closed: "neutral",
  deleted: "neutral",
};

export const statusCell = (status: BusinessStatus, ctx: Ctx): Cell =>
  badge(ctx.t(STATUS_LABELS[status]), STATUS_TONES[status]);

const owners = alias(users, "owners");
const creators = alias(users, "creators");

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** A name sorted in English, or Arabic when it has no English. */
const nameOrder = sql`coalesce(${businesses.name}->>'en', ${businesses.name}->>'ar')`;

function refreshBusiness(username: string) {
  updateTag(BUSINESSES_TAG);
  revalidatePath(`/bs/${username}`, "layout");
  revalidatePath("/c/[slug]", "page");
  revalidatePath("/admin", "layout");
}

/** A place id as a linked "Edfu, Aswan". */
async function placeCell(placeId: string, ctx: Ctx): Promise<Cell> {
  const index = await getPlaceIndex();
  const place = index.getById(placeId);
  return place ? link(placeLabel(index, place.slug, ctx.locale), recordHref("places", place.id)) : { kind: "empty" };
}

export const businessesResource: Resource = {
  key: "businesses",
  defaultSort: "-added",
  search: (ctx) => ctx.t("Search by name or @username"),
  columns: (ctx) => [
    { key: "business", label: ctx.t("Business"), sortable: true },
    { key: "category", label: ctx.t("Category") },
    { key: "owner", label: ctx.t("Owner") },
    { key: "addedBy", label: ctx.t("Added by"), hidden: true },
    { key: "places", label: ctx.t("Places") },
    { key: "status", label: ctx.t("Status") },
    { key: "verified", label: ctx.t("Verified") },
    { key: "followers", label: ctx.t("Followers"), sortable: true, align: "end", hidden: true },
    { key: "added", label: ctx.t("Added"), sortable: true },
  ],
  async filters(ctx) {
    const index = await getPlaceIndex();
    return [
      {
        key: "status",
        label: ctx.t("Status"),
        options: BUSINESS_STATUSES.map((value) => ({ value, label: ctx.t(STATUS_LABELS[value]) })),
      },
      {
        key: "verified",
        label: ctx.t("Verified"),
        options: [
          { value: "yes", label: ctx.t("Verified") },
          { value: "no", label: ctx.t("Not verified") },
        ],
      },
      {
        key: "place",
        label: ctx.t("Place"),
        options: index.all.map((p) => ({ value: p.slug, label: placeLabel(index, p.slug, ctx.locale) })),
      },
      {
        key: "category",
        label: ctx.t("Category"),
        options: ALL_CATEGORIES.map((c) => ({ value: c.slug, label: c.name[ctx.locale] })),
      },
    ];
  },
  async list(params, ctx) {
    const index = await getPlaceIndex();
    const status = filterValue(params, "status", BUSINESS_STATUSES);
    const verified = params.filters.verified;
    const place = index.has(params.filters.place) ? params.filters.place : null;
    const category = params.filters.category;
    const owner = params.filters.owner;
    const pattern = params.q ? likePattern(params.q) : null;
    const followers = sql<number>`(select count(*) from business_follows f join users u on u.id = f.user_id where f.business_id = "businesses"."id" and u.status = 'active')::int`;
    const rows = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        username: businesses.username,
        image: businesses.image,
        category: businesses.category,
        status: businesses.status,
        verified: businesses.verified,
        createdAt: businesses.createdAt,
        owner: { id: owners.id, name: owners.name },
        creator: { id: creators.id, name: creators.name },
        places: sql<string[]>`(
          select coalesce(array_agg(distinct p.slug), '{}') from business_locations bl
          join places p on p.id = bl.place_id where bl.business_id = "businesses"."id"
        )`,
        followers,
        total: totalCount,
      })
      .from(businesses)
      .leftJoin(owners, eq(owners.id, businesses.ownerId))
      .leftJoin(creators, eq(creators.id, businesses.createdById))
      .where(
        and(
          status ? eq(businesses.status, status) : undefined,
          verified === "yes" ? eq(businesses.verified, true) : verified === "no" ? eq(businesses.verified, false) : undefined,
          category ? eq(businesses.category, category) : undefined,
          owner ? eq(owners.username, owner) : undefined,
          place
            ? exists(
                db
                  .select({ one: sql`1` })
                  .from(businessLocations)
                  .where(and(eq(businessLocations.businessId, businesses.id), inPlaceTree(businessLocations.placeId, place))),
              )
            : undefined,
          pattern ? or(sql`${allLanguages(businesses.name)} ilike ${pattern}`, ilike(businesses.username, pattern)) : undefined,
        ),
      )
      .orderBy(...orderBy(params.sort, { business: nameOrder, added: businesses.createdAt, followers }, "-added"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);

    return {
      total: totalOf(rows),
      rows: rows.map((row) => ({
        href: recordHref("businesses", row.id),
        cells: {
          business: { kind: "image", src: row.image, alt: "", value: localized(row.name, ctx.locale), sub: `@${row.username}` },
          category: text(categoryOf(row.category)?.name[ctx.locale] ?? row.category),
          owner: row.owner?.id ? link(row.owner.name, recordHref("users", row.owner.id)) : badge(ctx.t("No owner yet"), "amber"),
          addedBy: row.creator?.id ? link(row.creator.name, recordHref("users", row.creator.id)) : { kind: "empty" },
          places: {
            kind: "badges",
            values: row.places.map((slug) => ({ value: placeLabel(index, slug, ctx.locale), tone: "blue" as const })),
          },
          status: statusCell(row.status, ctx),
          verified: bool(row.verified),
          followers: number(row.followers),
          added: date(row.createdAt),
        },
      })),
    };
  },

  async view(id, ctx) {
    const [row] = await db
      .select({ business: businesses, owner: { id: owners.id, name: owners.name, username: owners.username }, creator: { id: creators.id, name: creators.name } })
      .from(businesses)
      .leftJoin(owners, eq(owners.id, businesses.ownerId))
      .leftJoin(creators, eq(creators.id, businesses.createdById))
      .where(eq(businesses.id, id))
      .limit(1);
    if (!row) return null;
    const b = row.business;
    const [branches, latest, reviewRows, postTotal, reviewTotal] = await Promise.all([
      db.select().from(businessLocations).where(eq(businessLocations.businessId, id)).orderBy(asc(businessLocations.position)),
      db.select({ id: posts.id, body: posts.body, createdAt: posts.createdAt }).from(posts)
        .where(and(eq(posts.businessId, id), sql`${posts.parentId} is null`)).orderBy(desc(posts.createdAt)).limit(5),
      db.select({ id: businessReviews.id, rating: businessReviews.rating, text: businessReviews.text, status: businessReviews.status, author: users.name, authorId: users.id })
        .from(businessReviews).innerJoin(users, eq(users.id, businessReviews.authorId))
        .where(eq(businessReviews.businessId, id)).orderBy(desc(businessReviews.createdAt)).limit(5),
      db.$count(posts, and(eq(posts.businessId, id), sql`${posts.parentId} is null`)),
      db.$count(businessReviews, eq(businessReviews.businessId, id)),
    ]);
    const name = localized(b.name, ctx.locale);

    const actions: RecordAction[] = [
      ...allowedStatuses("admin", b.status).map((to): RecordAction => ({
        key: `status:${to}`,
        label:
          to === "active"
            ? b.status === "pending" ? ctx.t("Approve") : ctx.t("Make live")
            : to === "suspended" ? ctx.t("Suspend")
              : to === "closed" ? ctx.t("Mark closed")
                : to === "deleted" ? ctx.t("Delete") : ctx.t("Back to review"),
        tone: to === "suspended" || to === "deleted" ? "destructive" : "default",
        confirm:
          to === "suspended"
            ? { title: ctx.t("Suspend {{name}}?", { name }), description: ctx.t("It's hidden everywhere until you restore it. Its owner still sees it.") }
            : to === "deleted"
              ? { title: ctx.t("Delete {{name}}?", { name }), description: ctx.t("It's gone from the app. You can bring it back by setting another status.") }
              : undefined,
      })),
      b.verified
        ? { key: "unverify", label: ctx.t("Remove verified badge") }
        : { key: "verify", label: ctx.t("Verify") },
    ];

    return {
      title: name,
      subtitle: `@${b.username}`,
      badges: [
        { value: ctx.t(STATUS_LABELS[b.status]), tone: STATUS_TONES[b.status] },
        ...(b.verified ? [{ value: ctx.t("Verified"), tone: "blue" as const }] : []),
      ],
      publicHref: href("business", { params: { username: b.username } }),
      fields: [
        { name: "name", label: ctx.t("Name"), kind: "localized", max: 100 },
        { name: "bio", label: ctx.t("About"), kind: "localized", max: 300, multiline: true },
        {
          name: "category",
          label: ctx.t("Category"),
          kind: "select",
          options: ALL_CATEGORIES.map((c) => ({ value: c.slug, label: c.name[ctx.locale] })),
        },
        { name: "owner", label: ctx.t("Owner's @username (empty = no owner yet)"), kind: "text", max: 51, dir: "ltr" },
      ],
      values: { name: fillLocalized(b.name), bio: fillLocalized(b.bio), category: b.category, owner: row.owner?.username ?? "" },
      locked: [
        { label: ctx.t("Username"), value: { kind: "text", value: `@${b.username}`, dir: "ltr" }, reason: ctx.t("Its page address: shared links would break. Its owner can change it.") },
        { label: ctx.t("Added by"), value: row.creator?.id ? link(row.creator.name, recordHref("users", row.creator.id)) : { kind: "empty" }, reason: ctx.t("Who added it never changes.") },
        { label: ctx.t("Status"), value: statusCell(b.status, ctx), reason: ctx.t("Changes with the actions above.") },
        { label: ctx.t("Time zone"), value: text(b.timeZone), reason: ctx.t("Set from its location.") },
        { label: ctx.t("Added"), value: date(b.createdAt), reason: ctx.t("Set when it was added.") },
      ],
      actions,
      related: [
        {
          title: ctx.t("Branches"),
          columns: [
            { key: "address", label: ctx.t("Address") },
            { key: "place", label: ctx.t("Place") },
          ],
          rows: await Promise.all(
            branches.map(async (l) => ({
              href: recordHref("branches", l.id),
              cells: { address: text(localized(l.address, ctx.locale)), place: await placeCell(l.placeId, ctx) },
            })),
          ),
        },
        {
          // Set by its owner in the app.
          title: ctx.t("Links"),
          columns: [
            { key: "platform", label: ctx.t("Platform") },
            { key: "url", label: ctx.t("Link") },
          ],
          rows: b.links.map((l) => ({
            href: null,
            cells: { platform: text(l.platform), url: { kind: "text", value: l.url, dir: "ltr" } },
          })),
        },
        {
          title: ctx.t("Opening hours"),
          columns: [
            { key: "day", label: ctx.t("Day") },
            { key: "hours", label: ctx.t("Hours") },
          ],
          rows: DAYS.map((day, i) => {
            const slot = b.hours[i];
            return {
              href: null,
              cells: {
                day: text(ctx.t(day)),
                hours: slot ? { kind: "text", value: `${slot.open} – ${slot.close}`, dir: "ltr" } : badge(ctx.t("Closed"), "neutral"),
              },
            };
          }),
        },
        {
          title: ctx.t("Latest posts"),
          columns: [
            { key: "body", label: ctx.t("Post") },
            { key: "created", label: ctx.t("Posted") },
          ],
          rows: latest.map((p) => ({ href: recordHref("posts", p.id), cells: { body: text(p.body.slice(0, 120)), created: date(p.createdAt) } })),
          more: { href: tableHref("posts", { business: b.username }), total: postTotal },
        },
        {
          title: ctx.t("Reviews"),
          columns: [
            { key: "author", label: ctx.t("By") },
            { key: "rating", label: ctx.t("Rating") },
            { key: "text", label: ctx.t("Review") },
          ],
          rows: reviewRows.map((r) => ({
            href: recordHref("reviews", r.id),
            cells: {
              author: link(r.author, recordHref("users", r.authorId)),
              rating: r.status === "hidden" ? badge(ctx.t("Hidden"), "red") : number(r.rating),
              text: text(r.text.slice(0, 120)),
            },
          })),
          more: { href: tableHref("reviews", { business: b.username }), total: reviewTotal },
        },
      ],
    };
  },

  async update(id, values, ctx): Promise<WriteResult> {
    const tx = ctx.tx!;
    const [b] = await tx.select().from(businesses).where(eq(businesses.id, id)).limit(1);
    if (!b) return { ok: false, error: "This business no longer exists." };
    let ownerId: string | null = null;
    const ownerHandle = values.owner as string;
    if (ownerHandle) {
      const [owner] = await tx.select({ id: users.id }).from(users).where(eq(users.username, ownerHandle)).limit(1);
      if (!owner) return { ok: false, error: "Something went wrong. Please try again.", fields: { owner: "Nobody has this username" } };
      ownerId = owner.id;
    }
    const next = {
      name: compactLocalized(values.name as Localized),
      bio: compactLocalized(values.bio as Localized),
      category: values.category as string,
      ownerId,
    };
    await tx.update(businesses).set(next).where(eq(businesses.id, id));
    refreshBusiness(b.username);
    return {
      ok: true,
      label: localized(b.name, "en"),
      changes: diff({ name: b.name, bio: b.bio, category: b.category, ownerId: b.ownerId }, next),
    };
  },

  async act(id, action, _input, ctx): Promise<WriteResult> {
    const tx = ctx.tx!;
    const [b] = await tx.select().from(businesses).where(eq(businesses.id, id)).limit(1);
    if (!b) return { ok: false, error: "This business no longer exists." };
    const label = localized(b.name, "en");
    if (action === "verify" || action === "unverify") {
      const verified = action === "verify";
      await tx.update(businesses).set({ verified }).where(eq(businesses.id, id));
      refreshBusiness(b.username);
      return { ok: true, label, changes: { verified: { from: b.verified, to: verified } } };
    }
    const to = action.replace(/^status:/, "") as BusinessStatus;
    if (!action.startsWith("status:") || !allowedStatuses("admin", b.status).includes(to)) {
      return { ok: false, error: "You can't do that." };
    }
    if (to === "active" && !(await readyToGoLive(tx, id))) {
      return { ok: false, error: NOT_READY };
    }
    await applyStatus(tx, b, to, ctx.adminId);
    refreshBusiness(b.username);
    return { ok: true, label, changes: { status: { from: b.status, to } } };
  },
};

/** A business's branch: its address and place (the pin stays the owner's). */
export const branchesResource: Resource = {
  key: "branches",
  defaultSort: "business",
  search: (ctx) => ctx.t("Search by business or address"),
  columns: (ctx) => [
    { key: "business", label: ctx.t("Business"), sortable: true },
    { key: "address", label: ctx.t("Address") },
    { key: "place", label: ctx.t("Place") },
  ],
  async filters(ctx) {
    const index = await getPlaceIndex();
    return [
      {
        key: "place",
        label: ctx.t("Place"),
        options: index.all.map((p) => ({ value: p.slug, label: placeLabel(index, p.slug, ctx.locale) })),
      },
    ];
  },
  async list(params, ctx) {
    const index = await getPlaceIndex();
    const place = index.has(params.filters.place) ? params.filters.place : null;
    const pattern = params.q ? likePattern(params.q) : null;
    const rows = await db
      .select({
        id: businessLocations.id,
        address: businessLocations.address,
        placeId: businessLocations.placeId,
        business: { id: businesses.id, name: businesses.name },
        total: totalCount,
      })
      .from(businessLocations)
      .innerJoin(businesses, eq(businesses.id, businessLocations.businessId))
      .where(
        and(
          place ? inPlaceTree(businessLocations.placeId, place) : undefined,
          pattern ? or(sql`${allLanguages(businesses.name)} ilike ${pattern}`, sql`${allLanguages(businessLocations.address)} ilike ${pattern}`) : undefined,
        ),
      )
      .orderBy(...orderBy(params.sort, { business: nameOrder }, "business"), asc(businessLocations.position))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    return {
      total: totalOf(rows),
      rows: await Promise.all(
        rows.map(async (row) => ({
          href: recordHref("branches", row.id),
          cells: {
            business: link(localized(row.business.name, ctx.locale), recordHref("businesses", row.business.id)),
            address: text(localized(row.address, ctx.locale)),
            place: await placeCell(row.placeId, ctx),
          },
        })),
      ),
    };
  },
  async view(id, ctx) {
    const [row] = await db
      .select({ branch: businessLocations, business: { id: businesses.id, name: businesses.name } })
      .from(businessLocations)
      .innerJoin(businesses, eq(businesses.id, businessLocations.businessId))
      .where(eq(businessLocations.id, id))
      .limit(1);
    if (!row) return null;
    const index = await getPlaceIndex();
    const name = localized(row.business.name, ctx.locale);
    return {
      title: localized(row.branch.address, ctx.locale) || name,
      subtitle: name,
      fields: [
        { name: "address", label: ctx.t("Address"), kind: "localized", max: 200 },
        { name: "city", label: ctx.t("Place"), kind: "place" },
      ],
      values: { address: fillLocalized(row.branch.address), city: index.getById(row.branch.placeId)?.slug ?? "" },
      locked: [
        { label: ctx.t("Business"), value: link(name, recordHref("businesses", row.business.id)), reason: ctx.t("A branch belongs to one business.") },
        { label: ctx.t("Map pin"), value: { kind: "text", value: `${row.branch.lat.toFixed(5)}, ${row.branch.lng.toFixed(5)}`, dir: "ltr" }, reason: ctx.t("Set by its owner on the map.") },
      ],
      actions: [],
      related: [],
    };
  },
  async update(id, values, ctx): Promise<WriteResult> {
    const tx = ctx.tx!;
    const [row] = await tx
      .select({ branch: businessLocations, username: businesses.username, name: businesses.name })
      .from(businessLocations)
      .innerJoin(businesses, eq(businesses.id, businessLocations.businessId))
      .where(eq(businessLocations.id, id))
      .limit(1);
    if (!row) return { ok: false, error: "Something went wrong. Please try again." };
    const place = (await getPlaceIndex()).get(values.city as string);
    if (!place) {
      return { ok: false, error: "Something went wrong. Please try again.", fields: { city: "Choose a city" } };
    }
    const next = { address: compactLocalized(values.address as Localized), placeId: place.id };
    await tx.update(businessLocations).set(next).where(eq(businessLocations.id, id));
    refreshBusiness(row.username);
    return { ok: true, label: localized(row.name, "en"), changes: diff({ address: row.branch.address, placeId: row.branch.placeId }, next) };
  },
};
