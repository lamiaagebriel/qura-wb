"use server";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { getLocale } from "@/lib/i18n/actions";
import {
  createForgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/auth";

import { fail, ok, zodIssuesError, type ActionResult } from "@/lib/errors";

import { auth } from "../auth";
import { normalizeEmail } from "../utils";

const RESEND_COOLDOWN_MS = 1000 * 60;

/**
 * Always resolves the same way whether or not the email is registered —
 * the UI shows the same "check your email" state either way so this can't
 * be used to probe which addresses have an account. Better Auth's own
 * `requestPasswordReset` already behaves this way (no error for an unknown
 * email); the cooldown lookup below only ever informs whether we call it,
 * never the response.
 */
export async function requestPasswordResetAction(
  values: ForgotPasswordValues,
): Promise<ActionResult> {
  const { t } = await getLocale();
  const parsed = createForgotPasswordSchema(t).safeParse(values);

  if (!parsed.success) {
    return fail(zodIssuesError(parsed.error));
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  const onCooldown =
    !!user?.lastPasswordResetEmailSentAt &&
    Date.now() - user.lastPasswordResetEmailSentAt.getTime() < RESEND_COOLDOWN_MS;

  if (user && !onCooldown) {
    await db
      .update(schema.users)
      .set({ lastPasswordResetEmailSentAt: new Date() })
      .where(eq(schema.users.id, user.id));

    await auth.api.requestPasswordReset({ body: { email } });
  }

  return ok(undefined);
}
