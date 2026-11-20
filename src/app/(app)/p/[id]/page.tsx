import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { HugeiconsIcon, PencilEdit02Icon } from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import { Screen } from "@/components/navigation/screen";
import { POST_TYPE_META } from "@/components/posts/type-meta";
import { ReportButton } from "@/components/moderation/moderation-controls";
import { PostCard } from "@/components/posts/post-card";
import { ReplyComposer, ReplyList } from "@/components/posts/replies";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { getPost, getReplies } from "@/server/queries/posts";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** The start of a post, for its title and description. */
const excerpt = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;

export async function generateMetadata({
  params,
}: PageProps<"/p/[id]">): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id, undefined);
  if (!post) return {};
  return {
    title: excerpt(post.body, 60),
    description: excerpt(post.body, 160),
    alternates: { canonical: href("post", { params: { id } }) },
  };
}

/**
 * One post with its replies (oldest first), written like comments: the
 * thread, then a message bar pinned to the bottom to reply (like reviews).
 * Your own post has a pencil in the header (edit / delete).
 */
export default async function PostPage({ params }: PageProps<"/p/[id]">) {
  const [{ t }, { id }, session] = await Promise.all([
    getTranslations(),
    params,
    getSession(),
  ]);
  const userId = session?.user.id;
  const post = await getPost(id, userId);
  if (!post) notFound();
  const replies = await getReplies(post.id, userId);

  return (
    <Screen>
      <AppHeader
        title={t(POST_TYPE_META[post.type].label)}
        back={href("posts", { query: { type: post.type } })}
        action={
          post.mine ? (
            <StackLink
              href={href("editPost", { params: { id: post.id } })}
              aria-label={t("Edit post")}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "size-11 rounded-full",
              )}
            >
              <HugeiconsIcon
                icon={PencilEdit02Icon}
                className="size-5"
              />
            </StackLink>
          ) : (
            <ReportButton kind="post" target={post.id} signedIn={!!userId} />
          )
        }
      />
      <PullToRefresh>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 pt-2 pb-8">
          <PostCard post={post} signedIn={!!userId} linked={false} />
          <ReplyComposer
            postId={post.id}
            me={session ? { name: session.user.name, avatarUrl: session.user.image ?? null } : undefined}
          >
            <section aria-labelledby="replies" className="flex flex-col gap-1 pt-3">
              <h2 id="replies" className="text-lg font-bold">
                {t("Replies")}
              </h2>
              {replies.length ? (
                <ReplyList replies={replies} />
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("No replies yet. Be the first!")}
                </p>
              )}
            </section>
          </ReplyComposer>
        </main>
      </PullToRefresh>
    </Screen>
  );
}
