import { ThreadList } from "@/components/thread-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLocale } from "@/lib/i18n/actions";
import {
  loadMoreUserRepliesAction,
  loadMoreUserThreadsAction,
} from "@/lib/threads/actions/load-more";
import { getUserReplies, getUserThreads } from "@/lib/threads/queries";

/** Shared by `account/page.tsx` (own profile) and `profile/[username]/page.tsx`
 * (someone else's) so both read the exact same Threads/Replies data. */
export async function ProfileTabs({
  userId,
  currentUserId,
  // Distance from the viewport top the tab bar sticks at — 0 for
  // `account/page.tsx` (its own header isn't sticky, so the tabs are the
  // first thing pinned), or the height of `PageHeader` (`h-12.5` = 50px)
  // for `profile/[username]/page.tsx`, which already has one sticky above
  // this — without the offset the two would stack on top of each other.
  stickyTop = 0,
}: {
  userId: string;
  currentUserId?: string;
  stickyTop?: number;
}) {
  const [{ t }, threads, replies] = await Promise.all([
    getLocale(),
    getUserThreads(userId, currentUserId),
    getUserReplies(userId, currentUserId),
  ]);

  return (
    <Tabs defaultValue="threads" className="w-full gap-0">
      <TabsList
        variant="line"
        style={{ top: stickyTop }}
        className="bg-background/95 sticky z-30 container grid h-9 w-full grid-cols-2 border-b px-4 backdrop-blur-md"
      >
        <TabsTrigger value="threads">{t("Threads")}</TabsTrigger>
        <TabsTrigger value="replies">{t("Replies")}</TabsTrigger>
      </TabsList>
      <TabsContent value="threads">
        <ThreadList
          initialItems={threads.items}
          initialCursor={threads.nextCursor}
          fetchMore={loadMoreUserThreadsAction.bind(null, userId)}
          currentUserId={currentUserId}
          emptyLabel={t("No threads yet.")}
        />
      </TabsContent>
      <TabsContent value="replies">
        <ThreadList
          initialItems={replies.items}
          initialCursor={replies.nextCursor}
          fetchMore={loadMoreUserRepliesAction.bind(null, userId)}
          currentUserId={currentUserId}
          emptyLabel={t("No replies yet.")}
        />
      </TabsContent>
    </Tabs>
  );
}
