import "server-only";

import { and, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { alias } from "drizzle-orm/pg-core";
import { accounts, history, HISTORY_ENTRIES, HISTORY_SOURCES, rateLimits, sessions, users, verifications } from "@/db/schema";

import { recordHref, tableHref } from "../links";
import {
  badge,
  date,
  filterValue,
  likePattern,
  link,
  number,
  orderBy,
  pageOf,
  text,
  totalCount,
  totalOf,
  type Resource,
} from "../resource";
import type { Cell } from "../types";
import { RECORD_PAGES } from "./tickets";

const actors = alias(users, "actors");

const show = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? "—"
    : typeof value === "object"
      ? ((value as { en?: string; ar?: string }).en ?? (value as { ar?: string }).ar ?? JSON.stringify(value))
      : String(value);

/** "name: Old → New · bio: — → Hi" — a change entry's changes, short. */
export const describeChanges = (changes: Record<string, [unknown, unknown]> | null) =>
  Object.entries(changes ?? {})
    .map(([field, [from, to]]) => (from === null ? `${field}: ${show(to)}` : `${field}: ${show(from)} → ${show(to)}`))
    .join(" · ");

/**
 * Everything that happened, newest first: every action (who did what, and
 * why) and every row change (which record, before → after). `?actionId=`
 * shows one action's changes; `?table=&record=` one record's history.
 */
export const historyResource: Resource = {
  key: "history",
  defaultSort: "-when",
  search: (ctx) => ctx.t("Search by action or table"),
  columns: (ctx) => [
    { key: "when", label: ctx.t("When"), sortable: true },
    { key: "who", label: ctx.t("Who") },
    { key: "what", label: ctx.t("What") },
    { key: "record", label: ctx.t("Record") },
    { key: "changes", label: ctx.t("Changes") },
    { key: "source", label: ctx.t("From"), hidden: true },
  ],
  filters: (ctx) => [
    {
      key: "entry",
      label: ctx.t("Kind"),
      options: [
        { value: "action", label: ctx.t("Actions") },
        { value: "change", label: ctx.t("Changes") },
      ],
    },
    {
      key: "source",
      label: ctx.t("From"),
      options: [
        { value: "app", label: ctx.t("The app") },
        { value: "dashboard", label: ctx.t("Dashboard") },
        { value: "sql", label: ctx.t("Outside the app") },
        { value: "seed", label: ctx.t("Sample data") },
        { value: "system", label: ctx.t("The system") },
      ],
    },
  ],
  async list(params, ctx) {
    const pattern = params.q ? likePattern(params.q) : null;
    const entry = filterValue(params, "entry", HISTORY_ENTRIES);
    const source = filterValue(params, "source", HISTORY_SOURCES);
    const actionId = Number(params.filters.actionId) || null;
    const rows = await db
      .select({ entry: history, actor: { id: actors.id, name: actors.name }, total: totalCount })
      .from(history)
      .leftJoin(actors, eq(actors.id, history.actorId))
      .where(
        and(
          entry ? eq(history.entry, entry) : undefined,
          source ? eq(history.source, source) : undefined,
          actionId ? or(eq(history.id, actionId), eq(history.actionId, actionId)) : undefined,
          params.filters.table ? eq(history.tableName, params.filters.table) : undefined,
          params.filters.record ? eq(history.recordId, params.filters.record) : undefined,
          params.filters.actor ? eq(history.actorId, params.filters.actor) : undefined,
          pattern ? or(ilike(history.action, pattern), ilike(history.tableName, pattern), ilike(history.note, pattern)) : undefined,
        ),
      )
      .orderBy(...orderBy(params.sort, { when: history.id }, "-when"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    return {
      total: totalOf(rows),
      rows: rows.map(({ entry: h, actor }) => {
        const page = h.tableName ? RECORD_PAGES[h.tableName] : undefined;
        const recordCell: Cell =
          h.entry === "change" && h.tableName
            ? page && h.op !== "delete" && h.recordId
              ? link(`${h.tableName}`, recordHref(page, h.recordId), h.op ?? undefined)
              : text(h.tableName, h.op ?? undefined)
            : { kind: "empty" };
        return {
          href: h.entry === "action" ? tableHref("history", { actionId: String(h.id) }) : null,
          cells: {
            when: date(h.at),
            who: actor?.id ? link(actor.name, recordHref("users", actor.id)) : badge(h.source === "sql" ? ctx.t("Outside the app") : ctx.t("The system"), "neutral"),
            what:
              h.entry === "action"
                ? badge(h.action ?? "", h.action?.endsWith("delete") ? "red" : h.action?.startsWith("ticket.") ? "violet" : "blue")
                : badge(`${h.op}`, h.op === "delete" ? "red" : h.op === "insert" ? "green" : "neutral"),
            record: recordCell,
            changes: text(h.entry === "action" ? (h.note ?? "") : describeChanges(h.changes) || (h.row ? ctx.t("Whole row kept") : "")),
            source: text(h.source),
          },
        };
      }),
    };
  },
};

/** Signed-in devices (read-only; tokens are never shown). */
export const sessionsResource: Resource = {
  key: "sessions",
  defaultSort: "-since",
  search: (ctx) => ctx.t("Search by person"),
  columns: (ctx) => [
    { key: "person", label: ctx.t("Person") },
    { key: "device", label: ctx.t("Device") },
    { key: "ip", label: ctx.t("IP address"), hidden: true },
    { key: "since", label: ctx.t("Since"), sortable: true },
    { key: "until", label: ctx.t("Until"), sortable: true },
  ],
  async list(params) {
    const pattern = params.q ? likePattern(params.q) : null;
    const rows = await db
      .select({ userAgent: sessions.userAgent, ip: sessions.ipAddress, createdAt: sessions.createdAt, expiresAt: sessions.expiresAt, user: { id: users.id, name: users.name }, total: totalCount })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(pattern ? or(ilike(users.name, pattern), ilike(users.email, pattern)) : undefined)
      .orderBy(...orderBy(params.sort, { since: sessions.createdAt, until: sessions.expiresAt }, "-since"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    return {
      total: totalOf(rows),
      rows: rows.map((row) => ({
        href: null,
        cells: {
          person: link(row.user.name, recordHref("users", row.user.id)),
          device: text(row.userAgent ?? ""),
          ip: { kind: "text", value: row.ip ?? "", dir: "ltr" },
          since: date(row.createdAt),
          until: date(row.expiresAt),
        },
      })),
    };
  },
};

/** How people sign in (Google). Read-only; tokens are never shown. */
export const accountsResource: Resource = {
  key: "accounts",
  defaultSort: "-since",
  search: (ctx) => ctx.t("Search by person"),
  columns: (ctx) => [
    { key: "person", label: ctx.t("Person") },
    { key: "provider", label: ctx.t("Signs in with") },
    { key: "since", label: ctx.t("Since"), sortable: true },
  ],
  async list(params) {
    const pattern = params.q ? likePattern(params.q) : null;
    const rows = await db
      .select({ providerId: accounts.providerId, createdAt: accounts.createdAt, user: { id: users.id, name: users.name }, total: totalCount })
      .from(accounts)
      .innerJoin(users, eq(users.id, accounts.userId))
      .where(pattern ? or(ilike(users.name, pattern), ilike(users.email, pattern)) : undefined)
      .orderBy(...orderBy(params.sort, { since: accounts.createdAt }, "-since"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    return {
      total: totalOf(rows),
      rows: rows.map((row) => ({
        href: null,
        cells: {
          person: link(row.user.name, recordHref("users", row.user.id)),
          provider: badge(row.providerId, "blue"),
          since: date(row.createdAt),
        },
      })),
    };
  },
};

/** Short-lived sign-in state. Read-only. */
export const verificationsResource: Resource = {
  key: "verifications",
  defaultSort: "-since",
  columns: (ctx) => [
    { key: "kind", label: ctx.t("What") },
    { key: "since", label: ctx.t("Since"), sortable: true },
    { key: "until", label: ctx.t("Until"), sortable: true },
  ],
  async list(params) {
    const rows = await db
      .select({ identifier: verifications.identifier, createdAt: verifications.createdAt, expiresAt: verifications.expiresAt, total: totalCount })
      .from(verifications)
      .orderBy(...orderBy(params.sort, { since: verifications.createdAt, until: verifications.expiresAt }, "-since"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    return {
      total: totalOf(rows),
      // The identifier's prefix says what it is; the rest is a secret.
      rows: rows.map((row) => ({
        href: null,
        cells: { kind: text(row.identifier.split(/[:-]/)[0]), since: date(row.createdAt), until: date(row.expiresAt) },
      })),
    };
  },
};

/** Request counters that block abuse. Read-only. */
export const rateLimitsResource: Resource = {
  key: "rate-limits",
  defaultSort: "-last",
  search: (ctx) => ctx.t("Search by key"),
  columns: (ctx) => [
    { key: "key", label: ctx.t("Key") },
    { key: "count", label: ctx.t("Count"), sortable: true, align: "end" },
    { key: "last", label: ctx.t("Last request"), sortable: true },
  ],
  async list(params) {
    const pattern = params.q ? likePattern(params.q) : null;
    const rows = await db
      .select({ key: rateLimits.key, count: rateLimits.count, lastRequest: rateLimits.lastRequest, total: totalCount })
      .from(rateLimits)
      .where(pattern ? ilike(rateLimits.key, pattern) : undefined)
      .orderBy(...orderBy(params.sort, { count: rateLimits.count, last: rateLimits.lastRequest }, "-last"))
      .limit(pageOf(params).limit)
      .offset(pageOf(params).offset);
    return {
      total: totalOf(rows),
      rows: rows.map((row) => ({
        href: null,
        cells: { key: { kind: "text", value: row.key, dir: "ltr" }, count: number(row.count), last: date(new Date(row.lastRequest)) },
      })),
    };
  },
};
