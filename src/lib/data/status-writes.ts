import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

import { db } from "@/db";
import { businessRequests, businesses } from "@/db/schema";
import type { BusinessStatus, RequestKind } from "@/lib/business-status";
import { BUSINESSES_TAG } from "@/lib/data/businesses";

// Status writes shared by the business form's save and the admin actions.
// Callers check permissions first (`lib/business-status.ts`).

/** Pages that show a business's status, or lists filtered by it. */
export function refreshStatus(username: string) {
  // Lists, search and category counts only show active ones.
  updateTag(BUSINESSES_TAG);
  revalidatePath(`/bs/${username}`, "layout");
  revalidatePath("/c/[slug]", "page");
  revalidatePath("/profile", "layout");
}

/** Sets the status and approves the open requests it fulfils. */
export async function applyStatus(
  business: { id: string; username: string },
  status: BusinessStatus,
  byId: string,
) {
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(businesses)
      .set({ status, statusChangedAt: now })
      .where(eq(businesses.id, business.id));
    const kind =
      status === "closed" ? "close" : status === "active" ? "reopen" : null;
    if (kind)
      await tx
        .update(businessRequests)
        .set({ resolvedAt: now, resolvedById: byId, outcome: "approved" })
        .where(
          and(
            eq(businessRequests.businessId, business.id),
            eq(businessRequests.kind, kind),
            isNull(businessRequests.resolvedAt),
          ),
        );
  });
  refreshStatus(business.username);
}

/** Files a close / reopen request (one open per person, business, kind). */
export async function fileRequest(
  business: { id: string; username: string },
  authorId: string,
  kind: RequestKind,
  note = "",
) {
  await db
    .insert(businessRequests)
    .values({ businessId: business.id, authorId, kind, note })
    // Already asked: nothing to add.
    .onConflictDoNothing();
  revalidatePath(`/bs/${business.username}`);
  revalidatePath("/profile", "layout");
}
