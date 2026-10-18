import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { Bookmark01Icon } from "@/components/icons";
import { Screen } from "@/components/navigation/screen";
import { PostCard } from "@/components/posts/post-card";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { StatusScreen } from "@/components/status-screen";
import { requireUser } from "@/lib/auth/session";
import { savedPosts } from "@/lib/data/posts";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Saved posts"), robots: { index: false, follow: true } };
}

/** The posts you bookmarked, last saved first. Only you see them. */
export default async function SavedPostsPage() {
  const [{ t }, user] = await Promise.all([
    getTranslations(),
    requireUser(href("saved")),
  ]);
  const posts = await savedPosts(user.id);

  return (
    <Screen>
      <AppHeader title={t("Saved posts")} back={href("profile")} />
      <PullToRefresh>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-2 pb-8">
          {posts.length ? (
            <ul className="flex flex-col gap-3">
              {posts.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} signedIn />
                </li>
              ))}
            </ul>
          ) : (
            <StatusScreen
              icon={Bookmark01Icon}
              title={t("No saved posts")}
              description={t("Tap the bookmark on a post to keep it here.")}
              inline
            />
          )}
        </main>
      </PullToRefresh>
    </Screen>
  );
}
