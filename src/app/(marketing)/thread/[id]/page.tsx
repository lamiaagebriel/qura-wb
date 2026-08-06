import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ThreadCard } from "@/components/thread-card";
import { getCurrentUser } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";
import {
  getThread,
  getThreadAncestors,
  getThreadReplies,
} from "@/lib/threads/queries";
import { cn } from "@/lib/utils";

import { ThreadDetail } from "./thread-detail";
import { ThreadReplies } from "./thread-replies";

type ThreadPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: ThreadPageProps): Promise<Metadata> {
  const { id } = await params;
  const thread = await getThread(id);
  const { t } = await getLocale();
  return {
    title: thread ? `${thread.author.username} — Qura` : t("Thread"),
  };
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { id } = await params;
  const [user, { t }] = await Promise.all([getCurrentUser(), getLocale()]);

  // `viewerId` has to reach every one of these — otherwise the focused
  // thread and its ancestor chain would silently report `likedByViewer`/
  // `authorFollowedByViewer` as always `false` while the replies below
  // them (which do pass it) show the real state, an inconsistency that's
  // invisible until you're signed in and looking at your own likes/follows.
  const [thread, ancestors, { items: replies, nextCursor }] =
    await Promise.all([
      getThread(id, user?.id),
      getThreadAncestors(id, user?.id),
      getThreadReplies(id, { viewerId: user?.id }),
    ]);

  if (!thread) notFound();

  return (
    <div className={cn("container flex flex-col gap-2 pb-20")}>
      <PageHeader title={t("Thread")} />

      {/* The chain this thread is a reply to — connected down into the
          thread being viewed, not into its own replies below. That's the
          hierarchy that actually matters on this page: what you're
          replying to, not what replied to you. */}
      {ancestors.map((ancestor) => (
        <ThreadCard
          variant="ancestor"
          key={ancestor.id}
          thread={ancestor}
          currentUserId={user?.id}
          showConnector
          className="border-b-0"
        />
      ))}

      {/* This page has no `BottomNav` (it lives outside the `(tabs)`
          route group), so nothing else competes for the bottom of the
          screen — pin the reply box there instead of leaving it wherever
          the reply list happens to end. `pb-20` above reserves room for
          it so the last reply isn't hidden underneath. */}
      <ThreadDetail
        thread={thread}
        currentUserId={user?.id}
        user={user}
        placeholder={t("Reply")}
      />

      <ThreadReplies
        threadId={thread.id}
        initialItems={replies}
        initialCursor={nextCursor}
        currentUserId={user?.id}
        emptyLabel={t("No replies yet.")}
      />
    </div>
  );
}
