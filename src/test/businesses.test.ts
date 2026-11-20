import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "@/db";
import { businessFollows, businessLocations, businesses, users } from "@/db/schema";
import { allowedRequest, allowedStatuses, canDelete, canManage, roleFor } from "@/lib/business-status";
import { EMPTY_BUSINESS } from "@/lib/validations/business-form";
import { requestStatusChange, setBusinessStatus } from "@/server/actions/business-status";
import { deleteBusiness, saveBusiness } from "@/server/actions/businesses";
import { setFollowing } from "@/server/actions/social";
import { findPublicBusiness, getBusiness, getMyBusiness, getMyBusinesses } from "@/server/queries/businesses";
import { postingBusinesses } from "@/server/queries/posts";
import { runAction } from "@/server/run-action";
import { applyStatus, NotReadyToGoLive } from "@/server/status-writes";

import { business, data, person, refused, setup, signIn, statusOf } from "./helpers";
import type { TestUser } from "./session";

const rowOf = async (id: string) => (await db.select().from(businesses).where(eq(businesses.id, id)))[0];

describe("businesses", () => {
  let owner: TestUser, visitor: TestUser;
  beforeAll(async () => {
    owner = await person("Owner");
    visitor = await person("Visitor");
  });

  it("a new business goes live at once", async () => {
    signIn(owner);
    const username = `t.new${crypto.randomUUID().slice(0, 6)}`;
    data(
      await saveBusiness(null, {
        ...EMPTY_BUSINESS,
        name: { en: "New Bakery", ar: "" },
        username,
        category: "bakery",
        links: [{ platform: "whatsapp", url: "+201000000000" }],
        locations: [{ address: { en: "Street 1", ar: "" }, city: "luxor", pin: "25.69, 32.64" }],
      }),
    );
    expect((await getBusiness(username))?.username).toBe(username);
    expect((await getMyBusinesses(owner.id)).some((b) => b.username === username)).toBe(true);
  });

  it("a taken @handle is refused under its field", async () => {
    const taken = await business(visitor);
    signIn(owner);
    const result = await saveBusiness(null, {
      ...EMPTY_BUSINESS,
      name: { en: "Copycat", ar: "" },
      username: taken.username,
      category: "bakery",
      links: [{ platform: "whatsapp", url: "+201000000000" }],
      locations: [{ address: { en: "Street 1", ar: "" }, city: "luxor", pin: "25.69, 32.64" }],
    });
    expect(result).toMatchObject({ ok: false, error: "This username is taken", field: "username" });
  });

  it("its owner closes and reopens it; a visitor can't", async () => {
    const shop = await business(owner);
    signIn(visitor);
    expect(refused(await setBusinessStatus(shop.username, "closed"))).toBe("You can't do that.");
    signIn(owner);
    data(await setBusinessStatus(shop.username, "closed"));
    expect(await statusOf.business(shop.id)).toBe("closed");
    data(await setBusinessStatus(shop.username, "active"));
    expect(await statusOf.business(shop.id)).toBe("active");
  });

  it("a visitor reports it closed (a request); its owner closes it instead of asking", async () => {
    const shop = await business(owner);
    signIn(owner);
    expect((await requestStatusChange(shop.username, "close")).ok).toBe(false);
    signIn(visitor);
    data(await requestStatusChange(shop.username, "close", "Shutters down"));
    // Only recorded: it stays open.
    expect(await statusOf.business(shop.id)).toBe("active");
  });

  it("whoever added an unowned business runs it, until someone owns it", async () => {
    const adder = await person("Adder");
    const stall = await business(adder, { owner: null });
    expect(canManage(roleFor(await rowOf(stall.id), adder))).toBe(true);
    expect(await getMyBusiness(stall.username, adder.id)).toBeTruthy();
    expect((await postingBusinesses(adder.id, "en")).some((b) => b.username === stall.username)).toBe(true);
    expect(allowedStatuses(roleFor(await rowOf(stall.id), adder), "closed")).toEqual(["active", "deleted"]);

    await setup((tx) => tx.update(businesses).set({ ownerId: owner.id }).where(eq(businesses.id, stall.id)));
    const claimed = await rowOf(stall.id);
    expect(roleFor(claimed, adder)).toBe("visitor");
    expect(await getMyBusiness(stall.username, adder.id)).toBeUndefined();
    expect((await postingBusinesses(adder.id, "en")).some((b) => b.username === stall.username)).toBe(false);
    expect(canDelete(roleFor(claimed, adder), true)).toBe(false);
    expect(allowedStatuses(roleFor(claimed, adder), claimed.status)).toEqual([]);
    // …but can still report it closed, like anyone.
    expect(allowedRequest(roleFor(claimed, adder), claimed.status)).toBe("close");
    expect(canManage(roleFor(claimed, owner))).toBe(true);
  });

  it("only who may delete it does (soft: status `deleted`)", async () => {
    const shop = await business(owner);
    signIn(visitor);
    expect((await deleteBusiness(shop.username)).ok).toBe(false);
    signIn(owner);
    data(await deleteBusiness(shop.username));
    expect(await statusOf.business(shop.id)).toBe("deleted");
    // Gone for everyone, its owner too.
    expect(await findPublicBusiness(shop.username)).toBeUndefined();
    expect((await getMyBusinesses(owner.id)).some((b) => b.username === shop.username)).toBe(false);
  });

  it("going live needs a branch and a WhatsApp link", async () => {
    const goLive = (id: string) =>
      runAction({ action: "business.set_status", actorId: owner.id }, (tx) => applyStatus(tx, { id }, "active", owner.id)).then(
        () => "live",
        (error: unknown) => (error instanceof NotReadyToGoLive ? "refused" : Promise.reject(error)),
      );
    const bare = await business(owner, { status: "pending" });
    await setup(async (tx) => {
      await tx.delete(businessLocations).where(eq(businessLocations.businessId, bare.id));
      await tx.update(businesses).set({ links: [] }).where(eq(businesses.id, bare.id));
    });
    expect(await goLive(bare.id)).toBe("refused");
    expect(await statusOf.business(bare.id)).toBe("pending");

    const complete = await business(owner, { status: "pending" });
    expect(await goLive(complete.id)).toBe("live");
    expect(await statusOf.business(complete.id)).toBe("active");
  });

  it("follows count only active people", async () => {
    const shop = await business(owner);
    const fans = [await person("Fan 1"), await person("Fan 2"), await person("Fan 3")];
    for (const fan of fans) {
      signIn(fan);
      data(await setFollowing(shop.username, true));
    }
    await setup((tx) => tx.update(users).set({ status: "suspended" }).where(eq(users.id, fans[2].id)));
    expect((await getBusiness(shop.username))?.stats.followers).toBe(2);
    expect(await db.$count(businessFollows, eq(businessFollows.businessId, shop.id))).toBe(3);
  });
});
