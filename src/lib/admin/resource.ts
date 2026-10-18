import "server-only";

import { asc, desc, sql, type AnyColumn, type SQL } from "drizzle-orm";

import type { Tx } from "@/lib/actions/run";
import type { Locale } from "@/lib/i18n/config";
import type { Translate } from "@/lib/i18n/types";
import { inLocale, type Localized } from "@/lib/localized";

import type {
  Cell,
  Column,
  Field,
  Filter,
  ListParams,
  ListResult,
  RecordView,
  SaveResult,
  Tone,
} from "./types";
import { PAGE_SIZE } from "./types";

/**
 * What every resource function gets: who's acting, how to say things, and
 * — in writes — the action's transaction (`runAction`), so every change is
 * recorded in history as part of it.
 */
export type Ctx = { t: Translate; locale: Locale; adminId: string; tx?: Tx };

/** The outcome of a write, for the audit log (or the error to show). */
export type WriteResult =
  | { ok: true; label: string; changes?: Record<string, { from: unknown; to: unknown }>; note?: string }
  | Extract<SaveResult, { ok: false }>;

/**
 * One database table in the dashboard: how it's listed (columns, filters,
 * search, sorting — all run in the database), its record page (editable
 * fields, locked ones and why, related rows, actions) and what may be
 * written. Missing functions mean "not allowed" (no page, no edit…).
 */
export type Resource = {
  key: string;
  columns: (ctx: Ctx) => Column[];
  filters?: (ctx: Ctx) => Promise<Filter[]> | Filter[];
  /** The search box's hint; absent = no search. */
  search?: (ctx: Ctx) => string;
  /** The default order (a column key, `-` first for descending). */
  defaultSort: string;
  list: (params: ListParams, ctx: Ctx) => Promise<ListResult>;
  view?: (id: string, ctx: Ctx) => Promise<RecordView | null>;
  /** A blank record page (adding one). */
  blank?: (ctx: Ctx, params: Record<string, string>) => Promise<RecordView>;
  /** Values already passed the resource's zod schema (`ADMIN_SCHEMAS`). */
  update?: (id: string, values: Record<string, unknown>, ctx: Ctx) => Promise<WriteResult>;
  create?: (values: Record<string, unknown>, ctx: Ctx) => Promise<WriteResult & { id?: string }>;
  act?: (id: string, action: string, input: string, ctx: Ctx) => Promise<WriteResult>;
  /** `act` records its own history (e.g. answering a ticket): not wrapped in another action. */
  actsOnItsOwn?: boolean;
  remove?: (id: string, ctx: Ctx) => Promise<WriteResult>;
};

// ── Query helpers ──────────────────────────────────────────────────────

/** `%` and `_` typed by the admin match themselves, not anything. */
export const likePattern = (query: string) =>
  `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

/** A localized jsonb column's text in every language, for searching. */
export const allLanguages = (column: AnyColumn) =>
  sql`concat_ws(' ', ${column}->>'en', ${column}->>'ar')`;

/** `?sort=` → ORDER BY, from the resource's sortable columns. */
export function orderBy(
  sort: string,
  sortable: Record<string, AnyColumn | SQL>,
  fallback: string,
): SQL[] {
  const pick = (value: string) => {
    const key = value.replace(/^-/, "");
    const column = sortable[key];
    return column ? (value.startsWith("-") ? desc(column) : asc(column)) : null;
  };
  return [pick(sort) ?? pick(fallback)!];
}

export const pageOf = (params: ListParams) => ({
  limit: PAGE_SIZE,
  offset: (Math.max(1, params.page) - 1) * PAGE_SIZE,
});

/** On every listed row: the total before paging (one query instead of two). */
export const totalCount = sql<number>`(count(*) over ())::int`;

export const totalOf = (rows: { total: number }[]) => rows[0]?.total ?? 0;

/** A filter's value, if it's one of `allowed`. */
export function filterValue<T extends string>(
  params: ListParams,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = params.filters[key];
  return allowed.includes(value as T) ? (value as T) : undefined;
}

// ── Cell helpers ───────────────────────────────────────────────────────

export const text = (value: string | null | undefined, sub?: string): Cell =>
  value ? { kind: "text", value, sub, dir: "auto" } : { kind: "empty" };

export const link = (value: string | null | undefined, href: string, sub?: string): Cell =>
  value ? { kind: "link", value, href, sub } : { kind: "empty" };

export const badge = (value: string, tone: Tone): Cell => ({ kind: "badge", value, tone });

export const date = (value: Date | null | undefined): Cell => ({
  kind: "date",
  value: value ? value.toISOString() : null,
});

export const number = (value: number): Cell => ({ kind: "number", value });

export const bool = (value: boolean): Cell => ({ kind: "bool", value });

export const localized = (value: Localized | null | undefined, locale: Locale) =>
  value ? inLocale(value, locale) : "";

/** Each field that changed: before and after (for the audit log). */
export function diff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null)) {
      out[key] = { from: before[key] ?? null, to: after[key] ?? null };
    }
  }
  return out;
}

/** A form with no editable fields. */
export const NO_FIELDS: Field[] = [];
