import "server-only";

import {
  and,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  sql,
  type SQL,
} from "drizzle-orm";

import { db, schema } from "@/db";
import type { CityId } from "@/db/schema/cities";
import type { ThreadCategory } from "@/db/schema/threads";
import { isValidId } from "@/lib/id";
import { getFollowingIds } from "@/lib/profile/queries";

const FEED_PAGE_SIZE = 20;
const REPLIES_PAGE_SIZE = 20;
const PROFILE_TAB_PAGE_SIZE = 20;

// A post only gets marked unhelpful once it's actually been seen by
// enough people to mean something — one early downvote on a brand-new
// post would otherwise flag it outright. 40% is deliberately below a
// simple majority: on a "is this actually useful to the city" vote,
// a large-but-not-majority chunk of the community calling a post out
// is already a strong enough signal to warn readers, without requiring
// the post be *more* downvoted than upvoted to react to it at all.
export const THREAD_UNHELPFUL_MIN_VOTES = 5;
export const THREAD_UNHELPFUL_DOWN_RATIO = 0.4;

export type ReplySort = "top" | "recent";

export type FeedSort = "relevant" | "latest";

/** Every paginated list here uses a plain numeric offset as its cursor —
 * simple, and good enough at this scale. Not exposed as a real "cursor"
 * (an opaque token) because nothing about these lists needs one yet. */
export type Page<T> = { items: T[]; nextCursor: number | null };

/** Attaches reply/vote counts (and, if `viewerId` is given, whether they
 * saved each thread, voted on it, and follow its author) to a flat list
 * of threads — shared by every list view so the feed, a profile's tabs,
 * and a thread's reply list never compute this differently. Saves are
 * private, so unlike votes there's no public count to fetch — only ever
 * "did *this* viewer save it," one query instead of two. */
async function withCounts<
  T extends { id: string; authorId: string; author: { ownerId: string | null } },
