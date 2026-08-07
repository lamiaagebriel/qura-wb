import * as z from "zod";

import type { Dict } from "@/lib/i18n/config";

type Translate = (key: keyof Dict) => string;

const URL_RE = /^https?:\/\/.+/i;
const MAX_IMAGES = 4;

export function createThreadSchema(t: Translate) {
  return z.object({
    body: z
      .string()
      .min(1, t("Say something…"))
      .max(500, t("Must be at most 500 characters.")),
    // Blank rows are allowed through — they're just an in-progress "add
    // another image" field the user hasn't filled in yet — and dropped
    // here rather than in every caller, so the array a submitted thread
    // actually stores never has empty slots in it.
    images: z
      .array(z.string())
      .max(MAX_IMAGES, t("Up to 4 images."))
      .default([])
      .transform((urls) => urls.filter((url) => url.trim().length > 0))
      .refine((urls) => urls.every((url) => URL_RE.test(url)), {
        message: t("Enter a valid image URL."),
      }),
    parentId: z.string().uuid().optional(),
  });
}
export type ThreadValues = z.infer<ReturnType<typeof createThreadSchema>>;
