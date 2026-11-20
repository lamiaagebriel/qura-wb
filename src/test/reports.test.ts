import { and, eq, sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "@/db";
import { tickets } from "@/db/schema";
import { report, reportBusiness, reportPost } from "@/server/actions/reports";

import { business, data, person, post, refused, signIn, statusOf } from "./helpers";
import type { TestUser } from "./session";

const about = (table: string, id: string) =>
  sql`${tickets.refs} @> ${JSON.stringify([{ table, id }])}::jsonb`;

describe("reports", () => {
  let alice: TestUser, bob: TestUser;
  beforeAll(async () => {
    alice = await person("Alice");
    bob = await person("Bob");
  });

  it("can't report your own post", async () => {
    const mine = await post(alice);
    signIn(alice);
    expect(refused(await reportPost(mine, "spam"))).toBe("You can't do that.");
  });

  it("reporting twice keeps one open ticket", async () => {
    const theirs = await post(alice);
    signIn(bob);
    data(await reportPost(theirs, "spam", "an ad"));
    data(await reportPost(theirs, "offensive"));
    const open = await db.$count(tickets, and(eq(tickets.type, "report_post"), eq(tickets.status, "open"), about("posts", theirs)));
    expect(open).toBe(1);
  });

  it("refuses a reason that isn't on the list", async () => {
    const theirs = await post(alice);
    signIn(bob);
    expect((await reportPost(theirs, "nope")).ok).toBe(false);
  });

  it("refuses when signed out", async () => {
    const theirs = await post(alice);
    signIn(null);
    expect(refused(await reportPost(theirs, "spam"))).toBe("Please sign in again.");
  });

  it("reports never hide or suspend anything by themselves", async () => {
    const theirs = await post(alice);
    const shop = await business(alice);
    for (const name of ["R1", "R2", "R3", "R4", "R5"]) {
      signIn(await person(name));
      data(await reportPost(theirs, "spam"));
      data(await reportBusiness(shop.username, "fake"));
    }
    expect(await statusOf.post(theirs)).toBe("visible");
    expect(await statusOf.business(shop.id)).toBe("active");
  });

  it("can't report your own business; a review or person can be reported", async () => {
    const shop = await business(alice);
    signIn(alice);
    expect((await reportBusiness(shop.username, "fake")).ok).toBe(false);
    signIn(bob);
    data(await report("users", alice.id, "spam"));
    expect((await reportBusiness("t.no-such-business", "fake")).ok).toBe(false);
  });
});
