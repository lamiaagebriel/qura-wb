// TEMPORARY: stand-in reviews for business profiles. Replace with a
// `reviews` table (profile, author, rating 1–5, text) once the UI is
// signed off.

type Reviewer = { name: string; username: string; avatarUrl: string | null };

/** Small deterministic PRNG, so the same fake data renders every time. */
function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

type Rating = 1 | 2 | 3 | 4 | 5;

export type FakeReview = {
  id: string;
  author: Reviewer;
  rating: Rating;
  text: string;
  createdAt: Date;
};

export type ReviewSummary = {
  count: number;
  /** 0 when there are no reviews. */
  average: number;
  /** How many reviews gave 5, 4, 3, 2 and 1 stars (in that order). */
  byStars: [number, number, number, number, number];
};

const REVIEWERS: Reviewer[] = [
  { name: "Omar Said", username: "omar.said", avatarUrl: null },
  { name: "Mariam Adel", username: "mariam.a", avatarUrl: null },
  { name: "Youssef Nubi", username: "youssef.nubi", avatarUrl: null },
  { name: "Sara Mahmoud", username: "sara.m", avatarUrl: null },
  { name: "Karim Fathy", username: "karimf", avatarUrl: null },
  { name: "Hana Ali", username: "hana.ali", avatarUrl: null },
  { name: "Ahmed Gamal", username: "a.gamal", avatarUrl: null },
  { name: "Laila Hassan", username: "laila.h", avatarUrl: null },
  { name: "Mostafa Idris", username: "mostafa.idris", avatarUrl: null },
  { name: "Nadia Kamel", username: "nadia.k", avatarUrl: null },
];

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

/** A business's reviews, newest first. */
export function fakeReviews(username: string): FakeReview[] {
  // One business with none, to see the empty state.
  if (username === "souq.spices") return [];
  const next = random(seedOf(username));
  const count = 3 + Math.floor(next() * 38);
  const now = Date.now();
  let age = 0;
  return Array.from({ length: count }, (_, i) => {
    let roll = next();
    const rating = RATING_ODDS.find(([, odds]) => (roll -= odds) < 0)?.[0] ?? 5;
    const texts = TEXTS[rating];
    age += Math.ceil(next() * 9) * DAY; // each review a few days older
    return {
      id: `${username}-review-${i + 1}`,
      author: REVIEWERS[Math.floor(next() * REVIEWERS.length)],
      rating,
      text: texts[Math.floor(next() * texts.length)],
      createdAt: new Date(now - age),
    };
  });
}

export function summarize(reviews: FakeReview[]): ReviewSummary {
  const byStars: ReviewSummary["byStars"] = [0, 0, 0, 0, 0];
  let total = 0;
  for (const { rating } of reviews) {
    byStars[5 - rating]++;
    total += rating;
  }
  return {
    count: reviews.length,
    average: reviews.length ? total / reviews.length : 0,
    byStars,
  };
}
