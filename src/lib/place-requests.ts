// Asking for a new place, and answering: the rules shared by the forms
// and the server actions. Client-safe.

import { z } from "zod";

import type { MessageKey } from "@/lib/i18n/types";

const m = (key: MessageKey) => key;

export const PLACE_NAME_MAX = 60;
export const REASON_MAX = 500;
/** The "Other" choice of the type picker (with `customType`). */
export const OTHER_TYPE = "other";

const optional = (max: number) => z.string().trim().max(max, m("Too long"));

export const placeRequestSchema = z
  .object({
    /** The place it goes under (a slug; checked by the action). */
    parent: z.string().min(1, m("Choose a city")).max(80),
    // English or Arabic: at least one.
    name: z
      .object({ en: optional(PLACE_NAME_MAX), ar: optional(PLACE_NAME_MAX) })
      .refine((v) => !!(v.en || v.ar), { message: m("Required"), path: ["en"] }),
    /** A listed type's id, or `OTHER_TYPE`. */
    type: z.string().min(1, m("Required")).max(40),
    customType: optional(50),
    reason: optional(REASON_MAX),
  })
  .refine((v) => v.type !== OTHER_TYPE || v.customType.length > 0, {
    path: ["customType"],
    message: m("Required"),
  });

export type PlaceRequestValues = z.input<typeof placeRequestSchema>;
export type PlaceRequestInput = z.output<typeof placeRequestSchema>;

/** What the app itself answers (turning down a duplicate); translated when shown. */
export const ALREADY_ADDED: MessageKey = "Already added";
