/**
 * Sample data for local development and e2e tests: `pnpm db:seed`.
 * Re-runnable: users are added by email if missing, and a business that already
 * exists (by @handle) is left as it is, reviews included; sample posts are
 * written once. Refuses to run
 * in production.
 */
import { eq, inArray } from "drizzle-orm";

import { env } from "../lib/env";

import { db } from "./index";
import {
  businesses,
  businessHours,
  businessLinks,
  businessLocations,
  posts,
  reviews,
  users,
} from "./schema";
import { SEED_BUSINESSES, SEED_OWNED, SEED_OWNER } from "./seed/businesses";
import { seedBusinessPosts, seedUserPosts, type SeedPost } from "./seed/posts";
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
          // Sample businesses are already approved.
          status: "active",
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
        locations.map(({ description, coords, city }, position) => ({
          businessId: row.id,
          position,
          address: description,
          city,
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

  // Posts: the reviewers' for each type they have none of yet (so new types
  // get samples too), the owned businesses' when missing (the e2e setup
  // deletes those with the businesses).
  const reviewerIds = SEED_REVIEWERS.map((r) => idOf.get(r.email)!);
  const owned = await db
    .select({ id: businesses.id, username: businesses.username })
    .from(businesses)
    .where(inArray(businesses.username, Object.keys(SEED_OWNED)));
  const businessIdOf = new Map(owned.map((b) => [b.username, b.id]));
  const [seededTypes, businessPosts] = await Promise.all([
    db
      .selectDistinct({ type: posts.type })
      .from(posts)
      .where(inArray(posts.createdById, reviewerIds)),
    db.$count(posts, inArray(posts.businessId, [...businessIdOf.values()])),
  ]);
  const hasType = new Set(seededTypes.map((row) => row.type));
  const sample: SeedPost[] = [
    ...seedUserPosts(SEED_REVIEWERS.map((r) => r.email)).filter(
      (post) => !hasType.has(post.type),
    ),
    ...(businessPosts ? [] : seedBusinessPosts()),
  ];
  if (sample.length) {
    const inserted = await db
      .insert(posts)
      .values(
        sample.map(({ by, ...post }) => ({
          ...post,
          createdById: "reviewer" in by ? idOf.get(by.reviewer)! : ownerId,
          businessId: "business" in by ? businessIdOf.get(by.business)! : null,
          updatedAt: post.createdAt,
        })),
      )
      .returning({
        id: posts.id,
        type: posts.type,
        city: posts.city,
        createdAt: posts.createdAt,
      });
    // A couple of replies on the newest questions in Aswan.
    const questions = inserted
      .filter((p) => p.type === "question" && p.city === "aswan")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 3);
    const answers = [
      "Try the one next to the pharmacy, they're great.",
      "جربت عندهم قبل كده، ممتازين.",
    ];
    if (questions.length)
      await db.insert(posts).values(
        questions.flatMap((q, i) =>
          answers.map((body, j) => {
            const createdAt = new Date(
              q.createdAt.getTime() + (j + 1) * 60_000,
            );
            return {
              parentId: q.id,
              type: q.type,
              city: q.city,
              body,
              createdById: reviewerIds[(i + j + 3) % reviewerIds.length],
              createdAt,
              updatedAt: createdAt,
            };
          }),
        ),
      );
  }

  const count = await db.$count(businesses);
  const postCount = await db.$count(posts, eq(posts.city, "aswan"));
  console.log(
    `Seeded ${added} new business(es); ${count} in total. ${sample.length} new post(s); ${postCount} in Aswan. Owner: ${SEED_OWNER.email}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
