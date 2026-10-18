import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { OPEN_STATUSES, TICKET_STATUSES } from "@/lib/tickets/statuses";

import { id, timestamps } from "../helpers";
import { users } from "./auth";

/** What a ticket is about: any record of any table. */
export type TicketRef = { table: string; id: string };

const list = (values: readonly string[]) => sql.raw(values.map((v) => `'${v}'`).join(", "));

/**
 * Every request and every report, of every kind, in one table. `type`
 * (`lib/tickets/types.ts`, the registry) says what it is: who may send it,
 * who answers, what it can be about, its `data` fields, its statuses and
 * what each answer does — a new kind is a registry entry, not a migration.
 * - `refs`: the records it's about (one or several, any table); checked by
 *   the registry when sent; a trigger cancels open tickets whose record is
 *   deleted.
 * - `openKey`: set by the registry while it's waiting (who + what it's
 *   about), unique — no duplicate open tickets; cleared once answered.
 * - Answers (who, when, why, what approving created) are in `history`.
 */
export const tickets = pgTable(
  "tickets",
  {
    ...id,
    ...timestamps,
    type: varchar({ length: 40 }).notNull(),
    status: varchar({ length: 20 }).notNull().default("open"),
    createdById: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    refs: jsonb().$type<TicketRef[]>().notNull().default([]),
    data: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    openKey: varchar({ length: 400 }),
  },
  (t) => [
    check("tickets_status_check", sql`${t.status} in (${list(TICKET_STATUSES)})`),
    uniqueIndex("tickets_open_key_idx")
      .on(t.openKey)
      .where(sql`${t.status} in (${list(OPEN_STATUSES)})`),
    // The queues: a type's waiting tickets, oldest first.
    index("tickets_type_status_created_idx").on(t.type, t.status, t.createdAt),
    index("tickets_created_by_id_idx").on(t.createdById),
    // "Which tickets are about this post?"
    index("tickets_refs_idx").using("gin", t.refs),
  ],
);

export type Ticket = typeof tickets.$inferSelect;
