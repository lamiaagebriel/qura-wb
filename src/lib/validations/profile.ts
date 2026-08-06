import * as z from "zod";

import type { Dict } from "@/lib/i18n/config";

type Translate = (key: keyof Dict) => string;

const USERNAME_RE = /^[a-z0-9_.]+$/;

export function createEditProfileSchema(t: Translate) {
  return z.object({
    name: z.string().min(1, t("Please enter your full name.")),
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
export type EditProfileValues = z.infer<
  ReturnType<typeof createEditProfileSchema>
>;

export function createReportProblemSchema(t: Translate) {
  return z.object({
    message: z
      .string()
      .min(10, t("Please describe the problem in a bit more detail."))
      .max(2000, t("Must be at most 2000 characters.")),
  });
}
export type ReportProblemValues = z.infer<
  ReturnType<typeof createReportProblemSchema>
>;
