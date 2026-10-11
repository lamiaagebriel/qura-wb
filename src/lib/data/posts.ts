import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import { isValidId } from "@/db/helpers";
import { businesses, posts, postSaves, postVotes, users } from "@/db/schema";
import { cityAndSubs, type CitySlug } from "@/lib/cities";
import { getMyBusinesses } from "@/lib/data/businesses";
import type { Locale } from "@/lib/i18n/config";
import { inLocale } from "@/lib/localized";
import {
  POST_TYPES,
  POSTS_PAGE_SIZE,
  type Post,
  type PostType,
  type PostPage,
  type PostingBusiness,
  dayOf,
} from "@/lib/posts";

// Ordered and paged by the creation time cut to milliseconds, which is
// what survives the round trip through a JS `Date` in the cursor.
const createdMs = sql`date_trunc('milliseconds', ${posts.createdAt})`;
const newestFirst = [desc(createdMs), desc(posts.id)];

/** Only posts whose writer is active and whose business (if any) is live. */
const visible = and(
  eq(users.status, "active"),
  or(isNull(posts.businessId), eq(businesses.status, "active")),
);

const topLevelIn = (city: CitySlug) =>
  and(isNull(posts.parentId), inArray(posts.city, cityAndSubs(city)));

/** Posts with their author, counts, and what `viewerId` did with them. */
function selectPosts(viewerId: string | undefined) {
  const viewer = viewerId && isValidId(viewerId) ? viewerId : null;
  return db
    .select({
      id: posts.id,
      type: posts.type,
      body: posts.body,
      data: posts.data,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      createdById: posts.createdById,
      parentId: posts.parentId,
      user: { name: users.name, username: users.username, image: users.image },
      business: {
        id: businesses.id,
        name: businesses.name,
        username: businesses.username,
        image: businesses.image,
        verified: businesses.verified,
        category: businesses.category,
      },
      replyCount: sql<number>`(select count(*)::int from ${posts} as r where r.parent_id = ${posts.id})`,
      score: sql<number>`coalesce((select sum(${postVotes.value})::int from ${postVotes} where ${postVotes.postId} = ${posts.id}), 0)`,
      myVote: viewer
        ? sql<number>`coalesce((select ${postVotes.value} from ${postVotes} where ${postVotes.postId} = ${posts.id} and ${postVotes.userId} = ${viewer}), 0)`
        : sql<number>`0`,
      saved: viewer
        ? sql<boolean>`exists (select 1 from ${postSaves} where ${postSaves.postId} = ${posts.id} and ${postSaves.userId} = ${viewer})`
        : sql<boolean>`false`,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.createdById))
    .leftJoin(businesses, eq(businesses.id, posts.businessId))
    .$dynamic();
}

type Row = Awaited<
  ReturnType<ReturnType<typeof selectPosts>["execute"]>
>[number];

function toPost(row: Row, viewerId: string | undefined): Post {
  return {
    id: row.id,
    type: row.type,
    body: row.body,
    data: row.data,
    // Over at the end of its last day.
    ended:
      !!row.data.endsOn &&
      dayOf(row.data.endsOn).setHours(23, 59, 59) < Date.now(),
    createdAt: row.createdAt,
    // Saved again more than a minute after posting.
    edited: row.updatedAt.getTime() - row.createdAt.getTime() > 60_000,
    author: row.business
      ? { type: "business", ...row.business }
      : { type: "user", ...row.user },
    replyCount: row.replyCount,
    score: row.score,
    myVote: Math.sign(row.myVote) as Post["myVote"],
    saved: row.saved,
    mine: row.createdById === viewerId,
    replyTo: row.parentId,
  };
}

/** `createdAt|id` of the last post, where the next page starts. */
const cursorOf = (page: Post[], size: number) => {
  const last = page.at(-1);
  return page.length === size && last
    ? `${last.createdAt.toISOString()}|${last.id}`
    : null;
};

function afterCursor(cursor: string | null | undefined): SQL | undefined {
  if (!cursor) return undefined;
  const [at, id] = cursor.split("|");
  const date = new Date(at ?? "");
  if (Number.isNaN(date.getTime()) || !isValidId(id ?? "")) return undefined;
  return sql`(${createdMs}, ${posts.id}) < (${date.toISOString()}::timestamptz, ${id}::uuid)`;
}

/** The latest posts in `city`: of one type, or all but `except` (home). */
export async function latestPosts(
  city: CitySlug,
  viewerId: string | undefined,
  {
    type,
    except,
    limit = 8,
  }: { type?: PostType; except?: PostType; limit?: number } = {},
): Promise<Post[]> {
  const rows = await selectPosts(viewerId)
    .where(
      and(
        visible,
        topLevelIn(city),
        type ? eq(posts.type, type) : undefined,
        except ? ne(posts.type, except) : undefined,
      ),
    )
    .orderBy(...newestFirst)
    .limit(limit);
  return rows.map((row) => toPost(row, viewerId));
}

