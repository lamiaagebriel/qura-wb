import * as z from "zod";

import type { Dict } from "@/lib/i18n/config";

type Translate = (key: keyof Dict) => string;

export function createReviewSchema(t: Translate) {
  return z.object({
    rating: z
      .number()
      .int()
      .min(1, t("Please select a rating."))
      .max(5, t("Please select a rating.")),
    body: z
      .string()
      .max(500, t("Must be at most 500 characters."))
      .optional()
      .or(z.literal("")),
  });
}
export type ReviewValues = z.infer<ReturnType<typeof createReviewSchema>>;
