import "server-only";

import { and, asc, eq, isNull, ne, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { revalidatePath, updateTag } from "next/cache";

import { db } from "@/db";
import { placeAdmins, places, placeTypes, users } from "@/db/schema";
import type { Tx } from "@/lib/actions/run";
import { getPlaceIndex, PLACES_TAG } from "@/lib/data/places";
import { ticketsAbout } from "@/lib/data/tickets";
import { compactLocalized, fillLocalized, type Localized } from "@/lib/localized";
import { placeLabel, slugify } from "@/lib/places";
import { TICKET_STATUS_LABELS } from "@/lib/tickets/statuses";
import { TICKET_TYPES } from "@/lib/tickets/types";

import { recordHref, tableHref } from "../links";
import {
  allLanguages,
  badge,
  bool,
  date,
  diff,
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
import type { Field } from "../types";
import { STATUS_TONES as TICKET_TONES } from "./tickets";

const parentsTable = alias(places, "parents");

function refreshPlaces() {
  updateTag(PLACES_TAG);
  revalidatePath("/", "layout");
}

/** A slug nobody has: from the name, then with its parent, then numbered. */
async function freeSlug(tx: Tx, name: Localized, parentSlug: string | null) {
  const base = slugify(name.en ?? "") || slugify(name.ar ?? "") || "place";
  const candidates = [base, ...(parentSlug ? [`${base}-${parentSlug}`.slice(0, 80)] : []), ...Array.from({ length: 50 }, (_, i) => `${base}-${i + 2}`)];
  for (const slug of candidates) {
    if (!(await tx.$count(places, eq(places.slug, slug)))) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

async function typeOptions(ctx: Ctx) {
  const rows = await db.select({ id: placeTypes.id, name: placeTypes.name }).from(placeTypes).orderBy(asc(placeTypes.createdAt));
  return rows.map((row) => ({ value: row.id, label: localized(row.name, ctx.locale) }));
}

/** Everything that would stop a place from being deleted. */
async function placeUsage(id: string) {
  const [row] = await db
    .select({
      children: sql<number>`(select count(*) from places c where c.parent_id = ${id})::int`,
      posts: sql<number>`(select count(*) from posts p where p.place_id = ${id})::int`,
      branches: sql<number>`(select count(*) from business_locations l where l.place_id = ${id})::int`,
    })
    .from(sql`(select 1) as one`);
  return row;
}

/**
 * Whether another row already has this name, in either language (any
 * case): a place under the same parent, or a kind of place anywhere.
 */
async function nameTaken(tx: Tx, table: typeof places | typeof placeTypes, name: Localized, scope?: SQL, exceptId?: string) {
  const wanted = [name.en, name.ar].filter((v): v is string => !!v).map((v) => v.trim().toLowerCase());
  if (!wanted.length) return false;
  const taken = await tx.$count(
    table,
    and(
      scope,
      exceptId ? ne(table.id, exceptId) : undefined,
      sql`(lower(${table.name}->>'en') in ${wanted} or lower(${table.name}->>'ar') in ${wanted})`,
    ),
  );
  return taken > 0;
}

const TAKEN = { ok: false, error: "Something went wrong. Please try again.", fields: { "name.en": "This name is taken" } } as const;

const placeFields = async (ctx: Ctx, withParent: boolean): Promise<Field[]> => [
  ...(withParent ? [{ name: "parent", label: ctx.t("Inside (empty = top level)"), kind: "place" as const }] : []),
  { name: "name", label: ctx.t("Name"), kind: "localized", max: 60 },
  { name: "type", label: ctx.t("Kind of place"), kind: "select", options: await typeOptions(ctx) },
  { name: "lat", label: ctx.t("Latitude (optional)"), kind: "number", step: 0.0001 },
  { name: "lng", label: ctx.t("Longitude (optional)"), kind: "number", step: 0.0001 },
];

export const placesResource: Resource = {
  key: "places",
  defaultSort: "path",
  search: (ctx) => ctx.t("Search by name"),
  columns: (ctx) => [
    { key: "place", label: ctx.t("Place"), sortable: true },
    { key: "inside", label: ctx.t("Inside") },
    { key: "type", label: ctx.t("Kind of place") },
    { key: "admins", label: ctx.t("Admins"), sortable: true, align: "end" },
    { key: "inner", label: ctx.t("Places inside"), align: "end" },
    { key: "posts", label: ctx.t("Posts"), sortable: true, align: "end" },
    { key: "branches", label: ctx.t("Branches"), align: "end", hidden: true },
    { key: "added", label: ctx.t("Added"), sortable: true, hidden: true },
  ],
  async filters(ctx) {
    const index = await getPlaceIndex();
    return [
      {
        key: "inside",
        label: ctx.t("Inside"),
        options: [
          { value: "top", label: ctx.t("Top level") },
          ...index.all.filter((p) => index.childrenOf(p.id).length).map((p) => ({ value: p.slug, label: placeLabel(index, p.slug, ctx.locale) })),
        ],
      },
      { key: "type", label: ctx.t("Kind of place"), options: await typeOptions(ctx) },
    ];
  },
  async list(params, ctx) {
    const index = await getPlaceIndex();
    const inside = params.filters.inside;
    const parent = inside && inside !== "top" ? index.get(inside) : undefined;
    const pattern = params.q ? likePattern(params.q) : null;
    const admins = sql<number>`(select count(*) from place_admins a where a.place_id = "places"."id")::int`;
    const postCount = sql<number>`(select count(*) from posts p where p.place_id = "places"."id")::int`;
    // The tree's order: each place right under the one it's inside.
    const path = sql`(
      with recursive up as (
        select pl.id, pl.parent_id, coalesce(pl.name->>'en', pl.name->>'ar')::text as path from places pl where pl.id = "places"."id"
        union all
        select p.id, p.parent_id, coalesce(p.name->>'en', p.name->>'ar') || ' / ' || up.path from places p join up on p.id = up.parent_id
      ) select path from up where parent_id is null
    )`;
    const rows = await db
      .select({
        id: places.id, slug: places.slug, name: places.name, parentId: places.parentId, createdAt: places.createdAt,
        type: placeTypes.name,
        admins,
        inner: sql<number>`(select count(*) from places c where c.parent_id = "places"."id")::int`,
        posts: postCount,
        branches: sql<number>`(select count(*) from business_locations l where l.place_id = "places"."id")::int`,
        total: totalCount,
      })
      .from(places)
      .innerJoin(placeTypes, eq(placeTypes.id, places.typeId))
      .where(
        and(
          inside === "top" ? isNull(places.parentId) : parent ? eq(places.parentId, parent.id) : undefined,
          params.filters.type ? eq(places.typeId, params.filters.type) : undefined,
          pattern ? sql`${allLanguages(places.name)} ilike ${pattern}` : undefined,
        ),
      )
      .orderBy(...orderBy(params.sort, { place: sql`coalesce(${places.name}->>'en', ${places.name}->>'ar')`, path, admins, posts: postCount, added: places.createdAt }, "path"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    return {
      total: totalOf(rows),
      rows: rows.map((row) => {
        const up = index.getById(row.parentId);
        return {
          href: recordHref("places", row.id),
          cells: {
            place: text(localized(row.name, ctx.locale)),
            inside: up ? link(placeLabel(index, up.slug, ctx.locale), recordHref("places", up.id)) : badge(ctx.t("Top level"), "violet"),
            type: text(localized(row.type, ctx.locale)),
            admins: row.admins ? number(row.admins) : badge("0", "amber"),
            inner: number(row.inner),
            posts: number(row.posts),
            branches: number(row.branches),
            added: date(row.createdAt),
          },
        };
      }),
    };
  },

  async view(id, ctx) {
    const [row] = await db
      .select({ place: places, parent: { id: parentsTable.id, slug: parentsTable.slug } })
      .from(places)
      .leftJoin(parentsTable, eq(parentsTable.id, places.parentId))
      .where(eq(places.id, id))
      .limit(1);
    if (!row) return null;
    const p = row.place;
    const index = await getPlaceIndex();
    const [adminRows, inner, requests, usage] = await Promise.all([
      db.select({ id: placeAdmins.id, since: placeAdmins.createdAt, user: { id: users.id, name: users.name, username: users.username } })
        .from(placeAdmins).innerJoin(users, eq(users.id, placeAdmins.userId)).where(eq(placeAdmins.placeId, id)).orderBy(asc(placeAdmins.createdAt)),
      db.select({ id: places.id, name: places.name }).from(places).where(eq(places.parentId, id)).orderBy(sql`coalesce(${places.name}->>'en', ${places.name}->>'ar')`),
      ticketsAbout({ table: "places", id }, 10),
      placeUsage(id),
    ]);
    const empty = !usage.children && !usage.posts && !usage.branches;
    return {
      title: localized(p.name, ctx.locale),
      subtitle: row.parent?.slug ? placeLabel(index, row.parent.slug, ctx.locale) : ctx.t("Top level"),
      fields: await placeFields(ctx, false),
      values: { name: fillLocalized(p.name), type: p.typeId, lat: p.lat ?? "", lng: p.lng ?? "" },
      locked: [
        { label: ctx.t("Inside"), value: row.parent?.id ? link(placeLabel(index, row.parent.slug, ctx.locale), recordHref("places", row.parent.id)) : badge(ctx.t("Top level"), "violet"), reason: ctx.t("Moving a place is planned; today it would move its posts and branches too.") },
        { label: ctx.t("Address name"), value: { kind: "text", value: p.slug, dir: "ltr" }, reason: ctx.t("Posts and branches point at it.") },
        { label: ctx.t("Added"), value: date(p.createdAt), reason: ctx.t("Set when it was added.") },
      ],
      actions: [
        { key: "add-admin", label: ctx.t("Add an admin"), confirm: { title: ctx.t("Add an admin"), description: ctx.t("They look after this place only, not the places inside it."), input: ctx.t("Their @username") } },
      ],
      related: [
        {
          title: ctx.t("Admins"),
          columns: [
            { key: "person", label: ctx.t("Person") },
            { key: "since", label: ctx.t("Since") },
          ],
          rows: adminRows.map((a) => ({ href: recordHref("place-admins", a.id), cells: { person: link(a.user.name, recordHref("users", a.user.id), `@${a.user.username}`), since: date(a.since) } })),
        },
        {
          title: ctx.t("Places inside"),
          columns: [{ key: "name", label: ctx.t("Place") }],
          rows: inner.map((c) => ({ href: recordHref("places", c.id), cells: { name: text(localized(c.name, ctx.locale)) } })),
          more: { href: tableHref("places", { inside: p.slug }), total: usage.children },
        },
        {
          title: ctx.t("Requests"),
          columns: [
            { key: "type", label: ctx.t("Type") },
            { key: "from", label: ctx.t("From") },
            { key: "status", label: ctx.t("Status") },
            { key: "when", label: ctx.t("Asked") },
          ],
          rows: requests.map((r) => ({
            href: recordHref("tickets", r.id),
            cells: {
              type: text(ctx.t(TICKET_TYPES[r.type].label), r.data.name ? localized(r.data.name as Localized, ctx.locale) : undefined),
              from: link(r.sender.name, recordHref("users", r.sender.id)),
              status: badge(ctx.t(TICKET_STATUS_LABELS[r.status]), TICKET_TONES[r.status]),
              when: date(r.createdAt),
            },
          })),
        },
      ],
      deletion: empty
        ? { warning: ctx.t("Nothing is in it yet: no places, posts or branches. Its admins go with it and its open requests are cancelled."), confirmWord: ctx.t("delete") }
        : undefined,
    };
  },

  async blank(ctx, params) {
    const index = await getPlaceIndex();
    const types = await typeOptions(ctx);
    return {
      title: ctx.t("New place"),
      fields: await placeFields(ctx, true),
      values: { parent: index.has(params.parent) ? params.parent : "", name: fillLocalized(null), type: types[0]?.value ?? "", lat: "", lng: "" },
      locked: [],
      actions: [],
      related: [],
    };
  },

  async create(values, ctx): Promise<WriteResult & { id?: string }> {
    const tx = ctx.tx!;
    const index = await getPlaceIndex();
    const parentSlug = (values.parent as string) || "";
    const parent = parentSlug ? index.get(parentSlug) : null;
    if (parent === undefined) return { ok: false, error: "Something went wrong. Please try again.", fields: { parent: "Choose a city" } };
    if (!(await tx.$count(placeTypes, eq(placeTypes.id, values.type as string)))) {
      return { ok: false, error: "Something went wrong. Please try again.", fields: { type: "Required" } };
    }
    const name = compactLocalized(values.name as Localized);
    if (await nameTaken(tx, places, name, parent ? eq(places.parentId, parent.id) : isNull(places.parentId))) return TAKEN;
    const [created] = await tx
      .insert(places)
      .values({ slug: await freeSlug(tx, name, parent?.slug ?? null), parentId: parent?.id ?? null, typeId: values.type as string, name, lat: values.lat as number | null, lng: values.lng as number | null })
      .returning({ id: places.id });
    refreshPlaces();
    return { ok: true, label: localized(name, "en"), id: created.id };
  },

  async update(id, values, ctx): Promise<WriteResult> {
    const tx = ctx.tx!;
    const [p] = await tx.select().from(places).where(eq(places.id, id)).limit(1);
    if (!p) return { ok: false, error: "Something went wrong. Please try again." };
    if (!(await tx.$count(placeTypes, eq(placeTypes.id, values.type as string)))) {
      return { ok: false, error: "Something went wrong. Please try again.", fields: { type: "Required" } };
    }
    const next = { name: compactLocalized(values.name as Localized), typeId: values.type as string, lat: values.lat as number | null, lng: values.lng as number | null };
    const sameParent = p.parentId ? eq(places.parentId, p.parentId) : isNull(places.parentId);
    if (await nameTaken(tx, places, next.name, sameParent, id)) return TAKEN;
    await tx.update(places).set(next).where(eq(places.id, id));
    refreshPlaces();
    return { ok: true, label: localized(p.name, "en"), changes: diff({ name: p.name, typeId: p.typeId, lat: p.lat, lng: p.lng }, next) };
  },

  async act(id, action, input, ctx): Promise<WriteResult> {
    const tx = ctx.tx!;
    const [p] = await tx.select().from(places).where(eq(places.id, id)).limit(1);
    if (!p || action !== "add-admin") return { ok: false, error: "You can't do that." };
    const username = input.trim().replace(/^@/, "").toLowerCase();
    const [user] = await tx.select({ id: users.id, status: users.status }).from(users).where(eq(users.username, username)).limit(1);
    if (!user || user.status === "deleted") return { ok: false, error: "Nobody has this username" };
    await tx.insert(placeAdmins).values({ placeId: id, userId: user.id }).onConflictDoNothing();
    revalidatePath("/profile", "layout");
    return { ok: true, label: localized(p.name, "en"), changes: { admin: { from: null, to: `@${username}` } } };
  },

  async remove(id, ctx): Promise<WriteResult> {
    const tx = ctx.tx!;
    const [p] = await tx.select().from(places).where(eq(places.id, id)).limit(1);
    if (!p) return { ok: false, error: "Something went wrong. Please try again." };
    const usage = await placeUsage(id);
    if (usage.children || usage.posts || usage.branches) return { ok: false, error: "You can't do that." };
    await tx.delete(places).where(eq(places.id, id));
    refreshPlaces();
    return { ok: true, label: localized(p.name, "en") };
  },
};

export const placeTypesResource: Resource = {
  key: "place-types",
  defaultSort: "added",
  search: (ctx) => ctx.t("Search by name"),
  columns: (ctx) => [
    { key: "name", label: ctx.t("Kind of place"), sortable: true },
    { key: "listed", label: ctx.t("Offered in requests") },
    { key: "places", label: ctx.t("Places"), sortable: true, align: "end" },
    { key: "added", label: ctx.t("Added"), sortable: true },
  ],
  async list(params, ctx) {
    const pattern = params.q ? likePattern(params.q) : null;
    const count = sql<number>`(select count(*) from places p where p.type_id = "place_types"."id")::int`;
    const rows = await db
      .select({ id: placeTypes.id, name: placeTypes.name, listed: placeTypes.listed, createdAt: placeTypes.createdAt, places: count, total: totalCount })
      .from(placeTypes)
      .where(pattern ? sql`${allLanguages(placeTypes.name)} ilike ${pattern}` : undefined)
      .orderBy(...orderBy(params.sort, { name: sql`coalesce(${placeTypes.name}->>'en', ${placeTypes.name}->>'ar')`, places: count, added: placeTypes.createdAt }, "added"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    return {
      total: totalOf(rows),
      rows: rows.map((row) => ({
        href: recordHref("place-types", row.id),
        cells: { name: text(localized(row.name, ctx.locale)), listed: bool(row.listed), places: number(row.places), added: date(row.createdAt) },
      })),
    };
  },
  async view(id, ctx) {
    const [type] = await db.select().from(placeTypes).where(eq(placeTypes.id, id)).limit(1);
    if (!type) return null;
    const used = await db.$count(places, eq(places.typeId, id));
    return {
      title: localized(type.name, ctx.locale),
      fields: [
        { name: "name", label: ctx.t("Name"), kind: "localized", max: 50 },
        { name: "listed", label: ctx.t("Offered in requests"), kind: "switch", description: ctx.t("People can pick it when asking for a place.") },
      ],
      values: { name: fillLocalized(type.name), listed: type.listed },
      locked: [{ label: ctx.t("Places"), value: link(String(used), tableHref("places", { type: id })), reason: ctx.t("Counted from the places of this kind.") }],
      actions: [],
      related: [],
      deletion: used ? undefined : { warning: ctx.t("No place uses it."), confirmWord: ctx.t("delete") },
    };
  },
  async blank(ctx) {
    return {
      title: ctx.t("New kind of place"),
      fields: [
        { name: "name", label: ctx.t("Name"), kind: "localized", max: 50 },
        { name: "listed", label: ctx.t("Offered in requests"), kind: "switch" },
      ],
      values: { name: fillLocalized(null), listed: true },
      locked: [],
      actions: [],
      related: [],
    };
  },
  async create(values, ctx): Promise<WriteResult & { id?: string }> {
    const name = compactLocalized(values.name as Localized);
    if (await nameTaken(ctx.tx!, placeTypes, name)) return TAKEN;
    const [created] = await ctx.tx!.insert(placeTypes).values({ name, listed: values.listed as boolean }).returning({ id: placeTypes.id });
    refreshPlaces();
    return { ok: true, label: localized(name, "en"), id: created.id };
  },
  async update(id, values, ctx): Promise<WriteResult> {
    const tx = ctx.tx!;
    const [type] = await tx.select().from(placeTypes).where(eq(placeTypes.id, id)).limit(1);
    if (!type) return { ok: false, error: "Something went wrong. Please try again." };
    const next = { name: compactLocalized(values.name as Localized), listed: values.listed as boolean };
    if (await nameTaken(tx, placeTypes, next.name, undefined, id)) return TAKEN;
    await tx.update(placeTypes).set(next).where(eq(placeTypes.id, id));
    refreshPlaces();
    return { ok: true, label: localized(type.name, "en"), changes: diff({ name: type.name, listed: type.listed }, next) };
  },
  async remove(id, ctx): Promise<WriteResult> {
    const tx = ctx.tx!;
    const [type] = await tx.select().from(placeTypes).where(eq(placeTypes.id, id)).limit(1);
    if (!type) return { ok: false, error: "Something went wrong. Please try again." };
    if (await tx.$count(places, eq(places.typeId, id))) return { ok: false, error: "You can't do that." };
    await tx.delete(placeTypes).where(eq(placeTypes.id, id));
    refreshPlaces();
    return { ok: true, label: localized(type.name, "en") };
  },
};

export const placeAdminsResource: Resource = {
  key: "place-admins",
  defaultSort: "-since",
  search: (ctx) => ctx.t("Search by person or place"),
  columns: (ctx) => [
    { key: "person", label: ctx.t("Person") },
    { key: "place", label: ctx.t("Place") },
    { key: "since", label: ctx.t("Since"), sortable: true },
  ],
  async list(params, ctx) {
    const index = await getPlaceIndex();
    const pattern = params.q ? likePattern(params.q) : null;
    const rows = await db
      .select({ id: placeAdmins.id, since: placeAdmins.createdAt, user: { id: users.id, name: users.name, username: users.username }, place: { id: places.id, slug: places.slug }, total: totalCount })
      .from(placeAdmins)
      .innerJoin(users, eq(users.id, placeAdmins.userId))
      .innerJoin(places, eq(places.id, placeAdmins.placeId))
      .where(pattern ? sql`(${users.name} ilike ${pattern} or ${users.username} ilike ${pattern} or ${allLanguages(places.name)} ilike ${pattern})` : undefined)
      .orderBy(...orderBy(params.sort, { since: placeAdmins.createdAt }, "-since"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    return {
      total: totalOf(rows),
      rows: rows.map((row) => ({
        href: recordHref("place-admins", row.id),
        cells: {
          person: link(row.user.name, recordHref("users", row.user.id), `@${row.user.username}`),
          place: link(placeLabel(index, row.place.slug, ctx.locale), recordHref("places", row.place.id)),
          since: date(row.since),
        },
      })),
    };
  },
  async view(id, ctx) {
    const [row] = await db
      .select({ since: placeAdmins.createdAt, user: { id: users.id, name: users.name }, place: { id: places.id, slug: places.slug } })
      .from(placeAdmins)
      .innerJoin(users, eq(users.id, placeAdmins.userId))
      .innerJoin(places, eq(places.id, placeAdmins.placeId))
      .where(eq(placeAdmins.id, id))
      .limit(1);
    if (!row) return null;
    const index = await getPlaceIndex();
    const where = placeLabel(index, row.place.slug, ctx.locale);
    return {
      title: row.user.name,
      subtitle: ctx.t("Looks after {{city}}", { city: where }),
      fields: [],
      values: {},
      locked: [
        { label: ctx.t("Person"), value: link(row.user.name, recordHref("users", row.user.id)), reason: ctx.t("Remove them and add someone else instead.") },
        { label: ctx.t("Place"), value: link(where, recordHref("places", row.place.id)), reason: ctx.t("Remove them and add someone else instead.") },
        { label: ctx.t("Since"), value: date(row.since), reason: ctx.t("Set when they became an admin.") },
      ],
      actions: [],
      related: [],
      deletion: { warning: ctx.t("They stop looking after this place. Their posts and requests stay."), confirmWord: ctx.t("remove") },
    };
  },
  async remove(id, ctx): Promise<WriteResult> {
    const tx = ctx.tx!;
    const [row] = await tx.select({ name: users.name }).from(placeAdmins).innerJoin(users, eq(users.id, placeAdmins.userId)).where(eq(placeAdmins.id, id)).limit(1);
    if (!row) return { ok: false, error: "Something went wrong. Please try again." };
    await tx.delete(placeAdmins).where(eq(placeAdmins.id, id));
    revalidatePath("/profile", "layout");
    return { ok: true, label: row.name };
  },
};
