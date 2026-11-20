// Asking for a new place: the rules, checked by the form and again by the
// `requestPlace` action. Client-safe.

import { z } from "zod";

import { OTHER_TYPE, PLACE_NAME_MAX, REASON_MAX } from "@/lib/place-requests";

import { m, optional } from "./utils";

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
