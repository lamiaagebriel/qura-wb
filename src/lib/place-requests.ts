// Asking for a new place: its limits and choices (the form's schema is
// `lib/validations/place-request-form.ts`). Client-safe.

import type { MessageKey } from "@/lib/i18n/types";

export const PLACE_NAME_MAX = 60;
export const REASON_MAX = 500;
/** The "Other" choice of the type picker (with `customType`). */
export const OTHER_TYPE = "other";

/** What the app itself answers (turning down a duplicate); translated when shown. */
export const ALREADY_ADDED: MessageKey = "Already added";
