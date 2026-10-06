import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { REQUEST_KINDS } from "@/lib/business-status";

import { id, timestamps } from "../helpers";
import { users } from "./auth";
import { businesses } from "./businesses";

export const requestKind = pgEnum("business_request_kind", REQUEST_KINDS);
export const requestOutcome = pgEnum("business_request_outcome", [
  "approved",
  "rejected",
]);

/**
 * Someone who can't change a business's status asking an admin to: its
 * creator asking to close / reopen it, or a visitor reporting it closed.
 * Open until an admin resolves it; one open request per person, business
 * and kind.
 */
export const businessRequests = pgTable(
  "business_requests",
  {
    ...id,
    ...timestamps,
    businessId: uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    authorId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: requestKind().notNull(),
    note: varchar({ length: 500 }).notNull().default(""),
    resolvedAt: timestamp({ withTimezone: true }),
    resolvedById: uuid().references(() => users.id, { onDelete: "set null" }),
    outcome: requestOutcome(),
  },
  (t) => [
    uniqueIndex("business_requests_open_idx")
      .on(t.businessId, t.authorId, t.kind)
      .where(sql`${t.resolvedAt} is null`),
    // The admin queue: open ones, oldest first.
    index("business_requests_resolved_at_idx").on(t.resolvedAt, t.createdAt),
  ],
);