>(rows: T[], viewerId?: string) {
  if (rows.length === 0) {
    return [] as (T & {
      replyCount: number;
      savedByViewer: boolean;
      authorFollowedByViewer: boolean;
      authorOwnedByViewer: boolean;
      upvoteCount: number;
      downvoteCount: number;
      viewerVote: 1 | -1 | null;
      markedUnhelpful: boolean;
    })[];
  }
  const ids = rows.map((r) => r.id);
  const authorIds = [...new Set(rows.map((r) => r.authorId))];

  const [replyRows, viewerSaves, followingIds, voteRows, viewerVotes] =
    await Promise.all([
      db.query.threads.findMany({ where: inArray(schema.threads.parentId, ids) }),
      viewerId
        ? db.query.threadSaves.findMany({
            where: and(
              eq(schema.threadSaves.userId, viewerId),
              inArray(schema.threadSaves.threadId, ids),
            ),
            columns: { threadId: true },
          })
        : Promise.resolve([]),
      viewerId
        ? getFollowingIds(viewerId, authorIds)
        : Promise.resolve(new Set<string>()),
      db.query.threadVotes.findMany({
        where: inArray(schema.threadVotes.threadId, ids),
        columns: { threadId: true, value: true },
      }),
      viewerId
        ? db.query.threadVotes.findMany({
            where: and(
              eq(schema.threadVotes.userId, viewerId),
              inArray(schema.threadVotes.threadId, ids),
            ),
            columns: { threadId: true, value: true },
          })
        : Promise.resolve([]),
    ]);

  const replyCounts = new Map<string, number>();
  for (const reply of replyRows) {
    if (!reply.parentId) continue;
    replyCounts.set(reply.parentId, (replyCounts.get(reply.parentId) ?? 0) + 1);
  }
  const savedIds = new Set(viewerSaves.map((s) => s.threadId));

  const upvoteCounts = new Map<string, number>();
  const downvoteCounts = new Map<string, number>();
  for (const vote of voteRows) {
    const counts = vote.value > 0 ? upvoteCounts : downvoteCounts;
    counts.set(vote.threadId, (counts.get(vote.threadId) ?? 0) + 1);
  }
  const viewerVoteByThread = new Map(
    viewerVotes.map((v) => [v.threadId, v.value > 0 ? 1 : (-1 as 1 | -1)]),
  );

  return rows.map((row) => {
    const upvoteCount = upvoteCounts.get(row.id) ?? 0;
    const downvoteCount = downvoteCounts.get(row.id) ?? 0;
    const totalVotes = upvoteCount + downvoteCount;
    return {
      ...row,
      replyCount: replyCounts.get(row.id) ?? 0,
      savedByViewer: savedIds.has(row.id),
      authorFollowedByViewer: followingIds.has(row.authorId),
      // The author row's own `ownerId` is already on hand (it came in via
      // `with: { author: true }`), so unlike `authorFollowedByViewer` this
      // needs no extra query — a business's thread is "yours" if you're
      // the one who owns that business profile.
      authorOwnedByViewer: viewerId != null && row.author.ownerId === viewerId,
      upvoteCount,
      downvoteCount,
      viewerVote: viewerVoteByThread.get(row.id) ?? null,
      markedUnhelpful:
        totalVotes >= THREAD_UNHELPFUL_MIN_VOTES &&
        downvoteCount / totalVotes >= THREAD_UNHELPFUL_DOWN_RATIO,
    };
  });
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

/** Just the raw row — for the edit page, which only needs `body`/`images`
 * and an ownership check, not the author join or like/reply counts every
 * other query here attaches. */
export async function getThreadById(threadId: string) {
  if (!isValidId(threadId)) return null;
  return db.query.threads.findFirst({ where: eq(schema.threads.id, threadId) });
}

/** Same shape as `paginatedThreads`, but ordered by net helpful votes
 * (upvotes minus downvotes) instead of recency — shared by "top" replies
 * and the "relevant" feed sort, the two places ranking by vote score
 * matters. Net vote score doesn't exist as a column, so the ranking has
 * to happen in SQL against a `sum()` aggregate *before* paginating, not
 * in JS after the fact — see `getThreadReplies`'s own note on this. */
async function rankedThreads(
  where: SQL,
  {
    cursor,
    pageSize,
    viewerId,
  }: { cursor: number; pageSize: number; viewerId?: string },
) {
  const netVotes = sql<number>`coalesce(sum(${schema.threadVotes.value}), 0)`.as(
    "net_votes",
  );
  const ranked = await db
    .select({ id: schema.threads.id, netVotes })
    .from(schema.threads)
    .leftJoin(
      schema.threadVotes,
      eq(schema.threadVotes.threadId, schema.threads.id),
    )
    .where(where)
    .groupBy(schema.threads.id)
    .orderBy(desc(netVotes), desc(schema.threads.createdAt))
    .limit(pageSize + 1)
    .offset(cursor);

  const hasMore = ranked.length > pageSize;
  const orderedIds = ranked.slice(0, pageSize).map((r) => r.id);
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
  return { items, nextCursor: hasMore ? cursor + pageSize : null };
}

/**
 * The home feed, "relevant" (highest net helpful votes first) or
 * "latest" (newest first) — mirrors `getThreadReplies`'s Top/Recent
 * split, just at feed scope instead of one thread's replies. Scoped to
 * one city (`getActiveCity`) — this is the one list that's actually "the
 * whole app's content for the city you're looking at"; a thread's own
 * page, its replies, and a profile's tabs are deliberately left
 * unfiltered so a permalink or a profile still works if you're currently
 * browsing a different city than the content it shows. `category`
 * narrows further to one `ThreadCategory` — omitted (or `"all"`) shows
 * every category mixed together, same as today.
 */
export async function getFeedThreads(
  city: CityId,
  viewerId?: string,
  cursor = 0,
  sort: FeedSort = "relevant",
  category?: ThreadCategory,
) {
  const where = and(
    isNull(schema.threads.parentId),
    eq(schema.threads.city, city),
    category ? eq(schema.threads.category, category) : undefined,
  );

  if (sort === "latest") {
    return paginatedThreads(where, {
      cursor,
      pageSize: FEED_PAGE_SIZE,
      viewerId,
    });
  }

  return rankedThreads(where!, {
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
 * column order) or "top" (highest net helpful votes first — see
 * `rankedThreads`). Both branches still funnel through `withCounts` for
 * the actual row data, so a "top" reply and a "recent" reply always
 * report identical counts.
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

  return rankedThreads(eq(schema.threads.parentId, threadId), {
    cursor,
    pageSize: REPLIES_PAGE_SIZE,
    viewerId,
  });
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
