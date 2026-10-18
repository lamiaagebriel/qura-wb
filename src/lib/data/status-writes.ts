import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

import { businesses, history, tickets } from "@/db/schema";
import type { Tx } from "@/lib/actions/run";
import type { BusinessStatus } from "@/lib/business-status";
import { BUSINESSES_TAG } from "@/lib/data/businesses";
import { OPEN_STATUSES } from "@/lib/tickets/statuses";

// Business status writes, inside an action's transaction (`runAction`), so
// they're recorded with it. Callers check permissions first
// (`lib/business-status.ts`) and call `refreshStatus` after it commits.

/** Pages that show a business's status, or lists filtered by it. */
export function refreshStatus(username: string) {
  // Lists, search and category counts only show active ones.
  updateTag(BUSINESSES_TAG);
  revalidatePath(`/bs/${username}`, "layout");
  revalidatePath("/c/[slug]", "page");
  revalidatePath("/profile", "layout");
  revalidatePath("/admin", "layout");
}

/** The ticket types a status fulfils (closing answers "please close it"…). */
const FULFILS: Partial<Record<BusinessStatus, string>> = {
  closed: "close_business",
  active: "reopen_business",
};

/**
 * Thrown (undoing the action) when a business would go live without what
 * its page needs: a branch (address, map) and a WhatsApp link (the order
 * button). The app's form asks for both; old data or the dashboard may not.
 */
export const NOT_READY = "It needs a branch and a WhatsApp number first.";
export class NotReadyToGoLive extends Error {
  constructor() {
    super(NOT_READY);
  }
}

/** Whether a business has a branch and a WhatsApp link. */
export async function readyToGoLive(tx: Tx, id: string) {
  const [row] = await tx
    .select({
      whatsapp: sql<boolean>`exists (select 1 from jsonb_array_elements("businesses"."links") l where l->>'platform' = 'whatsapp' and coalesce(l->>'url', '') <> '')`,
      branch: sql<boolean>`exists (select 1 from business_locations bl where bl.business_id = "businesses"."id")`,
    })
    .from(businesses)
    .where(eq(businesses.id, id));
  return !!row?.whatsapp && !!row.branch;
}

/**
 * Sets a business's status and approves the open tickets it fulfils (each
 * gets its own "approved" entry in history, by `actorId`). Going live needs
 * `readyToGoLive` (else `NotReadyToGoLive`).
 */
export async function applyStatus(
  tx: Tx,
  business: { id: string },
  status: BusinessStatus,
  actorId: string,
) {
  if (status === "active" && !(await readyToGoLive(tx, business.id))) {
    throw new NotReadyToGoLive();
  }
  await tx.update(businesses).set({ status }).where(eq(businesses.id, business.id));
  const type = FULFILS[status];
  if (!type) return;
  const done = await tx
    .update(tickets)
    .set({ status: "approved" })
    .where(
      and(
        eq(tickets.type, type),
        inArray(tickets.status, [...OPEN_STATUSES]),
        sql`${tickets.refs} @> ${JSON.stringify([{ table: "businesses", id: business.id }])}::jsonb`,
      ),
    )
    .returning({ id: tickets.id });
  if (done.length)
    await tx.insert(history).values(
      done.map((ticket) => ({
        entry: "action",
        actorId,
        source: "app",
        action: "ticket.approve",
        input: { ticketId: ticket.id },
      })),
    );
}
