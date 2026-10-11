// Reviews: what the screens show (read from `lib/data/reviews.ts`) and the
// rules for writing one — the same zod schema checks the "Write a review"
// sheet and the `postReview` action. Client-safe.

import { z } from "zod";

export const REVIEW_MAX_LENGTH = 1000;

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().max(REVIEW_MAX_LENGTH),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export type Review = {
  id: string;
  /** The user who wrote it: their account name and photo. */
  author: { name: string; username: string; avatarUrl: string | null };
  rating: 1 | 2 | 3 | 4 | 5;
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
