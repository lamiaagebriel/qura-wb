/**
 * Sample data for local development and e2e tests: `pnpm db:seed`.
 * Re-runnable: users are added by email if missing, and a business that already
 * exists (by @handle) is left as it is, reviews included. Refuses to run
 * in production.
 */
import { inArray } from "drizzle-orm";

import { env } from "../lib/env";

import { db } from "./index";
import {
  businesses,
  businessHours,
  businessLinks,
  businessLocations,
  reviews,
  users,
} from "./schema";
import { SEED_BUSINESSES, SEED_OWNED, SEED_OWNER } from "./seed/businesses";
import { SEED_REVIEWERS, seedReviews } from "./seed/reviews";

async function main() {
  if (env.NODE_ENV === "production") {
    throw new Error("db:seed never runs in production.");
  }

  // Users: the owner of the sample businesses + the reviewers.
  await db
    .insert(users)
    .values(
      [SEED_OWNER, ...SEED_REVIEWERS].map((user) => ({
        ...user,
        emailVerified: true,
      })),
    )
    .onConflictDoNothing({ target: users.email });
  const userRows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(
      inArray(
        users.email,
        [SEED_OWNER, ...SEED_REVIEWERS].map((user) => user.email),
      ),
    );
  const idOf = new Map(userRows.map((user) => [user.email, user.id]));
  const ownerId = idOf.get(SEED_OWNER.email)!;
  // Whoever "added" the businesses the owner didn't add themselves.
  const someoneElse = idOf.get(SEED_REVIEWERS[0].email)!;

  let added = 0;
  for (const business of SEED_BUSINESSES) {
    const { socials, locations, hours, avatarUrl, ...fields } = business;
    const owned = SEED_OWNED[business.username];
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(businesses)
        .values({
          ...fields,
          image: avatarUrl,
          ...(owned && {
            ownerId,
            createdById: owned.addedByOwner ? ownerId : someoneElse,
          }),
        })
        .onConflictDoNothing({ target: businesses.username })
        .returning({ id: businesses.id });
      if (!row) return; // Already seeded.
      added++;

      await tx.insert(businessLocations).values(
        locations.map(({ description, coords }, position) => ({
          businessId: row.id,
          position,
          address: description,
          ...coords,
        })),
      );
      await tx.insert(businessLinks).values(
        socials.map(({ platform, url }, position) => ({
          businessId: row.id,
          position,
          platform,
          url,
        })),
      );
      const open = hours.flatMap((slot, day) =>
        slot
          ? [{ businessId: row.id, day, opens: slot.open, closes: slot.close }]
          : [],
      );
      if (open.length) await tx.insert(businessHours).values(open);

      const sample = seedReviews(business.username);
      if (sample.length)
        await tx.insert(reviews).values(
          sample.map(({ reviewer, ...review }) => ({
            ...review,
            businessId: row.id,
            authorId: idOf.get(reviewer)!,
            updatedAt: review.createdAt,
          })),
        );
    });
  }

  const count = await db.$count(businesses);
  console.log(
    `Seeded ${added} new business(es); ${count} in total. Owner: ${SEED_OWNER.email}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
