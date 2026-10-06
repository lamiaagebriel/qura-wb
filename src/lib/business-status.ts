// A business's lifecycle and who may move it. Client-safe: the screens use
// it to show the right buttons, the server actions to enforce them.
//
//   pending ──approve──▶ active ◀──▶ suspended      (admins)
//                          ▲  │
//                   reopen │  ▼ close              (admins, the owner)
//                         closed
//
// Anyone else (its creator when not the owner, any signed-in visitor) can
// only *ask* — a request an admin approves or rejects.

export const BUSINESS_STATUSES = [
  "pending",
  "active",
  "suspended",
  "closed",
] as const;
export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

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
  if (business.createdById === user.id) return "creator";
  return "visitor";
}

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
  if (role === "owner") {
    if (from === "active") return ["closed"];
    if (from === "closed") return ["active"];
  }
  return [];
}

/** What `role` may ask an admin for (when it can't do it itself). */
export function allowedRequest(
  role: BusinessRole | null,
  from: BusinessStatus,
): RequestKind | null {
  if (role === "creator" || role === "visitor") {
    if (from === "active") return "close";
    if (from === "closed" && role === "creator") return "reopen";
  }
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
