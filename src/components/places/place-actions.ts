"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { currentActor } from "@/lib/actions/actor";
import { getPlaceIndex } from "@/lib/data/places";
import type { MessageKey } from "@/lib/i18n/types";
import { OTHER_TYPE, placeRequestSchema } from "@/lib/place-requests";
import { answerTicket, cancelTicket, openTicket } from "@/lib/tickets/server";

// The place screens' actions: asking for a place and for co-admins, and
// answering those requests — all tickets (`lib/tickets`), recorded in
// history.

export type PlaceResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: MessageKey; fields?: Record<string, MessageKey> };

const AGAIN = { ok: false, error: "Something went wrong. Please try again." } as const;

/** Asks for a new place under one that exists (a `new_place` ticket). Anyone signed in. */
export async function requestPlace(input: unknown): Promise<PlaceResult<{ id: string }>> {
  const me = await currentActor("place-request", 10);
  if ("error" in me) return { ok: false, error: me.error };
  const parsed = placeRequestSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, MessageKey> = {};
    for (const issue of parsed.error.issues) fields[issue.path.join(".")] ??= issue.message as MessageKey;
    return { ...AGAIN, fields };
  }
  const values = parsed.data;
  const parent = (await getPlaceIndex()).get(values.parent);
  if (!parent) return { ...AGAIN, fields: { parent: "Choose a city" } };
  const other = values.type === OTHER_TYPE;
  return openTicket(me.actor, "new_place", [{ table: "places", id: parent.id }], {
    name: { en: values.name.en ?? "", ar: values.name.ar ?? "" },
    typeId: other ? undefined : values.type,
    customType: other ? values.customType : undefined,
    reason: values.reason,
  });
}

/** Takes back your own waiting request. */
export async function cancelPlaceRequest(id: unknown): Promise<PlaceResult> {
  const me = await currentActor("ticket-cancel", 30);
  if ("error" in me) return { ok: false, error: me.error };
  return cancelTicket(me.actor, id);
}

/** Approves a place request (the place is created…) or rejects it with a reason. */
export async function resolvePlaceRequest(id: unknown, approve: unknown, answer: unknown = ""): Promise<PlaceResult> {
  const me = await currentActor("ticket-answer", 200);
  if ("error" in me) return { ok: false, error: me.error };
  if (typeof approve !== "boolean") return AGAIN;
  return answerTicket(me.actor, id, approve ? "approve" : "reject", answer);
}

/** A place admin asking the super admin to add `username` as a co-admin, or to remove one. */
export async function requestAdminChange(
  placeSlug: unknown,
  kind: unknown,
  username: unknown,
  note: unknown = "",
): Promise<PlaceResult> {
  const me = await currentActor("admin-request", 20);
  if ("error" in me) return { ok: false, error: me.error };
  if ((kind !== "add" && kind !== "remove") || typeof placeSlug !== "string" || typeof username !== "string") return AGAIN;
  const place = (await getPlaceIndex()).get(placeSlug);
  if (!place) return AGAIN;
  const handle = username.trim().replace(/^@/, "").toLowerCase();
  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, handle)).limit(1);
  if (!target) return { ...AGAIN, fields: { username: "Nobody has this username" } };
  return openTicket(
    me.actor,
    kind === "add" ? "add_admin" : "remove_admin",
    [
      { table: "places", id: place.id },
      { table: "users", id: target.id },
    ],
    { note: typeof note === "string" ? note : "" },
  );
}

/** Approves (applies it) or rejects a co-admin / removal request. */
export async function resolveAdminRequest(id: unknown, approve: unknown, answer: unknown = ""): Promise<PlaceResult> {
  const me = await currentActor("ticket-answer", 200);
  if ("error" in me) return { ok: false, error: me.error };
  if (typeof approve !== "boolean") return AGAIN;
  return answerTicket(me.actor, id, approve ? "approve" : "reject", answer);
}
