import { z } from "zod";

import type { MessageKey } from "@/lib/i18n/types";

// Rules shared by the form schemas. Each error message is a message key.
// Client-safe.

export const m = (key: MessageKey) => key;

export const REQUIRED = m("Required");
export const TOO_LONG = m("Too long");

export const optional = (max: number) => z.string().trim().max(max, TOO_LONG);

/** English or Arabic: at least one written (the other is the fallback). */
export const localized = (max: number) =>
  z
    .object({ en: optional(max), ar: optional(max) })
    .refine((text) => !!(text.en || text.ar), { message: REQUIRED, path: ["en"] });

/** Both optional (a bio can be left empty). */
export const optionalLocalized = (max: number) =>
  z.object({ en: optional(max), ar: optional(max) });

/** An @handle: people's and businesses'. */
export const USERNAME = /^[a-z0-9._]{3,30}$/;
