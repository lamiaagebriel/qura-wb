"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isValidId } from "@/db/helpers";
import { runAction } from "@/lib/actions/run";
import { resourceOf } from "@/lib/admin/registry";
import type { Ctx, WriteResult } from "@/lib/admin/resource";
import { ADMIN_SCHEMAS, isEditable } from "@/lib/admin/schemas";
import type { SaveResult } from "@/lib/admin/types";
import { getFreshSession } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/types";

const NOT_ALLOWED = { ok: false, error: "You can't do that." } as const;
const AGAIN = { ok: false, error: "Something went wrong. Please try again." } as const;

/** The acting super admin (fresh session) as a resource context, or null. */
async function adminCtx(): Promise<Ctx | null> {
  const session = await getFreshSession();
  if (!session || session.user.status !== "active" || session.user.role !== "super_admin") {
    return null;
  }
  const { t, locale } = await getTranslations();
  return { t, locale, adminId: session.user.id };
}

/** Thrown inside the action's transaction to undo it (the write was refused). */
class Refused extends Error {
  constructor(readonly result: Extract<WriteResult, { ok: false }>) {
    super("refused");
  }
}

/**
 * Runs a resource write as a dashboard action: one transaction, recorded
 * in history (who, what, the reason, every row it changed). A refused
 * write leaves nothing behind.
 */
async function asAction(
  ctx: Ctx,
  action: string,
  input: Record<string, unknown>,
  write: (ctx: Ctx) => Promise<WriteResult & { id?: string }>,
): Promise<(WriteResult & { id?: string }) | Extract<WriteResult, { ok: false }>> {
  try {
    const result = await runAction({ action, actorId: ctx.adminId, source: "dashboard", input }, async (tx) => {
      const outcome = await write({ ...ctx, tx });
      if (!outcome.ok) throw new Refused(outcome);
      return outcome;
    });
    revalidatePath("/admin", "layout");
    return result;
  } catch (error) {
    if (error instanceof Refused) return error.result;
    throw error;
  }
}

const recordKey = z.string().min(1).max(120);

const fieldErrors = (error: z.ZodError) => {
  const fields: Record<string, MessageKey> = {};
  for (const issue of error.issues) fields[issue.path.join(".")] ??= issue.message as MessageKey;
  return fields;
};

/**
 * Saves a record's editable fields (`id` = "new" adds one). Checked again
 * here with the resource's own zod schema — the form's rules.
 */
export async function saveRecord(resource: unknown, id: unknown, values: unknown): Promise<SaveResult & { id?: string }> {
  const ctx = await adminCtx();
  if (!ctx) return NOT_ALLOWED;
  if (typeof resource !== "string" || !isEditable(resource)) return NOT_ALLOWED;
  const target = resourceOf(resource);
  const key = recordKey.safeParse(id);
  if (!target || !key.success) return AGAIN;

  const parsed = ADMIN_SCHEMAS[resource].safeParse(values);
  if (!parsed.success) return { ...AGAIN, fields: fieldErrors(parsed.error) };
  const data = parsed.data as Record<string, unknown>;

  if (key.data === "new") {
    if (!target.create) return NOT_ALLOWED;
    const result = await asAction(ctx, `${resource}.create`, { resource }, (c) => target.create!(data, c));
    return result.ok ? { ok: true, id: result.id } : result;
  }
  if (!target.update || !isValidId(key.data)) return NOT_ALLOWED;
  const result = await asAction(ctx, `${resource}.update`, { resource, recordId: key.data }, (c) =>
    target.update!(key.data, data, c),
  );
  return result.ok ? { ok: true } : result;
}

/** Runs one of a record's actions (approve, suspend, hide…), with its text input. */
export async function runRecordAction(resource: unknown, id: unknown, action: unknown, input: unknown = ""): Promise<SaveResult> {
  const ctx = await adminCtx();
  if (!ctx) return NOT_ALLOWED;
  const target = typeof resource === "string" ? resourceOf(resource) : undefined;
  if (!target?.act) return NOT_ALLOWED;
  if (typeof id !== "string" || !isValidId(id) || typeof action !== "string" || action.length > 40) return AGAIN;
  const text = z.string().max(500).safeParse(input);
  if (!text.success) return AGAIN;

  // Some actions (answering a ticket) record their own history.
  const result = target.actsOnItsOwn
    ? await target.act(id, action, text.data, ctx)
    : await asAction(ctx, `${target.key}.${action}`, { resource: target.key, recordId: id, ...(text.data && { note: text.data }) }, (c) =>
        target.act!(id, action, text.data, c),
      );
  revalidatePath("/admin", "layout");
  return result.ok ? { ok: true } : result;
}

/** Deletes a record for good — only where its resource allows it. */
export async function deleteRecord(resource: unknown, id: unknown): Promise<SaveResult> {
  const ctx = await adminCtx();
  if (!ctx) return NOT_ALLOWED;
  const target = typeof resource === "string" ? resourceOf(resource) : undefined;
  if (!target?.remove || typeof id !== "string" || !isValidId(id)) return NOT_ALLOWED;
  // The record page decides whether it may go (e.g. a place with nothing in it).
  const view = await target.view?.(id, ctx);
  if (!view?.deletion) return NOT_ALLOWED;

  const result = await asAction(ctx, `${target.key}.delete`, { resource: target.key, recordId: id }, (c) => target.remove!(id, c));
  return result.ok ? { ok: true } : result;
}
