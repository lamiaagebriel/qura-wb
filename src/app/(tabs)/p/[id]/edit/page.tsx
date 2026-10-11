import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { DeletePostButton } from "@/components/posts/delete-post-button";
import { PostForm } from "@/components/posts/post-form";
import { requireUser } from "@/lib/auth/session";
import { getMyPost } from "@/lib/data/posts";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Edit post"), robots: { index: false, follow: true } };
}

/**
 * Editing your post's text (and its type's fields) or your reply's text,
 * or deleting it. A reply goes back to — and, deleted, leaves for — the
 * post it replies to.
 */
export default async function EditPostPage({
  params,
}: PageProps<"/p/[id]/edit">) {
  const [{ t }, { id }] = await Promise.all([getTranslations(), params]);
  const user = await requireUser(href("editPost", { params: { id } }));
  const post = await getMyPost(id, user.id);
  if (!post) notFound();
  const reply = post.replyTo;
  const back = href("post", { params: { id: reply ?? id } });

  return (
    <Screen>
      <AppHeader title={reply ? t("Edit reply") : t("Edit post")} back={back} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-8">
        <PostForm businesses={[]} editing={post} back={back} />
        <DeletePostButton
          id={post.id}
          reply={!!reply}
          then={reply ? back : href("posts", { query: { type: post.type } })}
        />
      </main>
    </Screen>
  );
}
