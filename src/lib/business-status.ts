// A business's lifecycle and who may move it. Client-safe: the screens use
// it to show the right buttons, the server actions to enforce them.
//
//   pending ──approve──▶ active ◀──▶ suspended      (admins)
//                          ▲  │
//                   reopen │  ▼ close              (admins, whoever runs it)
//                         closed
//
// Whoever runs it — its owner, or its adder while it has no owner — closes
// and reopens it directly. A visitor can only *ask* (report it closed), a
// request the super admin approves or rejects.
//
// Whoever added a business looks after it only until it has an owner:
// once claimed, it's the owner's alone (the adder is a visitor to it).

import type { MessageKey } from "@/lib/i18n/types";

export const BUSINESS_STATUSES = [
  "pending",
  "active",
  "suspended",
  "closed",
  // Deleted by its owner (or an admin): gone from the app, kept for 30
  // days before a purge (a scheduled job, later).
  "deleted",
] as const;
export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

/** Each status as shown (a message key). */
export const STATUS_LABELS: Record<BusinessStatus, MessageKey> = {
  pending: "Pending review",
  active: "Live",
  suspended: "Suspended",
  closed: "Closed",
  deleted: "Deleted",
};

/** What a request asks for: close it (or report it closed), or reopen it. */
export const REQUEST_KINDS = ["close", "reopen"] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];

/** Who is looking at / acting on a business. */
export type BusinessRole = "admin" | "owner" | "creator" | "visitor";

export function roleFor(
  business: { ownerId: string | null; createdById: string | null },
  user: { id: string; role?: string | null } | null | undefined,
): BusinessRole | null {
  if (!user) return null;
  if (user.role === "super_admin") return "admin";
  if (business.ownerId === user.id) return "owner";
  // Its adder, while nobody owns it yet.
  if (business.ownerId === null && business.createdById === user.id) return "creator";
  return "visitor";
}

/** Who may run it (edit it, post as it): its owner, or its adder while it has no owner. */
export const canManage = (role: BusinessRole | null) => role === "owner" || role === "creator";

/** Shown in lists, search and counts; anyone can open it. */
export const isListed = (status: BusinessStatus) => status === "active";

/** Its page opens for everyone (closed ones say so). */
export const isPublic = (status: BusinessStatus) =>
  status === "active" || status === "closed";

/** Statuses `role` may set directly from `from`. */
export function allowedStatuses(
  role: BusinessRole | null,
  from: BusinessStatus,
): BusinessStatus[] {
  if (role === "admin")
    return BUSINESS_STATUSES.filter((status) => status !== from);
  // Whoever runs it (owner, or adder while unowned) closes, reopens and
  // deletes it (soft: "deleted", purged later).
  if (canManage(role)) {
    if (from === "active") return ["closed", "deleted"];
    if (from === "closed") return ["active", "deleted"];
  }
  return [];
}

/** What `role` may ask an admin for (when it can't do it itself). */
export function allowedRequest(
  role: BusinessRole | null,
  from: BusinessStatus,
): RequestKind | null {
  // Whoever runs it does it directly (`allowedStatuses`).
  if (role === "visitor" && from === "active") return "close";
  return null;
}

/**
 * Who may delete a business for good: admins, its owner, and its creator
 * while nobody owns it yet (once claimed, it's the owner's to delete).
 */
export const canDelete = (role: BusinessRole | null, hasOwner: boolean) =>
  role === "admin" || role === "owner" || (role === "creator" && !hasOwner);

/** The status a request leads to once approved. */
export const requestTarget = (kind: RequestKind): BusinessStatus =>
  kind === "close" ? "closed" : "active";
