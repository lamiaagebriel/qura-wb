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

  // Each entry is one tab — add/remove/reorder tabs here without touching
  // the `TabsList`/`TabsContent` wiring below. `condition` lets a tab drop
  // itself out entirely (e.g. "Info" only when there's a block to show).
  const tabs = [
    block && {
      value: "info",
      label: t("Info"),
      content: (
        <BusinessBlockCard category={block.category} data={block.data} />
      ),
    },
    {
      value: "threads",
      label: t("Threads"),
      content: (
        <ThreadList
          initialItems={threads.items}
          initialCursor={threads.nextCursor}
          fetchMore={loadMoreUserThreadsAction.bind(null, userId)}
          currentUserId={currentUserId}
          emptyLabel={t("No threads yet.")}
        />
      ),
    },
    isBusiness
      ? {
          value: "reviews",
          label: t("Reviews"),
          content: (
            <BusinessReviews
              businessId={userId}
              initialItems={reviews.items}
              initialCursor={reviews.nextCursor}
              summary={ratingSummary}
              myReview={myReview}
              canReview={canReview}
              viewer={viewer}
            />
          ),
        }
      : {
          value: "replies",
          label: t("Replies"),
          content: (
            <ThreadList
              initialItems={replies.items}
              initialCursor={replies.nextCursor}
              fetchMore={loadMoreUserRepliesAction.bind(null, userId)}
              currentUserId={currentUserId}
              emptyLabel={t("No replies yet.")}
            />
          ),
        },
  ].filter((tab): tab is Exclude<typeof tab, false | null | undefined> => !!tab);

  const gridColsClass =
    {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
    }[tabs.length] ?? "grid-cols-2";

  return (
    // Keyed on `userId` — `ThreadList`'s `useInfiniteList` merges a fresh
    // server page onto whatever it already has client-side, which is
    // exactly right for "the same list got new data" but wrong for "this
    // is now a completely different person's threads" (switching active
    // identity on `/account` re-renders this in place via
    // `router.refresh()`, no navigation, so nothing else would reset the
    // old list's leftover client state). Changing `key` forces React to
    // remount instead of reconcile, which is the actual fix.
    <Tabs key={userId} defaultValue={tabs[0].value} className="w-full gap-0">
      <TabsList
        variant="line"
        style={{ top: stickyTop }}
        className={cn(
          "bg-background/95 sticky z-30 container grid h-11! w-full border-b px-4 backdrop-blur-md",
          gridColsClass,
        )}
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
