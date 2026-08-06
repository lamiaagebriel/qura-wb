import { createdAt, id, pgTable, references, text } from "@/db/helpers";
import { index } from "drizzle-orm/pg-core";

import { users } from "./users";

/** "Report a problem" submissions — storage only, no admin/triage UI yet. */
export const reports = pgTable(
  "reports",
  {
    ...id,
    ...createdAt,

    userId: references({
      k: "user_id",
      ref: users.id,
      actions: { onDelete: "cascade" },
    }).notNull(),
    message: text("message").notNull(),
  },
  (t) => [index("report__user_id__idx").on(t.userId)],
);

export type Report = typeof reports.$inferSelect;
