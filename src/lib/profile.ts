// Your personal profile: the avatars to pick from and the bio's length (the
// edit form's schema is `lib/validations/profile-form.ts`). Client-safe.

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
