// Your profile's edit form: the rules, checked by the form and again by the
// `updateProfile` action. Client-safe.

import { z } from "zod";

import { BIO_MAX_LENGTH } from "@/lib/profile";

import { m, USERNAME } from "./utils";

export const profileSchema = z.object({
  name: z.string().trim().min(1, m("Required")).max(50, m("Too long")),
  username: z
    .string()
    .trim()
    .regex(USERNAME, m("3–30 lowercase letters, numbers, dots or underscores")),
  bio: z.string().trim().max(BIO_MAX_LENGTH, m("Too long")),
  /**
   * A preset (`/avatars/…`), your Google photo, or none (initials). The
   * action checks a URL really is one of those.
   */
  image: z.string().max(2048).nullable(),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;
