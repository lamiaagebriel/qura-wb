import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  isNull,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import { isValidId } from "@/db/helpers";
import { businesses, posts, postSaves, postVotes, users } from "@/db/schema";
import { inPlaceTree } from "@/lib/data/places";
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

/** Posts whose writer is active and whose business (if any) is live. */
const active = and(
  eq(users.status, "active"),
  or(isNull(posts.businessId), eq(businesses.status, "active")),
);

/**
 * What everyone sees: active, and not hidden after a report (rule 13). A
 * reply also needs its post to be seen — hiding the post hides its replies
 * without touching their own status, so showing it again brings them back.
 */
const parentSeen = sql`(${posts.parentId} is null or exists (
    select 1 from ${posts} as p
    join ${users} as pu on pu.id = p.created_by_id
    left join ${businesses} as pb on pb.id = p.business_id
    where p.id = ${posts.parentId}
      and p.status = 'visible'
      and pu.status = 'active'
      and (p.business_id is null or pb.status = 'active')
  ))`;
const visible = and(active, eq(posts.status, "visible"), parentSeen);

/**
 * Why a hidden post was hidden (only for those): the reason on the latest
 * action that hid it — a moderator's hide or an approved report.
 */
export const hiddenReason = sql<string | null>`case when ${posts.status} <> 'visible' then (
  select h.note from history h
  where h.entry = 'action' and h.note is not null and (
    (h.action = 'post.hide' and h.input->>'postId' = ${posts.id}::text)
    or (h.action = 'ticket.approve' and h.input->>'ticketId' in (
      select t.id::text from tickets t
      where t.type = 'report_post'
        and t.refs @> jsonb_build_array(jsonb_build_object('table', 'posts', 'id', ${posts.id}::text))
    ))
  )
  order by h.id desc limit 1
) end`;

const topLevelIn = (city: string) =>
  and(isNull(posts.parentId), inPlaceTree(posts.placeId, city));

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
      status: posts.status,
      hiddenReason,
      user: { name: users.name, username: users.username, image: users.image },
      business: {
        id: businesses.id,
        name: businesses.name,
        username: businesses.username,
        image: businesses.image,
        verified: businesses.verified,
        category: businesses.category,
      },
      // Same rule as `visible`, so it matches what the reply list shows:
      // none while the post itself isn't seen (its author still opens it).
      replyCount: sql<number>`case when ${posts.status} <> 'visible' then 0 else (
        select count(*)::int from ${posts} as r
        join ${users} as ru on ru.id = r.created_by_id
        left join ${businesses} as rb on rb.id = r.business_id
        where r.parent_id = ${posts.id}
          and r.status = 'visible'
          and ru.status = 'active'
          and (r.business_id is null or rb.status = 'active')
      ) end`,
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
    // Only its author ever gets a hidden post.
    hidden:
      row.status === "visible"
        ? null
        : { reason: row.hiddenReason ?? "", waiting: row.status === "under_review" },
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
  city: string,
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
  city: string,
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
  city: string,
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
    .where(and(active, eq(posts.id, id), eq(posts.createdById, userId)))
    .limit(1);
  return row && toPost(row, userId);
}

export async function getPost(id: string, viewerId: string | undefined) {
  if (!isValidId(id)) return undefined;
  const viewer = viewerId && isValidId(viewerId) ? viewerId : null;
  const [row] = await selectPosts(viewerId)
    .where(
      and(
        active,
        // A hidden post still opens for its author (to edit or delete it).
        viewer
          ? or(eq(posts.status, "visible"), eq(posts.createdById, viewer))
          : eq(posts.status, "visible"),
        isNull(posts.parentId),
        eq(posts.id, id),
      ),
    )
    .limit(1);
  return row && toPost(row, viewerId);
}

/**
 * A post's replies, oldest first (a conversation). Like a post, your own
 * hidden or under-review reply still shows to you (with why).
 */
export async function getReplies(postId: string, viewerId: string | undefined) {
  const viewer = viewerId && isValidId(viewerId) ? viewerId : null;
  const rows = await selectPosts(viewerId)
    .where(
      and(
        active,
        parentSeen,
        viewer
          ? or(eq(posts.status, "visible"), eq(posts.createdById, viewer))
          : eq(posts.status, "visible"),
        eq(posts.parentId, postId),
      ),
    )
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

/**
 * The raw row of a post or reply everyone can see (the `visible` rule), or
 * `undefined` — for writes others make on it (replying, voting).
 */
export async function findVisiblePostRow(id: string) {
  if (!isValidId(id)) return undefined;
  const [row] = await db
    .select({ post: posts })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.createdById))
    .leftJoin(businesses, eq(businesses.id, posts.businessId))
    .where(and(visible, eq(posts.id, id)))
    .limit(1);
  return row?.post;
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

/**
 * Posts this user wrote (as themselves or as a business), newest first
 * (Profile → My posts). Their hidden ones too, with why — like opening one.
 */
export async function myPosts(userId: string): Promise<Post[]> {
  const rows = await selectPosts(userId)
    .where(and(active, isNull(posts.parentId), eq(posts.createdById, userId)))
    .orderBy(...newestFirst)
    .limit(100);
  return rows.map((row) => toPost(row, userId));
}

/**
 * How many posts the profile rows show: yours (as `myPosts` lists them)
 * and your saved ones (as `savedPosts` lists them). One query.
 */
export async function postCounts(userId: string) {
  const [row] = await db
    .select({
      mine: sql<number>`count(*) filter (where ${posts.createdById} = ${userId} and ${posts.parentId} is null)::int`,
      saved: sql<number>`count(*) filter (where ${posts.parentId} is null and ${posts.status} = 'visible' and ${parentSeen} and exists (
        select 1 from ${postSaves} where ${postSaves.postId} = ${posts.id} and ${postSaves.userId} = ${userId}
      ))::int`,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.createdById))
    .leftJoin(businesses, eq(businesses.id, posts.businessId))
    .where(
      and(
        active,
        // Only your posts and the ones you saved (indexed), not the whole table.
        or(
          eq(posts.createdById, userId),
          sql`${posts.id} in (select ${postSaves.postId} from ${postSaves} where ${postSaves.userId} = ${userId})`,
        ),
      ),
    );
  return { mine: row?.mine ?? 0, saved: row?.saved ?? 0 };
}
