"use server";

import { db, schema } from "@/db";
import { getGuardedUser } from "@/lib/auth/guard";
import {
  fail,
  messageError,
  ok,
  zodIssuesError,
  type ActionResult,
} from "@/lib/errors";
import { getLocale } from "@/lib/i18n/actions";
import {
  createReportProblemSchema,
  type ReportProblemValues,
} from "@/lib/validations/profile";

export async function reportProblemAction(
  values: ReportProblemValues,
): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));

  const parsed = createReportProblemSchema(t).safeParse(values);
  if (!parsed.success) return fail(zodIssuesError(parsed.error));

  await db.insert(schema.reports).values({
    userId: user.id,
    message: parsed.data.message.trim(),
  });

  return ok(undefined);
}
