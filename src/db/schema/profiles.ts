import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { id, timestamps } from "../helpers";
import { users } from "./users";

export const PROFILE_TYPES = ["personal", "business"] as const;
export const profileType = pgEnum("profile_type", PROFILE_TYPES);

/**
 * The public identity — what posts, gets followed and shows up in search.
 * - `personal`: exactly one per user, created at sign-up (`userId` set).
 * - `business`: a restaurant, shop… owned by an organization, not a person
 *   (`organizationId` set; organizations come later, so no FK yet).
 * Social tables (threads, follows, reviews…) reference `profiles.id`, so a
 * business acts on its own without being a fake user who can't sign in.
 * `username` shares one namespace with `users.username`.
 */
export const profiles = pgTable(
  "profiles",
  {
    ...id,
    ...timestamps,
    type: profileType().notNull(),
    userId: uuid().references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid(),
    username: varchar({ length: 50 }).notNull().unique(),
    displayName: varchar({ length: 255 }).notNull(),
    image: text(),
    bio: text(),
  },
  (t) => [
    check(
      "profiles_owner_check",
      sql`(${t.type} = 'personal' and ${t.userId} is not null)
        or (${t.type} = 'business' and ${t.organizationId} is not null)`,
    ),
    // Exactly one personal profile per user.
    uniqueIndex("profiles_personal_user_id_idx")
      .on(t.userId)
      .where(sql`${t.type} = 'personal'`),
    index("profiles_user_id_idx").on(t.userId),
    index("profiles_organization_id_idx").on(t.organizationId),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type ProfileType = (typeof PROFILE_TYPES)[number];
