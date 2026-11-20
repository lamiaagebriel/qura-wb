// Writing a review: checked by the "Write a review" sheet and again by the
// `postReview` action. Client-safe.

import { z } from "zod";

import { REVIEW_MAX_LENGTH } from "@/lib/reviews";

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().max(REVIEW_MAX_LENGTH),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export type ReviewFormValues = ReviewInput;
