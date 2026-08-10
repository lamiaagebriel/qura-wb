import * as z from "zod";

import type { Dict } from "@/lib/i18n/config";

type Translate = (key: keyof Dict) => string;

// Same shape as `createEditProfileSchema` (username rules especially have
// to match exactly — business and user profiles share one flat username
// namespace) but kept as its own schema rather than reused directly: a
// business's `name` uses a different empty-string message, and the two
// are validated by genuinely different actions with different ownership
// rules, so tying their types together would just make a future
// divergence (e.g. a longer bio limit for businesses) awkward to add.
const USERNAME_RE = /^[a-z0-9_.]+$/;

export function createBusinessSchema(t: Translate) {
  return z.object({
    name: z.string().min(1, t("Please enter a business name.")),
    username: z
      .string()
      .min(3, t("Username must be at least 3 characters."))
      .max(30, t("Username must be at most 30 characters."))
      .regex(
        USERNAME_RE,
        t(
          "Username can only contain lowercase letters, numbers, underscores, and periods.",
        ),
      ),
    bio: z
      .string()
      .max(150, t("Bio must be at most 150 characters."))
      .optional(),
  });
}
export type BusinessValues = z.infer<ReturnType<typeof createBusinessSchema>>;
