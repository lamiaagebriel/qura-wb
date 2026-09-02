import { relations } from "drizzle-orm";

import { googlePlaceClaimConflicts } from "./google-place-claims";
import { users } from "./users";

// `relationName` on all four — same reason as `business-reviews.relations`:
// multiple FKs to `users` on one table need to be disambiguated, otherwise
// Drizzle's relational query builder can't tell which `with: {...}` key
// resolves to which column.
export const googlePlaceClaimConflictsRelations = relations(
  googlePlaceClaimConflicts,
  ({ one }) => ({
    attemptingBusiness: one(users, {
      fields: [googlePlaceClaimConflicts.attemptingBusinessId],
      references: [users.id],
      relationName: "claimConflictAttemptingBusiness",
    }),
    attemptingOwner: one(users, {
      fields: [googlePlaceClaimConflicts.attemptingOwnerId],
      references: [users.id],
      relationName: "claimConflictAttemptingOwner",
    }),
    existingBusiness: one(users, {
      fields: [googlePlaceClaimConflicts.existingBusinessId],
      references: [users.id],
      relationName: "claimConflictExistingBusiness",
    }),
    existingOwner: one(users, {
      fields: [googlePlaceClaimConflicts.existingOwnerId],
      references: [users.id],
      relationName: "claimConflictExistingOwner",
    }),
  }),
);
