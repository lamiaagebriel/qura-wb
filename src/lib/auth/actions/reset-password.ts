"use server";

import { APIError } from "better-auth/api";

import { getLocale } from "@/lib/i18n/actions";
import {
  createResetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validations/auth";

import { fail, messageError, ok, zodIssuesError, type ActionResult } from "@/lib/errors";

import { auth } from "../auth";

/**
 * Resolves a `code: "token_invalid"` message error when the token is
 * missing/expired/already used, so the form can switch to the same "this
 * link has expired" view it shows for a missing `?token=`.
 *
 * Better Auth invalidates every other session for this user as part of
 * `resetPassword` itself, so there's no separate "force re-authentication
 * everywhere" step to do here.
 */
export async function resetPasswordAction(
  token: string,
  values: ResetPasswordValues,
): Promise<ActionResult> {
  const { t } = await getLocale();
  const parsed = createResetPasswordSchema(t).safeParse(values);

  if (!parsed.success) {
    return fail(zodIssuesError(parsed.error));
  }

  try {
    await auth.api.resetPassword({
      body: { token, newPassword: parsed.data.password },
    });
  } catch (err) {
    if (err instanceof APIError) {
      return fail(messageError(t("This link has expired"), "token_invalid"));
    }
    console.error("[resetPasswordAction]", err);
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  return ok(undefined);
}
