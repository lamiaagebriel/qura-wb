"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import {
  fail,
  issueError,
  messageError,
  zodIssuesError,
  type ActionResult,
} from "@/lib/errors";
import { getLocale } from "@/lib/i18n/actions";
import { createSignupSchema, type SignupValues } from "@/lib/validations/auth";

import { auth } from "../auth";
import { getPostAuthRedirect } from "../guard";
import { getOAuthProviderDisplayName } from "../oauth/registry";
import { normalizeEmail } from "../utils";

export async function signUpAction(
  values: SignupValues,
): Promise<ActionResult> {
  const { t } = await getLocale();
  const parsed = createSignupSchema(t).safeParse(values);

  if (!parsed.success) {
    return fail(zodIssuesError(parsed.error));
  }

  const email = normalizeEmail(parsed.data.email);

  // Checked proactively (rather than caught off a unique-violation after
  // the fact) so we can tell "this email already has a password" apart
  // from "this email is only ever linked to a provider" — Better Auth's
  // own signUpEmail error doesn't distinguish the two.
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
    with: { accounts: true },
  });

  if (existing) {
    const hasCredential = existing.accounts.some(
      (a) => a.providerId === "credential",
    );
    if (!hasCredential && existing.accounts[0]) {
      const providerName = getOAuthProviderDisplayName(
        existing.accounts[0].providerId,
      );
      const message = t(
        'This email is linked to your {{provider}} account. Sign in with {{provider}}, or use "Forgot password" to set one.',
      ).replaceAll("{{provider}}", providerName);
      return fail(issueError(["email"], message));
    }

    return fail(
      issueError(
        ["email"],
        t("An account with this email already exists. Try signing in instead."),
      ),
    );
  }

  let result: Awaited<ReturnType<typeof auth.api.signUpEmail>>;
  try {
    result = await auth.api.signUpEmail({
      body: { email, password: parsed.data.password, name: parsed.data.name },
      headers: await headers(),
    });
  } catch (err) {
    console.error("[signUpAction]", err);
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  // Always `/verify-email` in practice (a brand-new account is never
  // verified yet) — routed through the shared helper anyway so every entry
  // point agrees on the same destination logic.
  redirect(getPostAuthRedirect({ emailVerified: result.user.emailVerified }));
}
