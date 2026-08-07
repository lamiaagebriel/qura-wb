import type { Metadata } from "next";

import { ThreadList } from "@/components/thread-list";
import { getCurrentUser } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";
import { loadMoreFeedAction } from "@/lib/threads/actions/load-more";
import { getFeedThreads } from "@/lib/threads/queries";

import { FeedHeader } from "./feed-header";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return {
    title: `${t("Feed")} — Qura`,
    description: t("Find trusted businesses and services around you."),
  };
}

export default async function FeedPage() {
  const [user, { t }] = await Promise.all([getCurrentUser(), getLocale()]);
  const { items, nextCursor } = await getFeedThreads(user?.id);

  return (
    <div className="flex flex-col">
      <FeedHeader title={t("Search people")} />

      <div className="flex flex-col gap-2 py-4">
        <ThreadList
          initialItems={items}
          initialCursor={nextCursor}
          fetchMore={loadMoreFeedAction}
          currentUserId={user?.id}
          emptyLabel={t("No threads yet. Be the first to post.")}
        />
      </div>
    </div>
  );
}
