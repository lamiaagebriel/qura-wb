import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { ThreadList } from "@/components/thread-list";
import { getGuardedUser } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";
import { loadMoreLikedThreadsAction } from "@/lib/threads/actions/load-more";
import { getLikedThreads } from "@/lib/threads/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Favorites")} — Qura` };
}

export default async function FavoritesPage() {
  const user = await getGuardedUser();
  if (!user) redirect("/login");

  const { t } = await getLocale();
  const { items, nextCursor } = await getLikedThreads(user.id);

  return (
    <div className="flex flex-col gap-2 py-4">
      <AppHeader title={t("Favorites")} showBack={false} />

      <ThreadList
        initialItems={items}
        initialCursor={nextCursor}
        fetchMore={loadMoreLikedThreadsAction}
        currentUserId={user.id}
        emptyLabel={t("Threads you like will show up here.")}
      />
    </div>
  );
}
