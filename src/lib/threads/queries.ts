import "server-only";

import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { isValidId } from "@/lib/id";
import { getFollowingIds } from "@/lib/profile/queries";

const FEED_PAGE_SIZE = 20;
const REPLIES_PAGE_SIZE = 20;
const PROFILE_TAB_PAGE_SIZE = 20;

export type ReplySort = "top" | "recent";

/** Every paginated list here uses a plain numeric offset as its cursor —
 * simple, and good enough at this scale. Not exposed as a real "cursor"
 * (an opaque token) because nothing about these lists needs one yet. */
export type Page<T> = { items: T[]; nextCursor: number | null };

/** Attaches like/reply counts (and, if `viewerId` is given, whether they
 * liked each thread and whether they follow its author) to a flat list of
 * threads — shared by every list view so the feed, a profile's tabs, and a
 * thread's reply list never compute this differently. */
async function withCounts<T extends { id: string; authorId: string }>(
  rows: T[],
  viewerId?: string,
) {
  if (rows.length === 0) {
    return [] as (T & {
      likeCount: number;
      replyCount: number;
      likedByViewer: boolean;
      authorFollowedByViewer: boolean;
    })[];
  }
  const ids = rows.map((r) => r.id);
  const authorIds = [...new Set(rows.map((r) => r.authorId))];

  const [likeRows, replyRows, viewerLikes, followingIds] = await Promise.all([
    db.query.threadLikes.findMany({
      where: inArray(schema.threadLikes.threadId, ids),
    }),
    db.query.threads.findMany({ where: inArray(schema.threads.parentId, ids) }),
    viewerId
      ? db.query.threadLikes.findMany({
          where: and(
            eq(schema.threadLikes.userId, viewerId),
            inArray(schema.threadLikes.threadId, ids),
          ),
        })
      : Promise.resolve([]),
    viewerId
      ? getFollowingIds(viewerId, authorIds)
      : Promise.resolve(new Set<string>()),
  ]);

  const likeCounts = new Map<string, number>();
  for (const like of likeRows) {
    likeCounts.set(like.threadId, (likeCounts.get(like.threadId) ?? 0) + 1);
  }
  const replyCounts = new Map<string, number>();
  for (const reply of replyRows) {
    if (!reply.parentId) continue;
    replyCounts.set(reply.parentId, (replyCounts.get(reply.parentId) ?? 0) + 1);
  }
  const likedIds = new Set(viewerLikes.map((l) => l.threadId));

  return rows.map((row) => ({
    ...row,
    likeCount: likeCounts.get(row.id) ?? 0,
    replyCount: replyCounts.get(row.id) ?? 0,
    likedByViewer: likedIds.has(row.id),
    authorFollowedByViewer: followingIds.has(row.authorId),
  }));
}

/** Runs a `where`-filtered, offset-paginated query for thread rows (with
 * author), attaches counts, and reports whether there's another page —
 * the one page-fetching shape every list below shares. Fetches
 * `pageSize + 1` rows to answer "is there more?" without a second COUNT
 * query, then trims back down to `pageSize`. */
async function paginatedThreads(
  where: NonNullable<Parameters<typeof db.query.threads.findMany>[0]>["where"],
  {
    cursor,
    pageSize,
    viewerId,
  }: { cursor: number; pageSize: number; viewerId?: string },
) {
  const rows = await db.query.threads.findMany({
    where,
    with: { author: true },
    orderBy: [desc(schema.threads.createdAt)],
    limit: pageSize + 1,
    offset: cursor,
  });

  const hasMore = rows.length > pageSize;
  const page = rows.slice(0, pageSize);
  const items = await withCounts(page, viewerId);

  return { items, nextCursor: hasMore ? cursor + pageSize : null };
}

/** Just the raw row — for the edit page, which only needs `body`/`imageUrl`
 * and an ownership check, not the author join or like/reply counts every
 * other query here attaches. */
export async function getThreadById(threadId: string) {
  if (!isValidId(threadId)) return null;
  return db.query.threads.findFirst({ where: eq(schema.threads.id, threadId) });
}

export async function getFeedThreads(viewerId?: string, cursor = 0) {
  return paginatedThreads(isNull(schema.threads.parentId), {
    cursor,
    pageSize: FEED_PAGE_SIZE,
    viewerId,
  });
}

// Sanity cap on how far up the reply chain to walk — nothing about the
// data model bounds it, this just guarantees the loop below terminates
// even against a pathological/corrupt chain.
const MAX_ANCESTOR_DEPTH = 50;

