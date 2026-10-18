import "server-only";

import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  businesses,
  placeAdmins,
  places,
  posts,
  sessions,
  USER_ROLES,
  USER_STATUSES,
  users,
} from "@/db/schema";
import { STATUS_LABELS } from "@/lib/business-status";
import { isTaken } from "@/lib/auth/username";
import { anonymizeUser } from "@/lib/users/anonymize";

import { recordHref } from "../links";
import {
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
import type { Cell, RecordAction } from "../types";

const statusBadge = (status: string, ctx: Ctx): Cell =>
  status === "suspended"
    ? badge(ctx.t("Suspended"), "red")
    : status === "deleted"
      ? badge(ctx.t("Deleted"), "neutral")
      : badge(ctx.t("Active"), "green");

const roleBadge = (role: string, ctx: Ctx): Cell =>
  role === "super_admin" ? badge(ctx.t("Admin"), "violet") : badge(ctx.t("Member"), "neutral");

export const usersResource: Resource = {
  key: "users",
  defaultSort: "-joined",
  search: (ctx) => ctx.t("Search by name, @username or email"),
  columns: (ctx) => [
    { key: "person", label: ctx.t("Person"), sortable: true },
    { key: "email", label: ctx.t("Email") },
    { key: "status", label: ctx.t("Status") },
    { key: "role", label: ctx.t("Role") },
    { key: "businesses", label: ctx.t("Businesses"), sortable: true, align: "end" },
    { key: "posts", label: ctx.t("Posts"), sortable: true, align: "end" },
    { key: "places", label: ctx.t("Looks after"), hidden: true },
    { key: "joined", label: ctx.t("Joined"), sortable: true },
  ],
  filters: (ctx) => [
    {
      key: "status",
      label: ctx.t("Status"),
      options: [
        { value: "active", label: ctx.t("Active") },
        { value: "suspended", label: ctx.t("Suspended") },
        { value: "deleted", label: ctx.t("Deleted") },
      ],
    },
    {
      key: "role",
      label: ctx.t("Role"),
      options: [
        { value: "super_admin", label: ctx.t("Admin") },
        { value: "member", label: ctx.t("Member") },
      ],
    },
  ],
  async list(params, ctx) {
    const businessCount = sql<number>`(select count(*) from businesses b where b.owner_id = "users"."id")::int`;
    const postCount = sql<number>`(select count(*) from posts p where p.created_by_id = "users"."id" and p.parent_id is null)::int`;
    const status = filterValue(params, "status", USER_STATUSES);
    const role = filterValue(params, "role", USER_ROLES);
    const pattern = params.q ? likePattern(params.q) : null;
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        image: users.image,
        status: users.status,
        role: users.role,
        createdAt: users.createdAt,
        businessCount,
        postCount,
        places: sql<{ en: string }[]>`(
          select coalesce(json_agg(p.name), '[]') from place_admins a
          join places p on p.id = a.place_id where a.user_id = "users"."id"
        )`,
        total: totalCount,
      })
      .from(users)
      .where(
        and(
          status ? eq(users.status, status) : undefined,
          role ? eq(users.role, role) : undefined,
          pattern
            ? or(ilike(users.name, pattern), ilike(users.username, pattern), ilike(users.email, pattern))
            : undefined,
        ),
      )
      .orderBy(
        ...orderBy(params.sort, { person: users.name, joined: users.createdAt, businesses: businessCount, posts: postCount }, "-joined"),
      )
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);

    return {
      total: totalOf(rows),
      rows: rows.map((row) => ({
        href: recordHref("users", row.id),
        cells: {
          person: { kind: "image", src: row.image, alt: "", value: row.name, sub: `@${row.username}` },
          email: { kind: "text", value: row.email, dir: "ltr" },
          status: statusBadge(row.status, ctx),
          role: roleBadge(row.role, ctx),
          businesses: number(row.businessCount),
          posts: number(row.postCount),
          places: text(row.places.map((name) => localized(name, ctx.locale)).join(", ")),
          joined: date(row.createdAt),
        },
      })),
    };
  },

  async view(id, ctx) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) return null;
    const self = user.id === ctx.adminId;
    const [owned, written, looksAfter, devices] = await Promise.all([
      db
        .select({ id: businesses.id, name: businesses.name, username: businesses.username, status: businesses.status })
        .from(businesses)
        .where(eq(businesses.ownerId, id))
        .orderBy(desc(businesses.createdAt))
        .limit(10),
      db
        .select({ id: posts.id, body: posts.body, type: posts.type, createdAt: posts.createdAt })
        .from(posts)
        .where(and(eq(posts.createdById, id), sql`${posts.parentId} is null`))
        .orderBy(desc(posts.createdAt))
        .limit(5),
      db
        .select({ id: placeAdmins.id, placeId: places.id, name: places.name, since: placeAdmins.createdAt })
        .from(placeAdmins)
        .innerJoin(places, eq(places.id, placeAdmins.placeId))
        .where(eq(placeAdmins.userId, id)),
      db
        .select({ userAgent: sessions.userAgent, createdAt: sessions.createdAt, expiresAt: sessions.expiresAt })
        .from(sessions)
        .where(eq(sessions.userId, id))
        .orderBy(desc(sessions.createdAt))
        .limit(10),
    ]);
    const postsTotal = await db.$count(posts, and(eq(posts.createdById, id), sql`${posts.parentId} is null`));

    const actions: RecordAction[] = self || user.status === "deleted"
      ? []
      : [
          user.status === "active"
            ? {
                key: "suspend",
                label: ctx.t("Suspend"),
                tone: "destructive",
                confirm: {
                  title: ctx.t("Suspend {{name}}?", { name: user.name }),
                  description: ctx.t("They're signed out everywhere and can't sign in or post until you restore them."),
                },
              }
            : { key: "restore", label: ctx.t("Restore") },
          user.role === "super_admin"
            ? { key: "remove-admin", label: ctx.t("Remove admin") }
            : {
                key: "make-admin",
                label: ctx.t("Make admin"),
                confirm: {
                  title: ctx.t("Make {{name}} an admin?", { name: user.name }),
                  description: ctx.t("They can do everything you can in this dashboard."),
                },
              },
          {
            key: "sign-out",
            label: ctx.t("Sign out everywhere"),
            confirm: {
              title: ctx.t("Sign {{name}} out everywhere?", { name: user.name }),
              description: ctx.t("They'll need to sign in again on every device."),
            },
          },
          {
            key: "anonymize",
            label: ctx.t("Erase for good"),
            tone: "destructive",
            confirm: {
              title: ctx.t("Erase {{name}} for good?", { name: user.name }),
              description: ctx.t("Only for a legal request to erase their data. Their name, username, email and photo are erased and can't be brought back, and they can't sign in to this account again. Their businesses lose their owner."),
              input: ctx.t("Type @{{username}} to confirm", { username: user.username }),
              match: `@${user.username}`,
            },
          },
        ];

    return {
      title: user.name,
      subtitle: `@${user.username}`,
      badges: [
        statusBadge(user.status, ctx) as { kind: "badge"; value: string; tone: "red" | "green" | "neutral" },
        ...(user.role === "super_admin" ? [{ value: ctx.t("Admin"), tone: "violet" as const }] : []),
      ],
      fields: user.status === "deleted" ? [] : [
        { name: "name", label: ctx.t("Name"), kind: "text", max: 50 },
        { name: "username", label: ctx.t("Username"), kind: "text", max: 30, dir: "ltr" },
        { name: "bio", label: ctx.t("Bio"), kind: "textarea", max: 160 },
      ],
      values: { name: user.name, username: user.username, bio: user.bio ?? "" },
      locked: [
        { label: ctx.t("Email"), value: { kind: "text", value: user.email, dir: "ltr" }, reason: ctx.t("Their Google account: they sign in with it.") },
        { label: ctx.t("Status"), value: statusBadge(user.status, ctx), reason: ctx.t("Changes with Suspend / Restore.") },
        { label: ctx.t("Role"), value: roleBadge(user.role, ctx), reason: ctx.t("Changes with Make admin / Remove admin.") },
        { label: ctx.t("Joined"), value: date(user.createdAt), reason: ctx.t("Set when they first signed in.") },
      ],
      actions,
      related: [
        {
          title: ctx.t("Businesses they own"),
          columns: [
            { key: "name", label: ctx.t("Business") },
            { key: "status", label: ctx.t("Status") },
          ],
          rows: owned.map((b) => ({
            href: recordHref("businesses", b.id),
            cells: {
              name: { kind: "text", value: localized(b.name, ctx.locale), sub: `@${b.username}` },
              status: badge(ctx.t(STATUS_LABELS[b.status]), b.status === "active" ? "green" : b.status === "pending" ? "amber" : b.status === "suspended" ? "red" : "neutral"),
            },
          })),
        },
        {
          title: ctx.t("Places they look after"),
          columns: [
            { key: "place", label: ctx.t("Place") },
            { key: "since", label: ctx.t("Since") },
          ],
          rows: looksAfter.map((p) => ({
            href: recordHref("place-admins", p.id),
            cells: { place: link(localized(p.name, ctx.locale), recordHref("places", p.placeId)), since: date(p.since) },
          })),
        },
        {
          title: ctx.t("Latest posts"),
          columns: [
            { key: "body", label: ctx.t("Post") },
            { key: "created", label: ctx.t("Posted") },
          ],
          rows: written.map((p) => ({
            href: recordHref("posts", p.id),
            cells: { body: text(p.body.slice(0, 120)), created: date(p.createdAt) },
          })),
          more: { href: `/admin/posts?author=${encodeURIComponent(user.username)}`, total: postsTotal },
        },
        {
          title: ctx.t("Signed in on"),
          columns: [
            { key: "device", label: ctx.t("Device") },
            { key: "since", label: ctx.t("Since") },
            { key: "expires", label: ctx.t("Until") },
          ],
          rows: devices.map((s) => ({
            href: null,
            cells: { device: text(s.userAgent ?? ""), since: date(s.createdAt), expires: date(s.expiresAt) },
          })),
        },
      ],
    };
  },

  async update(id, values, ctx): Promise<WriteResult> {
    const tx = ctx.tx!;
    const [user] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user || user.status === "deleted") return { ok: false, error: "Something went wrong. Please try again." };
    const next = { name: values.name as string, username: values.username as string, bio: (values.bio as string) || null };
    if (next.username !== user.username && (await isTaken(next.username))) {
      return { ok: false, error: "Something went wrong. Please try again.", fields: { username: "This username is taken" } };
    }
    await tx.update(users).set(next).where(eq(users.id, id));
    return {
      ok: true,
      label: user.name,
      changes: diff({ name: user.name, username: user.username, bio: user.bio }, next),
    };
  },

  async act(id, action, input, ctx): Promise<WriteResult> {
    if (id === ctx.adminId) return { ok: false, error: "You can't do that." };
    const tx = ctx.tx!;
    const [user] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user || user.status === "deleted") return { ok: false, error: "Something went wrong. Please try again." };
    const set = async (values: Partial<typeof users.$inferInsert>) => {
      await tx.update(users).set(values).where(eq(users.id, id));
    };
    switch (action) {
      case "suspend":
        await set({ status: "suspended" });
        await tx.delete(sessions).where(eq(sessions.userId, id));
        return { ok: true, label: user.name, changes: { status: { from: user.status, to: "suspended" } } };
      case "restore":
        await set({ status: "active" });
        return { ok: true, label: user.name, changes: { status: { from: user.status, to: "active" } } };
      case "make-admin":
        await set({ role: "super_admin" });
        return { ok: true, label: user.name, changes: { role: { from: user.role, to: "super_admin" } } };
      case "remove-admin":
        await set({ role: "member" });
        return { ok: true, label: user.name, changes: { role: { from: user.role, to: "member" } } };
      case "sign-out":
        await tx.delete(sessions).where(eq(sessions.userId, id));
        return { ok: true, label: user.name };
      case "anonymize":
        // Typed confirmation, checked here too: it can't be undone.
        if (input.trim() !== `@${user.username}`) return { ok: false, error: "Something went wrong. Please try again." };
        await anonymizeUser(tx, id);
        // Their old name stays out of the action's label too.
        return { ok: true, label: "Deleted account" };
      default:
        return { ok: false, error: "You can't do that." };
    }
  },
};
