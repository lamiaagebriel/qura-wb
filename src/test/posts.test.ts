import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { createImageUpload } from "@/server/actions/post-images";
import { createPost, deletePost, replyToPost, savePost, updatePost, votePost } from "@/server/actions/posts";
import { findVisiblePostRow, getPost, getReplies, postsIn, savedPosts } from "@/server/queries/posts";

import { browse, business, data, person, post, refused, setup, signIn, statusOf } from "./helpers";
import type { TestUser } from "./session";

const newPost = (body: string, extra: Record<string, unknown> = {}) => ({
  type: "general",
  city: "",
  business: "",
  body,
  data: {},
  ...extra,
});

describe("posts", () => {
  let alice: TestUser, bob: TestUser;
  beforeAll(async () => {
    alice = await person("Alice");
    bob = await person("Bob");
  });

  it("posts in the place being browsed, and shows in every place above it", async () => {
    signIn(alice);
    browse("edfu");
    const { id } = data(await createPost(newPost("Fresh bread in Edfu")));
    expect((await postsIn("edfu", alice.id)).posts.some((p) => p.id === id)).toBe(true);
    // Edfu is inside Aswan: Aswan's feed has it too.
    expect((await postsIn("aswan", alice.id)).posts.some((p) => p.id === id)).toBe(true);
    expect((await postsIn("luxor", alice.id)).posts.some((p) => p.id === id)).toBe(false);
  });

  it("refuses an empty post under its field", async () => {
    signIn(alice);
    expect(await createPost(newPost("   "))).toMatchObject({ ok: false, field: "body" });
  });

  it("posts as a business only if you run it", async () => {
    const theirs = await business(bob);
    signIn(alice);
    expect(refused(await createPost(newPost("Sale!", { type: "offer", business: theirs.username })))).toBe(
      "You can only post as your own business.",
    );
    signIn(bob);
    data(await createPost(newPost("Sale!", { type: "offer", business: theirs.username, data: { price: "20% off" } })));
  });

  it("only its author edits or deletes a post (its replies go with it)", async () => {
    const mine = await post(alice, { body: "Mine" });
    const reply = await post(bob, { body: "A reply", parentId: mine });
    signIn(bob);
    expect((await updatePost(mine, { body: "Hacked", data: {} })).ok).toBe(false);
    expect((await deletePost(mine)).ok).toBe(false);
    signIn(alice);
    data(await updatePost(mine, { body: "Edited", data: {} }));
    expect((await getPost(mine, alice.id))?.body).toBe("Edited");
    data(await deletePost(mine));
    expect(await db.$count(posts, eq(posts.id, reply))).toBe(0);
  });

  it("photo uploads: signed in, images only, under your own folder", async () => {
    signIn(alice);
    expect(refused(await createImageUpload("application/pdf"))).toBe("Only JPEG, PNG, WebP or GIF photos.");
    const { url, uploadUrl } = data(await createImageUpload("image/png"));
    expect(url).toMatch(new RegExp(`^https://photos\\.test/post-images/${alice.id}/[\\w-]+\\.png$`));
    expect(uploadUrl).toContain("X-Amz-Signature");
  });

  it("a post takes up to 4 of its author's own photos, in order", async () => {
    signIn(alice);
    const mine = () => createImageUpload("image/jpeg").then((r) => data(r).url);
    const [a, b] = [await mine(), await mine()];
    const { id } = data(await createPost(newPost("Sunset", { images: [b, a] })));
    expect((await getPost(id, alice.id))?.images).toEqual([b, a]);

    // Someone else's photo, or any other URL: refused.
    signIn(bob);
    const bobs = data(await createImageUpload("image/jpeg")).url;
    expect((await createPost(newPost("Mine?", { images: [a] }))).ok).toBe(false);
    expect((await createPost(newPost("Elsewhere", { images: ["https://example.com/x.jpg"] }))).ok).toBe(false);
    expect((await createPost(newPost("Too many", { images: [bobs, bobs, bobs, bobs, bobs] }))).ok).toBe(false);

    // An edit can drop and reorder them (the dropped file is deleted).
    signIn(alice);
    data(await updatePost(id, { body: "Sunset", data: {}, images: [a] }));
    expect((await getPost(id, alice.id))?.images).toEqual([a]);
  });

  it("an ad: a business's, with a photo, days in order and an optional web link", async () => {
    const mine = await business(alice);
    signIn(alice);
    const photo = data(await createImageUpload("image/jpeg")).url;
    const ad = (extra: Record<string, unknown>) =>
      createPost(newPost("Grand opening", { type: "ad", business: mine.username, images: [photo], ...extra }));
    const days = { startsOn: "2030-01-01", endsOn: "2030-01-10" };
    // As yourself: not an ad type.
    expect((await createPost(newPost("Me!", { type: "ad", images: [photo], data: days }))).ok).toBe(false);
    expect(await ad({ images: [], data: days })).toMatchObject({ ok: false, field: "images" });
    expect(await ad({ data: { startsOn: "2030-01-10", endsOn: "2030-01-01" } })).toMatchObject({ ok: false, field: "data.endsOn" });
    expect(await ad({ data: { ...days, link: "javascript:alert(1)" } })).toMatchObject({ ok: false, field: "data.link" });
    const { id } = data(await ad({ data: { ...days, link: "https://example.com" } }));
    expect((await getPost(id, alice.id))?.data).toMatchObject({ ...days, link: "https://example.com" });
  });

  it("the reply count skips hidden replies and suspended writers", async () => {
    const thread = await post(bob, { body: "Thread" });
    const dan = await person("Dan");
    signIn(alice);
    data(await replyToPost(thread, { body: "Visible reply" }));
    await post(alice, { body: "Hidden reply", parentId: thread, status: "hidden" });
    await post(dan, { body: "Dan's reply", parentId: thread });
    await setup((tx) => tx.update(users).set({ status: "suspended" }).where(eq(users.id, dan.id)));
    expect((await getPost(thread, undefined))?.replyCount).toBe(1);
    expect((await getReplies(thread, undefined)).length).toBe(1);
  });

  it("a hidden post can't be replied to, voted on or saved; neither can its replies", async () => {
    const hidden = await post(bob, { status: "hidden" });
    signIn(alice);
    expect(refused(await replyToPost(hidden, { body: "Hi" }))).toBe("This post no longer exists.");
    expect(refused(await votePost(hidden, 1))).toBe("This post no longer exists.");
    expect((await savePost(hidden, true)).ok).toBe(false);

    const thread = await post(bob);
    const reply = await post(alice, { parentId: thread });
    await setup((tx) => tx.update(posts).set({ status: "hidden" }).where(eq(posts.id, thread)));
    expect(await findVisiblePostRow(reply)).toBeUndefined();
    expect(await statusOf.post(reply)).toBe("visible");
  });

  it("votes: never on your own post; up, down and back", async () => {
    const theirs = await post(bob);
    signIn(bob);
    expect(refused(await votePost(theirs, 1))).toBe("You can't vote on your own post.");
    signIn(alice);
    data(await votePost(theirs, 1));
    expect((await getPost(theirs, alice.id))).toMatchObject({ score: 1, myVote: 1 });
    data(await votePost(theirs, -1));
    expect((await getPost(theirs, alice.id))).toMatchObject({ score: -1, myVote: -1 });
    data(await votePost(theirs, 0));
    expect((await getPost(theirs, alice.id))).toMatchObject({ score: 0, myVote: 0 });
  });

  it("saving is private and idempotent", async () => {
    const theirs = await post(bob);
    signIn(alice);
    data(await savePost(theirs, true));
    data(await savePost(theirs, true));
    expect((await savedPosts(alice.id)).filter((p) => p.id === theirs)).toHaveLength(1);
    expect((await savedPosts(bob.id)).some((p) => p.id === theirs)).toBe(false);
    data(await savePost(theirs, false));
    expect((await savedPosts(alice.id)).some((p) => p.id === theirs)).toBe(false);
  });
});
