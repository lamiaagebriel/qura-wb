import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { Comment01Icon } from "@/components/icons";
import { Screen } from "@/components/navigation/screen";
import { PostCard } from "@/components/posts/post-card";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { StatusScreen } from "@/components/status-screen";
import { requireUser } from "@/lib/auth/session";
import { myPosts } from "@/lib/data/posts";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("My posts"), robots: { index: false, follow: true } };
}

/** The posts you wrote, newest first (hidden ones too, with why). */
export default async function MyPostsPage() {
  const [{ t }, user] = await Promise.all([
    getTranslations(),
    requireUser(href("myPosts")),
  ]);
  const posts = await myPosts(user.id);

  return (
    <Screen>
      <AppHeader title={t("My posts")} back={href("profile")} />
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
              icon={Comment01Icon}
              title={t("No posts yet")}
              description={t("What you post shows up here.")}
              inline
            />
          )}
        </main>
      </PullToRefresh>
    </Screen>
  );
}