/** How many posts of each type `city` has (home chips). */
export async function typeCounts(
  city: CitySlug,
): Promise<Record<PostType, number>> {
  const rows = await db
    .select({ type: posts.type, count: count() })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.createdById))
    .leftJoin(businesses, eq(businesses.id, posts.businessId))
    .where(and(visible, topLevelIn(city)))
    .groupBy(posts.type);
  const counts = Object.fromEntries(POST_TYPES.map((k) => [k, 0]));
  for (const row of rows) counts[row.type] = row.count;
  return counts as Record<PostType, number>;
}

/**
 * One page of the posts in `city` — every type, from people and
 * businesses alike, or only `type` — newest first (infinite scroll).
 */
export async function postsIn(
  city: CitySlug,
  viewerId: string | undefined,
  { type, cursor }: { type?: PostType | null; cursor?: string | null } = {},
): Promise<PostPage> {
  const rows = await selectPosts(viewerId)
    .where(
      and(
        visible,
        topLevelIn(city),
        type ? eq(posts.type, type) : undefined,
        afterCursor(cursor),
      ),
    )
    .orderBy(...newestFirst)
    .limit(POSTS_PAGE_SIZE);
  const page = rows.map((row) => toPost(row, viewerId));
  return { posts: page, next: cursorOf(page, POSTS_PAGE_SIZE) };
}

/** A business's latest posts, of one type or all (its profile page). */
export async function businessPosts(
  businessId: string,
  viewerId: string | undefined,
  { type, limit = 20 }: { type?: PostType; limit?: number } = {},
): Promise<Post[]> {
  const rows = await selectPosts(viewerId)
    .where(
      and(
        visible,
        isNull(posts.parentId),
        eq(posts.businessId, businessId),
        type ? eq(posts.type, type) : undefined,
      ),
    )
    .orderBy(...newestFirst)
    .limit(limit);
  return rows.map((row) => toPost(row, viewerId));
}

/** The types a business has posted, with how many of each (its filter). */
export async function businessPostTypes(
  businessId: string,
): Promise<{ type: PostType; count: number }[]> {
  const rows = await db
    .select({ type: posts.type, count: count() })
    .from(posts)
    .where(and(isNull(posts.parentId), eq(posts.businessId, businessId)))
    .groupBy(posts.type);
  // In the usual order of types.
  return POST_TYPES.flatMap((type) => rows.filter((row) => row.type === type));
}

/** A top-level post anyone can see, or `undefined`. */
/** A post or a reply of yours, to edit it — or `undefined`. */
export async function getMyPost(id: string, userId: string) {
  if (!isValidId(id)) return undefined;
  const [row] = await selectPosts(userId)
    .where(and(visible, eq(posts.id, id), eq(posts.createdById, userId)))
    .limit(1);
  return row && toPost(row, userId);
}

export async function getPost(id: string, viewerId: string | undefined) {
  if (!isValidId(id)) return undefined;
  const [row] = await selectPosts(viewerId)
    .where(and(visible, isNull(posts.parentId), eq(posts.id, id)))
    .limit(1);
  return row && toPost(row, viewerId);
}

/** A post's replies, oldest first (a conversation). */
export async function getReplies(postId: string, viewerId: string | undefined) {
  const rows = await selectPosts(viewerId)
    .where(and(visible, eq(posts.parentId, postId)))
    .orderBy(asc(posts.createdAt));
  return rows.map((row) => toPost(row, viewerId));
}

/** Posts this user bookmarked, last saved first (Profile → Saved). */
export async function savedPosts(userId: string): Promise<Post[]> {
  const rows = await selectPosts(userId)
    .innerJoin(
      postSaves,
      and(eq(postSaves.postId, posts.id), eq(postSaves.userId, userId)),
    )
    .where(and(visible, isNull(posts.parentId)))
    .orderBy(desc(postSaves.createdAt))
    .limit(100);
  return rows.map((row) => toPost(row, userId));
}

/** The raw row (who wrote it, parent…), for the write actions. */
export async function findPostRow(id: string) {
  if (!isValidId(id)) return undefined;
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return row;
}

/** Your live businesses you can post as (the composer's "Post as"). */
export async function postingBusinesses(
  userId: string | undefined,
  locale: Locale,
): Promise<PostingBusiness[]> {
  if (!userId) return [];
  const mine = await getMyBusinesses(userId);
  return mine
    .filter((b) => b.status === "active")
    .map((b) => ({
      username: b.username,
      name: inLocale(b.name, locale),
      image: b.avatarUrl,
      verified: b.verified,
      category: b.category,
    }));
}
