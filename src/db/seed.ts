/**
 * Sample data for local development and e2e tests: `pnpm db:seed`.
 * Re-runnable: users are added by email if missing, and a business that already
 * exists (by @handle) is left as it is, reviews included; sample posts are
 * written once. One recorded action (`history`, source "seed"): all of it
 * or nothing. Refuses to run in production.
 */
import { eq, inArray } from "drizzle-orm";

import { runAction, type Tx } from "../lib/actions/run";
import { env } from "../lib/env";

import { db } from "./index";
import { businesses, businessLocations, businessReviews, places, posts, users } from "./schema";
import { SEED_BUSINESSES, SEED_OWNED, SEED_OWNER } from "./seed/businesses";
import { seedBusinessPosts, seedUserPosts, type SeedPost } from "./seed/posts";
import { SEED_REVIEWERS, seedReviews } from "./seed/reviews";
import { seedWorld } from "./seed/world";

/** Place slug → id, as in the database (the seeds name places by slug). */
async function placeIds(tx: Tx) {
  const rows = await tx.select({ id: places.id, slug: places.slug }).from(places);
  const ids = new Map(rows.map((row) => [row.slug, row.id]));
  return (slug: string) => {
    const id = ids.get(slug);
    if (!id) throw new Error(`No place "${slug}": run the migrations first.`);
    return id;
  };
}

async function seed(tx: Tx) {
  const placeId = await placeIds(tx);

  // Users: the owner of the sample businesses + the reviewers.
  await tx
    .insert(users)
    .values([SEED_OWNER, ...SEED_REVIEWERS].map((user) => ({ ...user, emailVerified: true })))
    .onConflictDoNothing({ target: users.email });
  const userRows = await tx
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.email, [SEED_OWNER, ...SEED_REVIEWERS].map((user) => user.email)));
  const idOf = new Map(userRows.map((user) => [user.email, user.id]));
  const ownerId = idOf.get(SEED_OWNER.email)!;
  // Whoever "added" the businesses the owner didn't add themselves.
  const someoneElse = idOf.get(SEED_REVIEWERS[0].email)!;

  let added = 0;
  for (const [i, business] of SEED_BUSINESSES.entries()) {
    const { socials, locations, hours, avatarUrl, ...fields } = business;
    const owned = SEED_OWNED[business.username];
    const [row] = await tx
      .insert(businesses)
      .values({
        ...fields,
        image: avatarUrl,
        links: socials.map(({ platform, url }) => ({ platform, url })),
        hours,
        // Sample businesses are already approved.
        status: "active",
        // In list order, a second apart: the seed is one transaction, where
        // `now()` is the same for every row ("your first business" needs an order).
        createdAt: new Date(Date.now() - (SEED_BUSINESSES.length - i) * 1000),
        ...(owned && { ownerId, createdById: owned.addedByOwner ? ownerId : someoneElse }),
      })
      .onConflictDoNothing({ target: businesses.username })
      .returning({ id: businesses.id });
    if (!row) continue; // Already seeded.
    added++;

    await tx.insert(businessLocations).values(
      locations.map(({ description, coords, city }, position) => ({
        businessId: row.id,
        position,
        address: description,
        placeId: placeId(city),
        ...coords,
      })),
    );
    const sample = seedReviews(business.username);
    if (sample.length)
      await tx.insert(businessReviews).values(
        sample.map(({ reviewer, ...review }) => ({
          ...review,
          businessId: row.id,
          authorId: idOf.get(reviewer)!,
          updatedAt: review.createdAt,
        })),
      );
  }

  // Posts: the reviewers' for each type they have none of yet (so new types
  // get samples too), the owned businesses' when missing (the e2e setup
  // deletes those with the businesses).
  const reviewerIds = SEED_REVIEWERS.map((r) => idOf.get(r.email)!);
  const owned = await tx
    .select({ id: businesses.id, username: businesses.username })
    .from(businesses)
    .where(inArray(businesses.username, Object.keys(SEED_OWNED)));
  const businessIdOf = new Map(owned.map((b) => [b.username, b.id]));
  const [seededTypes, businessPosts] = await Promise.all([
    tx.selectDistinct({ type: posts.type }).from(posts).where(inArray(posts.createdById, reviewerIds)),
    tx.$count(posts, inArray(posts.businessId, [...businessIdOf.values()])),
  ]);
  const hasType = new Set(seededTypes.map((row) => row.type));
  const sample: SeedPost[] = [
    ...seedUserPosts(SEED_REVIEWERS.map((r) => r.email)).filter((post) => !hasType.has(post.type)),
    ...(businessPosts ? [] : seedBusinessPosts()),
  ];
  const aswan = placeId("aswan");
  if (sample.length) {
    const inserted = await tx
      .insert(posts)
      .values(
        sample.map(({ by, city, ...post }) => ({
          ...post,
          placeId: placeId(city),
          createdById: "reviewer" in by ? idOf.get(by.reviewer)! : ownerId,
          businessId: "business" in by ? businessIdOf.get(by.business)! : null,
          updatedAt: post.createdAt,
        })),
      )
      .returning({ id: posts.id, type: posts.type, placeId: posts.placeId, createdAt: posts.createdAt });
    // A couple of replies on the newest questions in Aswan.
    const questions = inserted
      .filter((p) => p.type === "question" && p.placeId === aswan)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 3);
    const answers = ["Try the one next to the pharmacy, they're great.", "جربت عندهم قبل كده، ممتازين."];
    if (questions.length)
      await tx.insert(posts).values(
        questions.flatMap((q, i) =>
          answers.map((body, j) => {
            const createdAt = new Date(q.createdAt.getTime() + (j + 1) * 60_000);
            return {
              parentId: q.id,
              type: q.type,
              placeId: q.placeId,
              body,
              createdById: reviewerIds[(i + j + 3) % reviewerIds.length],
              createdAt,
              updatedAt: createdAt,
            };
          }),
        ),
      );
  }

  // The bigger, varied world in places of its own (written once).
  const world = await seedWorld(tx);
  if (world) {
    console.log(
      `Seeded the sample world: ${world.places} places, ${world.people} people, ${world.businesses} businesses, ${world.posts} posts (+ replies, votes, reviews, tickets).`,
    );
  }

  const count = await tx.$count(businesses);
  const postCount = await tx.$count(posts, eq(posts.placeId, aswan));
  console.log(
    `Seeded ${added} new business(es); ${count} in total. ${sample.length} new post(s); ${postCount} in Aswan. Owner: ${SEED_OWNER.email}.`,
  );
}

async function main() {
  if (env.NODE_ENV === "production") {
    throw new Error("db:seed never runs in production.");
  }
  await runAction({ action: "seed", actorId: null, source: "seed" }, seed);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
