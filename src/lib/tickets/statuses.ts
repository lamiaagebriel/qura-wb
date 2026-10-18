// Every status a ticket can have. The database checks a ticket's status is
// one of these (tickets.ts); each ticket type uses the ones it needs
// (`lib/tickets/types.ts`). Client-safe.

import type { MessageKey } from "@/lib/i18n/types";

export const TICKET_STATUSES = [
  /** Waiting for an answer. */
  "open",
  /** Sent on to the super admin (by a place admin). */
  "escalated",
  /** Done as asked (a request granted, a report acted on). */
  "approved",
  /** Turned down, with a reason. */
  "rejected",
  /** A report found to be nothing wrong. */
  "dismissed",
  /** Taken back by its sender, or closed because what it was about is gone. */
  "cancelled",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

/** Still waiting for someone (counted in queues; one per key at a time). */
export const OPEN_STATUSES: readonly TicketStatus[] = ["open", "escalated"];

export const isOpen = (status: string) => OPEN_STATUSES.includes(status as TicketStatus);

export const TICKET_STATUS_LABELS: Record<TicketStatus, MessageKey> = {
  open: "Waiting",
  escalated: "Sent by a place admin",
  approved: "Approved",
  rejected: "Rejected",
  dismissed: "Dismissed",
  cancelled: "Cancelled",
};
