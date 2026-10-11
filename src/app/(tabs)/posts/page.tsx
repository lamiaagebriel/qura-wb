import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { Message01Icon } from "@/components/icons";
import { Screen } from "@/components/navigation/screen";
import { NewPostButton } from "@/components/posts/new-post-button";
import { PostFeed } from "@/components/posts/post-feed";
import { PostTypeFilter } from "@/components/posts/post-type-filter";
import { POST_TYPE_META } from "@/components/posts/type-meta";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { StatusScreen } from "@/components/status-screen";
import { getSession } from "@/lib/auth/session";
import { cityOf } from "@/lib/cities";
import { getCity } from "@/lib/city-server";
import { postsIn, typeCounts } from "@/lib/data/posts";
import { getTranslations } from "@/lib/i18n/server";
import { isPostType, POST_TYPES } from "@/lib/posts";
import { href } from "@/lib/routes";

export async function generateMetadata({
  searchParams,
}: PageProps<"/posts">): Promise<Metadata> {
  const [{ t }, { type }] = await Promise.all([
    getTranslations(),
    searchParams,
  ]);
  const filter = isPostType(type) ? type : null;
  return {
    title: filter ? t(POST_TYPE_META[filter].plural) : t("Posts"),
    alternates: {
      canonical: href("posts", { query: { type: filter } }),
    },
  };
}

/**
 * Every post in the visitor's city — all types, from people and
 * businesses — newest first, loading more as you scroll. `?type=` filters
 * it (the pill; Home's chips link here with it). The + writes a post
 * (of the filtered type).
 */
export default async function PostsPage({ searchParams }: PageProps<"/posts">) {
  const [{ t, locale }, { type }, session, city] = await Promise.all([
    getTranslations(),
    searchParams,
    getSession(),
    getCity(),
  ]);
  const filter = isPostType(type) ? type : null;
  const userId = session?.user.id;
  const [first, counts] = await Promise.all([
    postsIn(city, userId, { type: filter }),
    typeCounts(city),
  ]);
  const types = POST_TYPES.filter((t) => counts[t]).map((t) => ({
    type: t,
    count: counts[t],
  }));
  const cityName = cityOf(city)!.name[locale];
  const meta = filter ? POST_TYPE_META[filter] : null;

  return (
    <Screen>
      <AppHeader
        title={t("Posts")}
        large
        back={href("home")}
        action={
          <NewPostButton

            signedIn={!!userId}
            type={filter ?? undefined}
          />
        }
      />
      <PullToRefresh>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 pt-1 pb-8">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm text-muted-foreground">
              {t("In {{city}}", { city: cityName })}
            </p>
            <PostTypeFilter types={types} value={filter} />
          </div>
          {first.posts.length ? (
            <PostFeed
              // A fresh first page (refresh, a filter, a new post) starts over.
              key={`${filter}:${first.posts[0].id}:${first.posts.length}`}
              type={filter}
              first={first}
              signedIn={!!userId}
            />
          ) : (
            <StatusScreen
              icon={meta?.icon ?? Message01Icon}
              title={t("Nothing here yet")}
              description={t("Be the first to post in {{city}}.", {
                city: cityName,
              })}
              inline
            />
          )}
        </main>
      </PullToRefresh>
    </Screen>
  );
}
