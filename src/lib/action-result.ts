import type { z } from "zod";

import type { MessageKey } from "@/lib/i18n/types";

/**
 * What every server action returns. User errors are values, never throws.
 * `field` puts the error under that form field instead of in a toast.
 * Client-safe.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: MessageKey; field?: string };

export const done = () => ({ ok: true, data: undefined }) as const;
export const ok = <T>(data: T) => ({ ok: true, data }) as const;
export const fail = (error: MessageKey, field?: string) =>
  ({ ok: false, error, field }) as const;

export const AGAIN = fail("Something went wrong. Please try again.");
export const NOT_ALLOWED = fail("You can't do that.");

/** A schema's first problem, under its field (messages are message keys). */
export function invalid(error: z.ZodError) {
  const [issue] = error.issues;
  if (!issue) return AGAIN;
  return fail(issue.message as MessageKey, issue.path.join(".") || undefined);
}
