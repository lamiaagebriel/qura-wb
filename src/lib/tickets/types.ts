// The ticket types: every kind of request and report, described once.
// Client-safe — labels, what a ticket points at, its `data` fields (zod,
// shared by the forms and the server) and its statuses. Who may send and
// answer it, and what each answer does, is server-side
// (`lib/tickets/server.ts`). A new kind = an entry here and there; no
// migration.

import { z } from "zod";

import type { MessageKey } from "@/lib/i18n/types";

import type { TicketStatus } from "./statuses";

const m = (key: MessageKey) => key;

const text = (max: number) => z.string().trim().max(max, m("Too long"));
const note = text(500).optional().transform((v) => v || undefined);

/** A name in each app language, at least one written. */
export const localizedName = (max: number) =>
  z
    .object({ en: text(max), ar: text(max) })
    .refine((v) => !!(v.en || v.ar), { message: m("Required"), path: ["en"] })
    .transform((v) => ({ ...(v.en ? { en: v.en } : {}), ...(v.ar ? { ar: v.ar } : {}) }));

/** Why something is reported (stored; never rename one). */
export const REPORT_REASONS = {
  post: ["not_for_qura", "spam", "offensive", "wrong_place", "other"],
  review: ["fake", "offensive", "not_about_it", "other"],
  business: ["fake", "wrong_info", "offensive", "other"],
  user: ["fake_account", "harassment", "spam", "other"],
} as const;

export const REASON_LABELS: Record<string, MessageKey> = {
  not_for_qura: "Doesn't belong on Qura",
  spam: "Spam or scam",
  offensive: "Offensive",
  wrong_place: "Wrong place",
  fake: "Fake or scam",
  wrong_info: "Wrong information",
  not_about_it: "Not about this business",
  fake_account: "Fake account",
  harassment: "Harassment",
  other: "Something else",
};

const reportData = <T extends readonly [string, ...string[]]>(reasons: T) =>
  z.object({ reason: z.enum(reasons), note });

export type TicketTypeInfo = {
  label: MessageKey;
  /** A report ("something's wrong") or a request ("please do this"). */
  kind: "request" | "report";
  /** The tables its refs point at, in order (the first is "what it's about"). */
  refs: readonly string[];
  /** Its `data` fields. */
  data: z.ZodType;
  /** The statuses it moves through (the database allows all of `TICKET_STATUSES`). */
  statuses: readonly TicketStatus[];
};

const REQUEST: readonly TicketStatus[] = ["open", "approved", "rejected", "cancelled"];
const REPORT: readonly TicketStatus[] = ["open", "approved", "dismissed", "cancelled"];

export const TICKET_TYPES = {
  close_business: {
    label: "Asks to close",
    kind: "request",
    refs: ["businesses"],
    data: z.object({ note }),
    statuses: REQUEST,
  },
  reopen_business: {
    label: "Asks to reopen",
    kind: "request",
    refs: ["businesses"],
    data: z.object({ note }),
    statuses: REQUEST,
  },
  new_place: {
    label: "New place",
    kind: "request",
    refs: ["places"],
    data: z
      .object({
        name: localizedName(60),
        /** A listed kind of place, or empty with `customType` ("Other"). */
        typeId: z.uuid().optional(),
        customType: text(50).optional().transform((v) => v || undefined),
        reason: note,
      })
      .refine((v) => !!v.typeId || !!v.customType, { message: m("Required"), path: ["customType"] }),
    statuses: REQUEST,
  },
  add_admin: {
    label: "Add an admin",
    kind: "request",
    refs: ["places", "users"],
    data: z.object({ note }),
    statuses: REQUEST,
  },
  remove_admin: {
    label: "Remove an admin",
    kind: "request",
    refs: ["places", "users"],
    data: z.object({ note }),
    statuses: REQUEST,
  },
  report_post: {
    label: "Reported post",
    kind: "report",
    refs: ["posts"],
    data: reportData(REPORT_REASONS.post),
    statuses: REPORT,
  },
  report_review: {
    label: "Reported review",
    kind: "report",
    refs: ["business_reviews"],
    data: reportData(REPORT_REASONS.review),
    statuses: REPORT,
  },
  report_business: {
    label: "Reported business",
    kind: "report",
    refs: ["businesses"],
    data: reportData(REPORT_REASONS.business),
    // A place admin can send it on to the super admin.
    statuses: ["open", "escalated", "approved", "dismissed", "cancelled"],
  },
  report_user: {
    label: "Reported person",
    kind: "report",
    refs: ["users"],
    data: reportData(REPORT_REASONS.user),
    statuses: REPORT,
  },
} as const satisfies Record<string, TicketTypeInfo>;

export type TicketType = keyof typeof TICKET_TYPES;
export const TICKET_TYPE_KEYS = Object.keys(TICKET_TYPES) as TicketType[];

export const isTicketType = (value: unknown): value is TicketType =>
  typeof value === "string" && Object.hasOwn(TICKET_TYPES, value);

/** The data a type's form sends (before zod). */
export type TicketData<T extends TicketType> = z.input<(typeof TICKET_TYPES)[T]["data"]>;

/** What reports about each table are called (the report button picks one). */
export const REPORT_TYPE_FOR = {
  posts: "report_post",
  business_reviews: "report_review",
  businesses: "report_business",
  users: "report_user",
} as const;
