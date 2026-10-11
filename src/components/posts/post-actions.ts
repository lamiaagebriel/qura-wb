"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { isValidId } from "@/db/helpers";
import { posts, postSaves, postVotes } from "@/db/schema";
import { getFreshSession, getSession } from "@/lib/auth/session";
import { getCity } from "@/lib/city-server";
import { findPublicBusiness, isMine } from "@/lib/data/businesses";
import { findPostRow, getPost, postsIn } from "@/lib/data/posts";
import type { MessageKey } from "@/lib/i18n/types";
import {
  isPostType,
  postEditSchema,
  postSchema,
  replySchema,
  type PostPage,
} from "@/lib/posts";
import { rateLimit } from "@/lib/rate-limit";

export type PostResult<T = object> =
  ({ ok: true } & T) | { ok: false; error: MessageKey };

const failed = {
  ok: false,
  error: "Something went wrong. Please try again.",
} as const;

/**
 * The signed-in, active user (fresh session), within the rate limit — or
 * the error to show. Actions are public endpoints: every input is checked.
 */
async function signedIn(
  limitKey: string,
  max: number,
): Promise<{ error: MessageKey } | { userId: string; isAdmin: boolean }> {
  const session = await getFreshSession();
  if (!session || session.user.status === "suspended") {
    return { error: "Please sign in again." };
  }
  const userId = session.user.id;
  if (!(await rateLimit(`${limitKey}:${userId}`, max, 60 * 60))) {
    return { error: "Too many attempts. Please wait a moment." };
  }
  return { userId, isAdmin: session.user.role === "super_admin" };
}

const refresh = () => revalidatePath("/", "layout");

/** Posts in the visitor's city, as themselves or as one of their businesses. */
export async function createPost(
  input: unknown,
): Promise<PostResult<{ id: string }>> {
  const user = await signedIn("post", 30);
  if ("error" in user) return { ok: false, error: user.error };
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return failed;
  const values = parsed.data;

  let businessId: string | null = null;
  if (values.business) {
    const business = await findPublicBusiness(values.business);
    if (
      !business ||
      business.status !== "active" ||
      !isMine(business, user.userId)
    ) {
      return { ok: false, error: "You can only post as your own business." };
    }
    businessId = business.id;
  }

  const [row] = await db
    .insert(posts)
    .values({
      createdById: user.userId,
      businessId,
      type: values.type,
      body: values.body,
      city: await getCity(),
      // Already checked against the type's schema (`POST_DATA`).
      data: values.data,
    })
    .returning({ id: posts.id });
  refresh();
  return { ok: true, id: row.id };
}

/** Edits your post's text and its type's fields (an offer's price…). */
export async function updatePost(
  id: unknown,
  input: unknown,
): Promise<PostResult> {
  const user = await signedIn("post-edit", 60);
  if ("error" in user) return { ok: false, error: user.error };
  const row = typeof id === "string" ? await findPostRow(id) : undefined;
  if (!row || row.createdById !== user.userId) {
    return { ok: false, error: "This post no longer exists." };
  }
  // Type and author stay as they were posted; its type checks `data`.
  const parsed = postEditSchema(row.type).safeParse(input);
  if (!parsed.success) return failed;

  await db
    .update(posts)
    .set({
      body: parsed.data.body,
      // A reply has no fields of its own.
      ...(row.parentId ? {} : { data: parsed.data.data }),
    })
    .where(eq(posts.id, row.id));
  refresh();
  return { ok: true };
}

/** Deletes your post (admins: anyone's), with its replies. */
export async function deletePost(id: unknown): Promise<PostResult> {
  const user = await signedIn("post-delete", 60);
  if ("error" in user) return { ok: false, error: user.error };
  const row = typeof id === "string" ? await findPostRow(id) : undefined;
  if (!row || (row.createdById !== user.userId && !user.isAdmin)) {
    return { ok: false, error: "This post no longer exists." };
  }
  await db.delete(posts).where(eq(posts.id, row.id));
  refresh();
  return { ok: true };
}

/** Replies to a post, as yourself. */
export async function replyToPost(
  postId: unknown,
  input: unknown,
): Promise<PostResult> {
  const user = await signedIn("reply", 60);
  if ("error" in user) return { ok: false, error: user.error };
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return failed;
  const parent =
    typeof postId === "string" ? await findPostRow(postId) : undefined;
  if (!parent || parent.parentId) {
    return { ok: false, error: "This post no longer exists." };
  }

  await db.insert(posts).values({
    createdById: user.userId,
    parentId: parent.id,
    type: parent.type,
    city: parent.city,
    body: parsed.data.body,
  });
  refresh();
  return { ok: true };
}

/** Helpful (1), not helpful (-1), or take your vote back (0). */
export async function votePost(
  id: unknown,
  value: unknown,
): Promise<PostResult> {
  if (value !== 1 && value !== -1 && value !== 0) return failed;
  const user = await signedIn("vote", 300);
  if ("error" in user) return { ok: false, error: user.error };
  // Posts and replies alike.
  const row = typeof id === "string" ? await findPostRow(id) : undefined;
  if (!row) return { ok: false, error: "This post no longer exists." };

  if (value === 0) {
    await db
      .delete(postVotes)
      .where(
        and(eq(postVotes.postId, row.id), eq(postVotes.userId, user.userId)),
      );
  } else {
    await db
      .insert(postVotes)
      .values({ postId: row.id, userId: user.userId, value })
      .onConflictDoUpdate({
        target: [postVotes.userId, postVotes.postId],
        set: { value },
      });
  }
  return { ok: true };
}

/** Bookmarks (`save` = true) or un-bookmarks a post. Idempotent. */
export async function savePost(
  id: unknown,
  save: unknown,
): Promise<PostResult> {
  if (typeof save !== "boolean") return failed;
  const user = await signedIn("save", 300);
  if ("error" in user) return { ok: false, error: user.error };
  if (typeof id !== "string" || !isValidId(id)) return failed;

  if (save) {
    if (!(await getPost(id, user.userId))) {
      return { ok: false, error: "This post no longer exists." };
    }
    await db
      .insert(postSaves)
      .values({ postId: id, userId: user.userId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(postSaves)
      .where(and(eq(postSaves.postId, id), eq(postSaves.userId, user.userId)));
  }
  revalidatePath("/profile/saved");
  return { ok: true };
}

/**
 * The next page of the posts in the visitor's city — all, or one
 * `type` (`null`) — for infinite scroll.
 */
export async function loadMorePosts(
  type: unknown,
  cursor: unknown,
): Promise<PostPage> {
  if ((type !== null && !isPostType(type)) || typeof cursor !== "string") {
    return { posts: [], next: null };
  }
  const [session, city] = await Promise.all([getSession(), getCity()]);
  return postsIn(city, session?.user.id, { type, cursor });
}
