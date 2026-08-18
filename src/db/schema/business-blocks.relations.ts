import { relations } from "drizzle-orm";

import { businessBlocks } from "./business-blocks";
import { users } from "./users";

export const businessBlocksRelations = relations(businessBlocks, ({ one }) => ({
  business: one(users, {
    fields: [businessBlocks.businessId],
    references: [users.id],
  }),
}));
