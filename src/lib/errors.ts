import type { ZodError } from "zod";

/**
 * Every error a server action returns is one of exactly two shapes:
 *
 * - `message` — a plain, already-translated string meant to be shown as-is
 *   (a toast). Nothing in it targets a specific field.
 * - `issues`  — one or more Zod-issue-shaped `{ path, message }` entries.
 *   `path` is a field path (e.g. `["email"]`) the same way `ZodError.issues`
 *   uses it — real Zod validation failures map straight onto this via
 *   `zodIssuesError`, and hand-written business-logic errors (like "this
 *   email is already taken") use the exact same shape via `issueError` so
 *   the client never needs to know which kind produced a given issue.
 *
 * `code` is an optional, untranslated discriminant for the rare cases where
 * the *caller* needs to branch on the failure (e.g. "this token is expired,
 * swap the whole view" rather than "show this text somewhere") — see
 * reset-password / verify-email actions.
 */
export type IssueLike = { path: (string | number)[]; message: string };

export type AppError =
  | { kind: "message"; message: string; code?: string }
  | { kind: "issues"; issues: IssueLike[]; code?: string };

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: AppError };

export function ok<T = undefined>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function fail<T = undefined>(error: AppError): ActionResult<T> {
  return { success: false, error };
}

export function messageError(message: string, code?: string): AppError {
  return { kind: "message", message, code };
}

export function issuesError(issues: IssueLike[], code?: string): AppError {
  return { kind: "issues", issues, code };
}

export function issueError(
  path: (string | number)[],
  message: string,
  code?: string,
): AppError {
  return issuesError([{ path, message }], code);
}

/** Converts a real Zod validation failure into an `AppError`. */
export function zodIssuesError(error: ZodError): AppError {
  return issuesError(
    error.issues.map((issue) => ({
      // Zod types `path` as `PropertyKey[]` (so it can include `symbol`),
      // but our own paths — and every real Zod object/string key — are
      // always `string | number`. Stringify the (never actually occurring)
      // symbol case rather than widening `IssueLike` for it.
      path: issue.path.map((segment) =>
        typeof segment === "symbol" ? segment.toString() : segment,
      ),
      message: issue.message,
    })),
  );
}
