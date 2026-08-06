import * as z from "zod";

import type { Dict } from "@/lib/i18n/config";

type Translate = (key: keyof Dict) => string;

const URL_RE = /^https?:\/\/.+/i;

export function createThreadSchema(t: Translate) {
  return z.object({
    body: z
      .string()
      .min(1, t("Say something…"))
      .max(500, t("Must be at most 500 characters.")),
    imageUrl: z
      .string()
      .regex(URL_RE, t("Enter a valid image URL."))
      .optional()
      .or(z.literal("")),
    parentId: z.string().uuid().optional(),
  });
}
export type ThreadValues = z.infer<ReturnType<typeof createThreadSchema>>;
