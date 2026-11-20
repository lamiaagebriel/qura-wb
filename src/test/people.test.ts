import { and, eq, sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "@/db";
import { businesses, history, sessions, users } from "@/db/schema";
import { cancelPlaceRequest, requestPlace } from "@/server/actions/place-requests";
import { updateProfile } from "@/server/actions/profile";
import { anonymizeUser } from "@/server/anonymize";
import { runAction } from "@/server/run-action";

import { business, data, person, refused, setup, signIn, statusOf } from "./helpers";
import type { TestUser } from "./session";

const placeRequest = (name: string) => ({
  parent: "aswan",
  name: { en: name, ar: "" },
  type: "other",
  customType: "Village",
  reason: "",
});

describe("people", () => {
  let alice: TestUser, bob: TestUser;
  beforeAll(async () => {
    alice = await person("Alice");
    bob = await person("Bob");
  });

  it("changes your name and @handle; a taken one is refused under its field", async () => {
    signIn(alice);
    const handle = `t_alice_${crypto.randomUUID().slice(0, 6)}`;
    data(await updateProfile({ name: "Alice A.", username: handle, bio: "", image: null }));
    const [row] = await db.select().from(users).where(eq(users.id, alice.id));
    expect(row).toMatchObject({ name: "Alice A.", username: handle });

    signIn(bob);
    expect(await updateProfile({ name: "Bob", username: handle, bio: "", image: null })).toMatchObject({
      ok: false,
      error: "This username is taken",
      field: "username",
    });
  });

  it("an avatar must be a preset, your Google photo or the one you have", async () => {
    signIn(bob);
    expect(refused(await updateProfile({ name: "Bob", username: bob.username, bio: "", image: "https://evil.example/x.png" }))).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("asks for a place once per name; only its sender cancels it", async () => {
    signIn(alice);
    const first = data(await requestPlace(placeRequest("Test Village")));
    const again = data(await requestPlace(placeRequest("Test Village")));
    expect(again.id).toBe(first.id);
    expect(await requestPlace({ ...placeRequest("Nowhere"), parent: "no-such-place" })).toMatchObject({ ok: false, field: "parent" });

    signIn(bob);
    expect((await cancelPlaceRequest(first.id)).ok).toBe(false);
    signIn(alice);
    data(await cancelPlaceRequest(first.id));
    expect(await statusOf.ticket(first.id)).toBe("cancelled");
  });

  it("erasing someone: details gone, signed out, businesses unowned, tickets cancelled, old name out of history", async () => {
    const carol = await person("Carol Unique");
    const shop = await business(carol);
    await setup((tx) => tx.insert(sessions).values({ userId: carol.id, token: crypto.randomUUID(), expiresAt: new Date(Date.now() + 86_400_000) }));
    signIn(carol);
    const ask = data(await requestPlace(placeRequest("Carol's Village")));

    await runAction({ action: "users.anonymize", actorId: null, source: "system" }, (tx) => anonymizeUser(tx, carol.id));

    const [row] = await db.select().from(users).where(eq(users.id, carol.id));
    expect(row).toMatchObject({ name: "Deleted account", status: "deleted", image: null, bio: null });
    expect(row.username.startsWith("deleted-")).toBe(true);
    expect(await db.$count(sessions, eq(sessions.userId, carol.id))).toBe(0);
    expect((await db.select().from(businesses).where(eq(businesses.id, shop.id)))[0].ownerId).toBeNull();
    expect(await statusOf.ticket(ask.id)).toBe("cancelled");
    const kept = await db.$count(
      history,
      and(eq(history.tableName, "users"), eq(history.recordId, carol.id), sql`${history.changes}::text like '%Carol Unique%'`),
    );
    expect(kept).toBe(0);
  });

  it("the database refuses deleting a person (anonymize instead)", async () => {
    const dave = await person("Dave");
    await expect(setup((tx) => tx.delete(users).where(eq(users.id, dave.id)))).rejects.toThrow();
  });
});
