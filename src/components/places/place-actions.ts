"use server";

import { currentActor } from "@/lib/actions/actor";
import { getPlaceIndex } from "@/lib/data/places";
import type { MessageKey } from "@/lib/i18n/types";
import { OTHER_TYPE, placeRequestSchema } from "@/lib/place-requests";
import { cancelTicket, openTicket } from "@/lib/tickets/server";

// The place screens' actions: asking for a place and taking the request
// back — tickets (`lib/tickets`), recorded in history.

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
