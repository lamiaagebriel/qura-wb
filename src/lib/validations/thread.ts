import * as z from "zod";

import { THREAD_CATEGORIES } from "@/db/schema";
import type { Dict } from "@/lib/i18n/config";

type Translate = (key: keyof Dict) => string;

const URL_RE = /^https?:\/\/.+/i;
// Shared with `ImageUploadField`, which is what actually enforces this
// in the UI (disabling "Add photos" once full) — this is the schema's
// own backstop, not the primary UX.
export const MAX_IMAGES = 4;

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
    // Only meaningful for a new top-level thread — a reply's category is
    // never shown or chosen, so the composer never renders this field in
    // reply mode and `createThreadAction` just defaults it to `"general"`
    // for replies rather than trusting a client-supplied value.
    category: z.enum(THREAD_CATEGORIES).default("general"),
    parentId: z.string().uuid().optional(),
    // Set only when creating a brand-new top-level thread "as" one of
    // the signer's own business profiles — a business can post but never
    // reply, so this and `parentId` are never both meaningfully set at
    // once (`createThreadAction` rejects that combination explicitly
    // rather than silently picking one).
    asBusinessId: z.string().uuid().optional(),
  });
}
export type ThreadValues = z.infer<ReturnType<typeof createThreadSchema>>;
