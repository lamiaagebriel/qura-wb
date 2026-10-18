"use server";

import { z } from "zod";

import { currentActor } from "@/lib/actions/actor";
import { runAction } from "@/lib/actions/run";
import {
  allowedStatuses,
  BUSINESS_STATUSES,
  REQUEST_KINDS,
  roleFor,
} from "@/lib/business-status";
import { findBusiness } from "@/lib/data/businesses";
import { applyStatus, NOT_READY, NotReadyToGoLive, refreshStatus } from "@/lib/data/status-writes";
import type { MessageKey } from "@/lib/i18n/types";
import { answerTicket, openTicket } from "@/lib/tickets/server";

export type StatusResult = { ok: true } | { ok: false; error: MessageKey };

const AGAIN = { ok: false, error: "Something went wrong. Please try again." } as const;
const NOT_ALLOWED = { ok: false, error: "You can't do that." } as const;

const handle = z.string().min(1).max(50);
const note = z.string().trim().max(500);

const done = (result: { ok: boolean; error?: MessageKey }): StatusResult =>
  result.ok ? { ok: true } : { ok: false, error: result.error ?? AGAIN.error };

/**
 * Changes a business's status directly — only what `allowedStatuses` lets
 * this person do (admins anything; the owner close / reopen / delete).
 * Recorded in history as `business.set_status`.
 */
export async function setBusinessStatus(username: unknown, status: unknown): Promise<StatusResult> {
  const me = await currentActor("business-status", 60);
  if ("error" in me) return { ok: false, error: me.error };
  const parsedHandle = handle.safeParse(username);
  const parsedStatus = z.enum(BUSINESS_STATUSES).safeParse(status);
  if (!parsedHandle.success || !parsedStatus.success) return AGAIN;

  const business = await findBusiness(parsedHandle.data);
  if (!business) return { ok: false, error: "This business no longer exists." };
  if (!allowedStatuses(roleFor(business, me.actor), business.status).includes(parsedStatus.data)) return NOT_ALLOWED;

  try {
    await runAction(
      { action: "business.set_status", actorId: me.actor.id, input: { businessId: business.id, status: parsedStatus.data } },
      (tx) => applyStatus(tx, business, parsedStatus.data, me.actor.id),
    );
  } catch (error) {
    if (error instanceof NotReadyToGoLive) return { ok: false, error: NOT_READY };
    throw error;
  }
  refreshStatus(business.username);
  return { ok: true };
}

/**
 * Asks an admin to close / reopen a business (its creator), or reports it
 * closed (anyone else): a `close_business` / `reopen_business` ticket. Once
 * per person until it's answered.
 */
export async function requestStatusChange(username: unknown, kind: unknown, message: unknown = ""): Promise<StatusResult> {
  const me = await currentActor("status-request", 20);
  if ("error" in me) return { ok: false, error: me.error };
  const parsedHandle = handle.safeParse(username);
  const parsedKind = z.enum(REQUEST_KINDS).safeParse(kind);
  const parsedNote = note.safeParse(message);
  if (!parsedHandle.success || !parsedKind.success || !parsedNote.success) return AGAIN;
  const business = await findBusiness(parsedHandle.data);
  if (!business) return { ok: false, error: "This business no longer exists." };
  const result = await openTicket(
    me.actor,
    parsedKind.data === "reopen" ? "reopen_business" : "close_business",
    [{ table: "businesses", id: business.id }],
    { note: parsedNote.data },
  );
  if (result.ok) refreshStatus(business.username);
  return done(result);
}

/** The super admin approves (applies it) or rejects a close / reopen ticket. */
export async function resolveRequest(ticketId: unknown, approve: unknown): Promise<StatusResult> {
  const me = await currentActor("ticket-answer", 200);
  if ("error" in me) return { ok: false, error: me.error };
  if (typeof approve !== "boolean") return AGAIN;
  return done(await answerTicket(me.actor, ticketId, approve ? "approve" : "reject", approve ? "" : "Not now"));
}
