import "server-only";

import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { businessRequests, businesses, users } from "@/db/schema";
import type { BusinessStatus, RequestKind } from "@/lib/business-status";
import type { Localized } from "@/lib/localized";

export type OpenRequest = {
  id: string;
  kind: RequestKind;
  note: string;
  createdAt: Date;
  author: { name: string; email: string };
  business: { name: Localized; username: string; status: BusinessStatus };
  /** Asked by its creator (vs reported by a visitor). */
  byCreator: boolean;
};

/** The admin queue: requests nobody has answered yet, oldest first. */
export async function openRequests(): Promise<OpenRequest[]> {
  const rows = await db
    .select({
      id: businessRequests.id,
      kind: businessRequests.kind,
      note: businessRequests.note,
      createdAt: businessRequests.createdAt,
      authorId: businessRequests.authorId,
      author: { name: users.name, email: users.email },
      business: {
        name: businesses.name,
        username: businesses.username,
        status: businesses.status,
      },
      createdById: businesses.createdById,
    })
    .from(businessRequests)
    .innerJoin(users, eq(users.id, businessRequests.authorId))
    .innerJoin(businesses, eq(businesses.id, businessRequests.businessId))
    .where(isNull(businessRequests.resolvedAt))
    .orderBy(asc(businessRequests.createdAt));
  return rows.map(({ authorId, createdById, ...row }) => ({
    ...row,
    byCreator: authorId === createdById,
  }));
}

/** How many things wait for an admin: pending businesses + open requests. */
export async function adminQueueCount(): Promise<number> {
  // One round trip: the profile renders it on every visit by an admin.
  const [row] = await db
    .select({
      count: sql<number>`(
        (select count(*) from business_requests where resolved_at is null)
        + (select count(*) from businesses where status = 'pending')
      )::int`,
    })
    .from(sql`(select 1) as one`);
  return row.count;
}

/** What this user has already asked about this business (still open). */
export async function myOpenRequest(
  businessId: string,
  userId: string,
): Promise<RequestKind | null> {
  const [row] = await db
    .select({ kind: businessRequests.kind })
    .from(businessRequests)
    .where(
      and(
        eq(businessRequests.businessId, businessId),
        eq(businessRequests.authorId, userId),
        isNull(businessRequests.resolvedAt),
      ),
    )
    .limit(1);
  return row?.kind ?? null;
}
