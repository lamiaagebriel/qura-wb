// The dashboard's generic tables and record pages, described as plain data
// so a server-side resource (`lib/admin/resources/`) can describe any
// database table and one set of client components renders them all.
// Client-safe.

import type { MessageKey } from "@/lib/i18n/types";

/** Colors that carry meaning (status badges, counts). */
export type Tone = "neutral" | "green" | "amber" | "red" | "blue" | "violet";

/**
 * One cell, already resolved on the server. Never an id: a reference is
 * shown as the thing's name, linking to its record.
 */
export type Cell =
  | { kind: "text"; value: string; sub?: string; dir?: "auto" | "ltr" }
  | { kind: "link"; value: string; href: string; sub?: string }
  | { kind: "badge"; value: string; tone: Tone }
  | { kind: "badges"; values: { value: string; tone: Tone }[] }
  | { kind: "date"; value: string | null }
  | { kind: "number"; value: number }
  | { kind: "bool"; value: boolean }
  | { kind: "image"; src: string | null; alt: string; value: string; sub?: string }
  | { kind: "empty" };

export type Column = {
  key: string;
  label: string;
  /** Sortable by the server (`?sort=key` / `-key`). */
  sortable?: boolean;
  /** Off until switched on from the columns menu. */
  hidden?: boolean;
  align?: "start" | "end";
};

export type Filter = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

export type Row = {
  /** Opens the record (its edit page); `null` for rows with no page. */
  href: string | null;
  cells: Record<string, Cell>;
};

export type ListParams = {
  q: string;
  /** Column key, `-` first for descending. */
  sort: string;
  page: number;
  filters: Record<string, string>;
};

export type ListResult = { rows: Row[]; total: number };

export const PAGE_SIZE = 25;

/** One form field of a record page. */
export type Field =
  | { name: string; label: string; kind: "text"; max?: number; dir?: "ltr" }
  | { name: string; label: string; kind: "textarea"; max?: number }
  | { name: string; label: string; kind: "localized"; max?: number; multiline?: boolean }
  | { name: string; label: string; kind: "number"; step?: number }
  | { name: string; label: string; kind: "select"; options: { value: string; label: string }[] }
  | { name: string; label: string; kind: "switch"; description?: string }
  | { name: string; label: string; kind: "place" };

/** A value shown on the record page that can't be edited, and why. */
export type Locked = { label: string; value: Cell; reason: string };

/** A button on the record page that runs one of the record's actions. */
export type RecordAction = {
  key: string;
  label: string;
  tone?: "default" | "destructive";
  /**
   * Asks first (a dialog); `input` also asks for text (its label): a reason,
   * a @username… `match`: the text must be exactly this (a typed
   * confirmation, for what can't be undone; the server checks it too).
   */
  confirm?: { title: string; description: string; input?: string; match?: string };
};

/** A list of related rows under the record (a business's branches…). */
export type Related = {
  title: string;
  columns: Column[];
  rows: Row[];
  /** "See all" with the related table filtered to this record. */
  more?: { href: string; total: number };
};

export type RecordView = {
  title: string;
  subtitle?: string;
  /** Badges next to the title (status…). */
  badges?: { value: string; tone: Tone }[];
  /** A public page to open (the business page, the post…). */
  publicHref?: string;
  fields: Field[];
  /** The form's starting values (by field name). */
  values: Record<string, unknown>;
  locked: Locked[];
  actions: RecordAction[];
  related: Related[];
  /** Hard delete: what else goes with it; absent = can't be deleted. */
  deletion?: { warning: string; confirmWord: string };
};

export type SaveResult =
  | { ok: true }
  | { ok: false; error: MessageKey; fields?: Record<string, MessageKey> };
