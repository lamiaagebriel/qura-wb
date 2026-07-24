"use server";

import { headers } from "next/headers";

import { eq } from "drizzle-orm";

import { APIError } from "better-auth/api";

import { db, schema } from "@/db";
import { fail, messageError, ok, type ActionResult } from "@/lib/errors";
import { getLocale } from "@/lib/i18n/actions";

import { auth } from "../auth";
import { getCurrentUser } from "../guard";

const RESEND_COOLDOWN_MS = 1000 * 60;

/**
 * Resolves a `code: "token_invalid"` message error when the link is
 * missing/expired/already used.
 *
 * Better Auth's `verifyEmail` only ever flips `emailVerified` itself —
 * `status` is ours, and gets moved out of "pending" by the
 * `databaseHooks.user.update.after` hook in `lib/auth/auth.ts`, which runs
 * as part of this same call rather than a separate step here.
 */
export async function verifyEmailAction(token: string): Promise<ActionResult> {
  const { t } = await getLocale();

  try {
    await auth.api.verifyEmail({ query: { token } });
  } catch (err) {
    if (err instanceof APIError) {
      return fail(
        messageError(
          t(
            "This link is invalid or has expired. Request a new verification email to continue.",
          ),
          "token_invalid",
        ),
      );
    }
    console.error("[verifyEmailAction]", err);
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  return ok(undefined);
}

/**
 * Resolves `code: "not_authenticated" | "rate_limited"` alongside the
 * normal translated errors.
 */
export async function resendVerificationEmailAction(): Promise<ActionResult> {
  const { t } = await getLocale();
  const user = await getCurrentUser();

  if (!user) {
    return fail(
      messageError(t("Something went wrong. Please try again."), "not_authenticated"),
    );
  }

  if (user.emailVerified) {
    return ok(undefined);
  }

  const onCooldown =
    !!user.lastVerificationEmailSentAt &&
    Date.now() - user.lastVerificationEmailSentAt.getTime() < RESEND_COOLDOWN_MS;

  if (onCooldown) {
    return fail(
      messageError(
        t("Please wait a moment before requesting another link."),
        "rate_limited",
      ),
    );
  }

  await db
    .update(schema.users)
    .set({ lastVerificationEmailSentAt: new Date() })
    .where(eq(schema.users.id, user.id));

  await auth.api.sendVerificationEmail({
    body: { email: user.email },
    headers: await headers(),
  });

  return ok(undefined);
}
