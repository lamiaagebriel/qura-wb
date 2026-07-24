"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";

import { APIError } from "better-auth/api";

import { db, schema } from "@/db";
import {
  fail,
  issueError,
  messageError,
  zodIssuesError,
  type ActionResult,
} from "@/lib/errors";
import { getLocale } from "@/lib/i18n/actions";
import { createLoginSchema, type LoginValues } from "@/lib/validations/auth";

import { auth } from "../auth";
import { getPostAuthRedirect } from "../guard";
import { getOAuthProviderDisplayName } from "../oauth/registry";
import { normalizeEmail } from "../utils";

export async function signInAction(values: LoginValues): Promise<ActionResult> {
  const { t } = await getLocale();
  const parsed = createLoginSchema(t).safeParse(values);

  if (!parsed.success) {
    return fail(zodIssuesError(parsed.error));
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
    with: { accounts: true },
  });

  if (!user) {
    return fail(issueError(["email"], t("Invalid email.")));
  }

  const hasCredential = user.accounts.some((a) => a.providerId === "credential");
  if (!hasCredential) {
    // Same email, but this account was created (or has only ever signed
    // in) through a provider — point them at it instead of a dead end.
    const providerName = user.accounts[0]
      ? getOAuthProviderDisplayName(user.accounts[0].providerId)
      : t("a connected provider");
    return fail(
      issueError(
        ["password"],
        t(
          "This account uses {{provider}} sign-in. Continue with {{provider}} instead.",
        ).replaceAll("{{provider}}", providerName),
      ),
    );
  }

  let result: Awaited<ReturnType<typeof auth.api.signInEmail>>;
  try {
    result = await auth.api.signInEmail({
      body: { email, password: parsed.data.password },
      headers: await headers(),
    });
  } catch (err) {
    if (err instanceof APIError && err.status === "FORBIDDEN") {
      // Thrown by the `session.create` hook in `lib/auth/auth.ts` — this
      // account is suspended.
      return fail(
        messageError(
          t("Your account has been suspended. Contact support for help."),
        ),
      );
    }
    if (err instanceof APIError) {
      return fail(issueError(["password"], t("Invalid password.")));
    }
    console.error("[signInAction]", err);
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  redirect(getPostAuthRedirect({ emailVerified: result.user.emailVerified }));
}
