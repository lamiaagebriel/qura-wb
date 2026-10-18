import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { PostForm } from "@/components/posts/post-form";
import { requireUser } from "@/lib/auth/session";
import { getCurrentPlace } from "@/lib/data/places";
import { postingBusinesses } from "@/lib/data/posts";
import { getTranslations } from "@/lib/i18n/server";
import { isPostType } from "@/lib/posts";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("New post"), robots: { index: false, follow: true } };
}

/**
 * Writing a post, as its own screen (the keyboard has the whole screen to
 * itself). `?type=` starts on that type — the + on a type's page.
 */
export default async function NewPostPage({
  searchParams,
}: PageProps<"/posts/new">) {
  const [{ t, locale }, { type }] = await Promise.all([
    getTranslations(),
    searchParams,
  ]);
  const start = isPostType(type) ? type : undefined;
  const parent = start
    ? href("posts", { query: { type: start } })
    : href("home");
  const user = await requireUser(href("newPost", { query: { type: start } }));
  const [businesses, place] = await Promise.all([
    postingBusinesses(user.id, locale),
    getCurrentPlace(),
  ]);

  return (
    <Screen>
      <AppHeader title={t("New post")} back={parent} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
        <PostForm
          me={{
            name: user.name,
            username: user.username,
            image: user.image ?? null,
          }}
          businesses={businesses}
          defaultKind={start}
          place={place}
          back={parent}
        />
      </main>
    </Screen>
  );
}
