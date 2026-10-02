// Your personal profile: what you can change about it, and the rules for
// it. One zod schema, used by the edit form and again by the
// `updateProfile` action. Error messages are translation keys. Client-safe.

import { z } from "zod";

import { USERNAME } from "@/lib/business";
import type { MessageKey } from "@/lib/i18n/types";

const m = (key: MessageKey) => key;

/**
 * Avatars anyone can pick instead of their Google photo: hand-drawn
 * black-and-white faces (people, never storefronts), in `public/avatars/`
 * (drawn by `scripts/draw-avatars.mjs`, so they share one line style). Labels describe the
 * face for screen readers.
 */
export const AVATARS = [
  { id: "quiff", label: m("Quiff") },
  { id: "curly-bob", label: m("Curly bob") },
  { id: "bald-stubble", label: m("Bald with stubble") },
  { id: "ponytail", label: m("Ponytail") },
  { id: "spiky", label: m("Spiky hair") },
  { id: "curls", label: m("Curls") },
  { id: "cap", label: m("Cap") },
  { id: "bandana", label: m("Bandana") },
  { id: "beard", label: m("Beard") },
  { id: "bucket-hat", label: m("Bucket hat") },
  { id: "glasses", label: m("Glasses") },
  { id: "bob", label: m("Bob") },
] as const;

export const avatarUrl = (id: string) => `/avatars/${id}.svg`;

export const BIO_MAX_LENGTH = 160;

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
