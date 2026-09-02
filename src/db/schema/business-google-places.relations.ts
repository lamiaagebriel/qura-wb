import { relations } from "drizzle-orm";

import { businessGooglePlaces } from "./business-google-places";
import { users } from "./users";

export const businessGooglePlacesRelations = relations(
  businessGooglePlaces,
  ({ one }) => ({
    business: one(users, {
      fields: [businessGooglePlaces.businessId],
      references: [users.id],
    }),
  }),
);
