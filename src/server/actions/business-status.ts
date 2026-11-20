"use server";

import { z } from "zod";

import { AGAIN, done, fail, NOT_ALLOWED, type ActionResult } from "@/lib/action-result";
import { currentActor } from "@/server/actor";
import { runAction } from "@/server/run-action";
import {
  allowedStatuses,
  BUSINESS_STATUSES,
  REQUEST_KINDS,
  roleFor,
} from "@/lib/business-status";
import { findBusiness } from "@/server/queries/businesses";
import { applyStatus, NOT_READY, NotReadyToGoLive, refreshStatus } from "@/server/status-writes";
import { openTicket } from "@/server/tickets";


const handle = z.string().min(1).max(50);
const note = z.string().trim().max(500);


/**
 * Changes a business's status directly — only what `allowedStatuses` lets
 * this person do (the owner close / reopen / delete).
 * Recorded in history as `business.set_status`.
 */
export async function setBusinessStatus(username: unknown, status: unknown): Promise<ActionResult> {
  const me = await currentActor("business-status", 60);
  if ("error" in me) return fail(me.error);
  const parsedHandle = handle.safeParse(username);
  const parsedStatus = z.enum(BUSINESS_STATUSES).safeParse(status);
  if (!parsedHandle.success || !parsedStatus.success) return AGAIN;

  const business = await findBusiness(parsedHandle.data);
  if (!business) return fail("This business no longer exists.");
  if (!allowedStatuses(roleFor(business, me.actor), business.status).includes(parsedStatus.data)) return NOT_ALLOWED;

  try {
    await runAction(
      { action: "business.set_status", actorId: me.actor.id, input: { businessId: business.id, status: parsedStatus.data } },
      (tx) => applyStatus(tx, business, parsedStatus.data, me.actor.id),
    );
  } catch (error) {
    if (error instanceof NotReadyToGoLive) return fail(NOT_READY);
    throw error;
  }
  refreshStatus(business.username);
  return done();
}

/**
 * Asks to close / reopen a business (its creator), or reports it
 * closed (anyone else): a `close_business` / `reopen_business` ticket. Once
 * per person while it's open.
 */
export async function requestStatusChange(username: unknown, kind: unknown, message: unknown = ""): Promise<ActionResult> {
  const me = await currentActor("status-request", 20);
  if ("error" in me) return fail(me.error);
  const parsedHandle = handle.safeParse(username);
  const parsedKind = z.enum(REQUEST_KINDS).safeParse(kind);
  const parsedNote = note.safeParse(message);
  if (!parsedHandle.success || !parsedKind.success || !parsedNote.success) return AGAIN;
  const business = await findBusiness(parsedHandle.data);
  if (!business) return fail("This business no longer exists.");
  const result = await openTicket(
    me.actor,
    parsedKind.data === "reopen" ? "reopen_business" : "close_business",
    [{ table: "businesses", id: business.id }],
    { note: parsedNote.data },
  );
  if (result.ok) refreshStatus(business.username);
  return result.ok ? done() : result;
}

