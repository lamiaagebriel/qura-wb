import { relations } from "drizzle-orm";

import { businessReviews } from "./business-reviews";
import { users } from "./users";

export const businessReviewsRelations = relations(businessReviews, ({ one }) => ({
  // `relationName` disambiguates the two FKs this table has to `users`
  // (`businessId`, `authorId`) — without it Drizzle can't tell which
  // relation a bare `with: { business: true }` should resolve to.
  business: one(users, {
    fields: [businessReviews.businessId],
    references: [users.id],
    relationName: "reviewBusiness",
  }),
  author: one(users, {
    fields: [businessReviews.authorId],
    references: [users.id],
    relationName: "reviewAuthor",
  }),
}));
