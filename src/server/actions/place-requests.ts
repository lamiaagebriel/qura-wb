"use server";

import { fail, invalid, type ActionResult } from "@/lib/action-result";
import { currentActor } from "@/server/actor";
import { getPlaceIndex } from "@/server/queries/places";
import { OTHER_TYPE } from "@/lib/place-requests";
import { placeRequestSchema } from "@/lib/validations/place-request-form";
import { cancelTicket, openTicket } from "@/server/tickets";

// The place screens' actions: asking for a place and taking the request
// back — tickets (`lib/tickets`), recorded in history.


/** Asks for a new place under one that exists (a `new_place` ticket). Anyone signed in. */
export async function requestPlace(input: unknown): Promise<ActionResult<{ id: string }>> {
  const me = await currentActor("place-request", 10);
  if ("error" in me) return fail(me.error);
  const parsed = placeRequestSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const values = parsed.data;
  const parent = (await getPlaceIndex()).get(values.parent);
  if (!parent) return fail("Choose a city", "parent");
  const other = values.type === OTHER_TYPE;
  return openTicket(me.actor, "new_place", [{ table: "places", id: parent.id }], {
    name: { en: values.name.en ?? "", ar: values.name.ar ?? "" },
    typeId: other ? undefined : values.type,
    customType: other ? values.customType : undefined,
    reason: values.reason,
  });
}

/** Takes back your own waiting request. */
export async function cancelPlaceRequest(id: unknown): Promise<ActionResult> {
  const me = await currentActor("ticket-cancel", 30);
  if ("error" in me) return fail(me.error);
  return cancelTicket(me.actor, id);
}
