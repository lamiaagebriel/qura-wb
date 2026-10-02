// Sample reviews for local development and e2e tests — loaded by
// `pnpm db:seed` (src/db/seed.ts), never in production. Deterministic, so
// every run gives each business the same reviews.

import type { ReviewInput } from "@/lib/reviews";

/** Small deterministic PRNG, so the same data comes out every time. */
function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

type Rating = 1 | 2 | 3 | 4 | 5;

/** Sample users who write the reviews (emails on the reserved test domain). */
export const SEED_REVIEWERS = [
  { name: "Omar Said", username: "omar.said" },
  { name: "Mariam Adel", username: "mariam.a" },
  { name: "Youssef Nubi", username: "youssef.nubi" },
  { name: "Sara Mahmoud", username: "sara.m" },
  { name: "Karim Fathy", username: "karimf" },
  { name: "Hana Ali", username: "hana.ali" },
  { name: "Ahmed Gamal", username: "a.gamal" },
  { name: "Laila Hassan", username: "laila.h" },
  { name: "Mostafa Idris", username: "mostafa.idris" },
  { name: "Nadia Kamel", username: "nadia.k" },
].map((reviewer) => ({ ...reviewer, email: `${reviewer.username}@qura.test` }));

const TEXTS: Record<Rating, string[]> = {
  5: [
    "Amazing place, friendly staff and great prices. Will definitely come back!",
    "Best in Aswan, hands down. Everything was perfect.",
    "Loved it! Clean, fast and the owner really cares about the details.",
    "ممتاز جدًا، خدمة رائعة وأسعار مناسبة. أنصح به بشدة 👌",
    "Super accueil et très bon rapport qualité-prix. Je recommande !",
  ],
  4: [
    "Really good overall, just a bit crowded in the evening.",
    "Great service. Parking nearby is hard to find though.",
    "Very nice experience, slightly pricier than I expected.",
    "مكان جميل وخدمة جيدة، لكن الانتظار كان طويلًا قليلًا.",
  ],
  3: [
    "It was okay. Nothing special but nothing bad either.",
    "Decent, but the service was slow on a Friday.",
    "Average experience. Good location, so-so quality.",
  ],
  2: [
    "Took too long and the staff seemed uninterested.",
    "Not what the photos promised. Needs improvement.",
  ],
  1: [
    "Very disappointing. They closed earlier than the listed hours.",
    "Rude staff, won't come back.",
  ],
};

// Mostly good reviews, like real local businesses.
const RATING_ODDS: [Rating, number][] = [
  [5, 0.5],
  [4, 0.28],
  [3, 0.12],
  [2, 0.06],
  [1, 0.04],
];

const DAY = 24 * 60 * 60 * 1000;

/** Same text → same number, so each business keeps its own reviews. */
const seedOf = (text: string) =>
  [...text].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);

/**
 * A business's sample reviews: each by a different reviewer (one review
 * per user per business), each a few days older than the last.
 */
export function seedReviews(
  username: string,
): (ReviewInput & { reviewer: string; createdAt: Date })[] {
  // One business with none, to see the empty state.
  if (username === "souq.spices") return [];
  const next = random(seedOf(username));
  const reviewers = [...SEED_REVIEWERS].sort(() => next() - 0.5);
  const count = 3 + Math.floor(next() * (reviewers.length - 2));
  const now = Date.now();
  let age = 0;
  return reviewers.slice(0, count).map((reviewer) => {
    let roll = next();
    const rating = RATING_ODDS.find(([, odds]) => (roll -= odds) < 0)?.[0] ?? 5;
    const texts = TEXTS[rating];
    age += Math.ceil(next() * 9) * DAY;
    return {
      reviewer: reviewer.email,
      rating,
      text: texts[Math.floor(next() * texts.length)],
      createdAt: new Date(now - age),
    };
  });
}