/** Walks `parentId` up from `threadId`, root-first — the thread(s) this
 * one is a reply to, however many levels deep. Empty for a top-level
 * thread. Used to show the reply chain *above* the thread you're
 * viewing, not the replies below it (see `getThreadReplies`). */
async function findThreadWithAuthor(threadId: string) {
  return db.query.threads.findFirst({
    where: eq(schema.threads.id, threadId),
    with: { author: true },
  });
}

export async function getThreadAncestors(threadId: string, viewerId?: string) {
  if (!isValidId(threadId)) return withCounts([], viewerId);

  const current = await db.query.threads.findFirst({
    where: eq(schema.threads.id, threadId),
    columns: { parentId: true },
  });

  const ancestors: NonNullable<
    Awaited<ReturnType<typeof findThreadWithAuthor>>
  >[] = [];

  let parentId = current?.parentId ?? null;
  while (parentId && ancestors.length < MAX_ANCESTOR_DEPTH) {
    const parent = await findThreadWithAuthor(parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    parentId = parent.parentId;
  }

  return withCounts(ancestors, viewerId);
}

export async function getThread(threadId: string, viewerId?: string) {
  if (!isValidId(threadId)) return null;

  const thread = await db.query.threads.findFirst({
    where: eq(schema.threads.id, threadId),
    with: { author: true },
  });
  if (!thread) return null;
  const [withCountsThread] = await withCounts([thread], viewerId);
  return withCountsThread;
}

/**
 * A thread's direct replies, sorted "recent" (newest first, a plain
 * column order) or "top" (most-liked first). "Top" can't reuse the
 * `orderBy: [desc(createdAt)]` + `withCounts` pattern the other lists use
 * — the like count it needs to sort by doesn't exist as a column, so
 * ordering has to happen in SQL against a `count()` aggregate *before*
 * paginating, not in JS after the fact. Both branches still funnel
 * through `withCounts` for the actual row data, so a "top" reply and a
 * "recent" reply always report identical counts.
 */
export async function getThreadReplies(
  threadId: string,
  {
    sort = "recent",
    cursor = 0,
    viewerId,
  }: { sort?: ReplySort; cursor?: number; viewerId?: string } = {},
) {
  if (!isValidId(threadId)) return { items: [], nextCursor: null };

  if (sort === "recent") {
    return paginatedThreads(eq(schema.threads.parentId, threadId), {
      cursor,
      pageSize: REPLIES_PAGE_SIZE,
      viewerId,
    });
  }

  const likeCount = sql<number>`count(${schema.threadLikes.id})`.as(
    "like_count",
  );
  const ranked = await db
    .select({ id: schema.threads.id, likeCount })
    .from(schema.threads)
    .leftJoin(
      schema.threadLikes,
      eq(schema.threadLikes.threadId, schema.threads.id),
    )
    .where(eq(schema.threads.parentId, threadId))
    .groupBy(schema.threads.id)
    .orderBy(desc(likeCount), desc(schema.threads.createdAt))
    .limit(REPLIES_PAGE_SIZE + 1)
    .offset(cursor);

  const hasMore = ranked.length > REPLIES_PAGE_SIZE;
  const orderedIds = ranked.slice(0, REPLIES_PAGE_SIZE).map((r) => r.id);
  if (orderedIds.length === 0) return { items: [], nextCursor: null };

  const rows = await db.query.threads.findMany({
    where: inArray(schema.threads.id, orderedIds),
    with: { author: true },
  });
  // `inArray` doesn't preserve order — re-sort to match the ranked list.
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = orderedIds
    .map((id) => byId.get(id))
    .filter((r) => r !== undefined);

  const items = await withCounts(ordered, viewerId);
  return { items, nextCursor: hasMore ? cursor + REPLIES_PAGE_SIZE : null };
}

export async function getUserThreads(
  userId: string,
  viewerId?: string,
  cursor = 0,
) {
  return paginatedThreads(
    and(eq(schema.threads.authorId, userId), isNull(schema.threads.parentId)),
    { cursor, pageSize: PROFILE_TAB_PAGE_SIZE, viewerId },
  );
}

export async function getUserReplies(
  userId: string,
  viewerId?: string,
  cursor = 0,
) {
  return paginatedThreads(
    and(
      eq(schema.threads.authorId, userId),
      isNotNull(schema.threads.parentId),
    ),
    { cursor, pageSize: PROFILE_TAB_PAGE_SIZE, viewerId },
  );
}
