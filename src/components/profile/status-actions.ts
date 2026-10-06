"use server";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { isValidId } from "@/db/helpers";
import { businessRequests, businesses } from "@/db/schema";
import { getFreshSession } from "@/lib/auth/session";
import {
  allowedRequest,
  allowedStatuses,
  BUSINESS_STATUSES,
  REQUEST_KINDS,
  requestTarget,
  roleFor,
} from "@/lib/business-status";
import { findBusiness } from "@/lib/data/businesses";
import { applyStatus, fileRequest, refreshStatus } from "@/lib/data/status-writes";
import type { MessageKey } from "@/lib/i18n/types";
import { rateLimit } from "@/lib/rate-limit";

export type StatusResult = { ok: true } | { ok: false; error: MessageKey };

const AGAIN: MessageKey = "Something went wrong. Please try again.";
const NOT_ALLOWED: MessageKey = "You can't do that.";

const handle = z.string().min(1).max(50);
const note = z.string().trim().max(500);

/** The fresh, active signed-in user (actions are public endpoints). */
async function currentUser() {
  const session = await getFreshSession();
  if (!session || session.user.status === "suspended") return null;
  return session.user;
}

/**
 * Changes a business's status directly — only what `allowedStatuses` lets
 * this user do (admins anything; the owner close / reopen).
 */
export async function setBusinessStatus(
  username: unknown,
  status: unknown,
): Promise<StatusResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const parsedHandle = handle.safeParse(username);
  const parsedStatus = z.enum(BUSINESS_STATUSES).safeParse(status);
  if (!parsedHandle.success || !parsedStatus.success)
    return { ok: false, error: AGAIN };

  const business = await findBusiness(parsedHandle.data);
  if (!business) return { ok: false, error: "This business no longer exists." };
  const role = roleFor(business, user);
  if (!allowedStatuses(role, business.status).includes(parsedStatus.data))
    return { ok: false, error: NOT_ALLOWED };

  await applyStatus(business, parsedStatus.data, user.id);
  return { ok: true };
}

/**
 * Asks an admin to close / reopen a business (its creator), or reports it
 * closed (a visitor). Once per person until an admin answers.
 */
export async function requestStatusChange(
  username: unknown,
  kind: unknown,
  message: unknown = "",
): Promise<StatusResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const parsedHandle = handle.safeParse(username);
  const parsedKind = z.enum(REQUEST_KINDS).safeParse(kind);
  const parsedNote = note.safeParse(message);
  if (!parsedHandle.success || !parsedKind.success || !parsedNote.success)
    return { ok: false, error: AGAIN };
  if (!(await rateLimit(`status-request:${user.id}`, 20, 60 * 60)))
    return { ok: false, error: "Too many attempts. Please wait a moment." };

  const business = await findBusiness(parsedHandle.data);
  if (!business) return { ok: false, error: "This business no longer exists." };
  if (allowedRequest(roleFor(business, user), business.status) !== parsedKind.data)
    return { ok: false, error: NOT_ALLOWED };

  await fileRequest(business, user.id, parsedKind.data, parsedNote.data);
  return { ok: true };
}

/** An admin approves (applies it) or rejects an open request. */
export async function resolveRequest(
  requestId: unknown,
  approve: unknown,
): Promise<StatusResult> {
  const user = await currentUser();
  if (user?.role !== "super_admin") return { ok: false, error: NOT_ALLOWED };
  if (typeof requestId !== "string" || !isValidId(requestId) || typeof approve !== "boolean")
    return { ok: false, error: AGAIN };

  const [request] = await db
    .select({
      kind: businessRequests.kind,
      business: businesses,
    })
    .from(businessRequests)
    .innerJoin(businesses, eq(businesses.id, businessRequests.businessId))
    .where(
      and(eq(businessRequests.id, requestId), isNull(businessRequests.resolvedAt)),
    )
    .limit(1);
  if (!request) return { ok: false, error: "This request was already handled." };

  if (approve) {
    // Also resolves every other open request asking for the same.
    await applyStatus(request.business, requestTarget(request.kind), user.id);
  }
  await db
    .update(businessRequests)
    .set({
      resolvedAt: new Date(),
      resolvedById: user.id,
      outcome: approve ? "approved" : "rejected",
    })
    .where(
      and(eq(businessRequests.id, requestId), isNull(businessRequests.resolvedAt)),
    );
  refreshStatus(request.business.username);
  return { ok: true };
}
