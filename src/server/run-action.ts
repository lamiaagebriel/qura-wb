import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";
import { history } from "@/db/schema";

/** A transaction, as Drizzle hands it to `db.transaction`. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Where an action comes from (`history.source`). */
export type Source = "app" | "dashboard" | "seed" | "system";

export type ActionMeta = {
  /** `"post.create"`, `"ticket.approve"`… — what happened. */
  action: string;
  /** Who did it; `null` = the system (a job, the seed). */
  actorId: string | null;
  source?: Source;
  /** What was asked for (stored in history; never secrets). */
  input?: Record<string, unknown>;
  /** The reason given, if any. */
  note?: string;
};

/** Keys never stored in history, at any depth. */
const SECRET = /^(password|token|access_?token|refresh_?token|id_?token|email)$/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, v]) => (SECRET.test(key) ? [] : [[key, redact(v)]])),
    );
  }
  return value;
}

/**
 * The one way the app writes: runs `work` in a transaction that first
 * records the action in `history` (who, what, why, input) and tells the
 * database about it, so every row the work changes is recorded by the
 * history trigger as part of this action. All or nothing: if `work`
 * throws, neither the changes nor the action are kept.
 */
export async function runAction<T>(meta: ActionMeta, work: (tx: Tx, actionId: number) => Promise<T>): Promise<T> {
  const source = meta.source ?? "app";
  return db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(history)
      .values({
        entry: "action",
        actorId: meta.actorId,
        source,
        action: meta.action,
        input: (redact(meta.input ?? {}) as Record<string, unknown>) ?? {},
        note: meta.note || null,
      })
      .returning({ id: history.id });
    await tx.execute(sql`select
      set_config('qura.actor_id', ${meta.actorId ?? ""}, true),
      set_config('qura.action_id', ${String(entry.id)}, true),
      set_config('qura.source', ${source}, true)`);
    return work(tx, entry.id);
  });
}
