import { BusinessBlockCard } from "@/components/business-block-card";
import { BusinessReviews } from "@/components/business-reviews";
import { ThreadList } from "@/components/thread-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  getBusinessRatingSummary,
  getBusinessReviews,
  getMyReview,
} from "@/lib/business/queries";
import { getLocale } from "@/lib/i18n/actions";
import {
  loadMoreUserRepliesAction,
  loadMoreUserThreadsAction,
} from "@/lib/threads/actions/load-more";
import { getUserReplies, getUserThreads } from "@/lib/threads/queries";
import type { BusinessCategory } from "@/db/schema";

/** Shared by `account/page.tsx` (own profile) and `profile/[username]/page.tsx`
 * (someone else's) so both read the exact same Threads/Replies data. */
export async function ProfileTabs({
  userId,
  currentUserId,
  // Distance from the viewport top the tab bar sticks at — 0 for
  // `account/page.tsx` (its own header isn't sticky, so the tabs are the
  // first thing pinned), or the height of `AppHeader` (`h-12.5` = 50px)
  // for `profile/[username]/page.tsx`, which already has one sticky above
  // this — without the offset the two would stack on top of each other.
  stickyTop = 0,
  // Only businesses that have set a category get an "Info" tab — a
  // regular user's profile stays Threads/Replies, unchanged.
  block,
  // Business profiles can only post — never reply — so a "Replies" tab on
  // one would always be empty. `isBusiness` drops that tab and swaps in
  // "Reviews" instead (any signed-in account can leave one, not just
  // followers), skipping the replies fetch entirely for a business.
  isBusiness = false,
  // Whether `currentUserId` is allowed to write/edit a review here — false
  // when signed out, and always false for the business's own owner (see
  // `upsertReviewAction`, which rejects that server-side regardless).
  canReview = false,
  // The signed-in viewer's own name/avatar, for the review composer —
  // same shape `ComposeBox` takes, since it's styled to match.
  viewer,
}: {
  userId: string;
  currentUserId?: string;
  stickyTop?: number;
  block?: { category: BusinessCategory; data: Record<string, unknown> } | null;
  isBusiness?: boolean;
  canReview?: boolean;
  viewer?: { name: string; image?: string | null } | null;
}) {
  const [{ t }, threads, replies, reviews, ratingSummary, myReview] =
    await Promise.all([
      getLocale(),
      getUserThreads(userId, currentUserId),
      isBusiness
        ? Promise.resolve({ items: [], nextCursor: null })
        : getUserReplies(userId, currentUserId),
      isBusiness
        ? getBusinessReviews(userId)
        : Promise.resolve({ items: [], nextCursor: null }),
      isBusiness
        ? getBusinessRatingSummary(userId)
        : Promise.resolve({ average: null, count: 0 }),
      isBusiness && currentUserId
        ? getMyReview(userId, currentUserId).then((r) => r ?? null)
        : Promise.resolve(null),
    ]);

  const tabCount = 2 + (block ? 1 : 0);

  return (
    // Keyed on `userId` — `ThreadList`'s `useInfiniteList` merges a fresh
    // server page onto whatever it already has client-side, which is
    // exactly right for "the same list got new data" but wrong for "this
    // is now a completely different person's threads" (switching active
    // identity on `/account` re-renders this in place via
    // `router.refresh()`, no navigation, so nothing else would reset the
    // old list's leftover client state). Changing `key` forces React to
    // remount instead of reconcile, which is the actual fix.
    <Tabs
      key={userId}
      defaultValue={block ? "info" : "threads"}
      className="w-full gap-0"
    >
      <TabsList
        variant="line"
        style={{ top: stickyTop }}
        className={cn(
          "bg-background/95 sticky z-30 container grid h-11! w-full border-b px-4 backdrop-blur-md",
          tabCount === 3 ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        {block && <TabsTrigger value="info">{t("Info")}</TabsTrigger>}
        <TabsTrigger value="threads">{t("Threads")}</TabsTrigger>
        {isBusiness ? (
          <TabsTrigger value="reviews">{t("Reviews")}</TabsTrigger>
        ) : (
          <TabsTrigger value="replies">{t("Replies")}</TabsTrigger>
        )}
      </TabsList>
      {block && (
        <TabsContent value="info">
          <BusinessBlockCard
            category={block.category}
            data={block.data}
            t={t}
          />
        </TabsContent>
      )}
      <TabsContent value="threads">
        <ThreadList
          initialItems={threads.items}
          initialCursor={threads.nextCursor}
          fetchMore={loadMoreUserThreadsAction.bind(null, userId)}
          currentUserId={currentUserId}
          emptyLabel={t("No threads yet.")}
        />
      </TabsContent>
      {isBusiness ? (
        <TabsContent value="reviews" className="container px-4 py-3">
          <BusinessReviews
            businessId={userId}
            initialItems={reviews.items}
            initialCursor={reviews.nextCursor}
            summary={ratingSummary}
            myReview={myReview}
            canReview={canReview}
            viewer={viewer}
          />
        </TabsContent>
      ) : (
        <TabsContent value="replies">
          <ThreadList
            initialItems={replies.items}
            initialCursor={replies.nextCursor}
            fetchMore={loadMoreUserRepliesAction.bind(null, userId)}
            currentUserId={currentUserId}
            emptyLabel={t("No replies yet.")}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
