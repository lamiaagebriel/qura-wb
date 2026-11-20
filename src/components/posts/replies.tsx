"use client";

import { createContext, use, useRef, useState, type ReactNode } from "react";

import { ComposerBar, SignedOutBar } from "@/components/composer-bar";
import { ReplyForm } from "@/components/forms/reply-form";
import {
  BubbleChatIcon,
  HugeiconsIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "@/components/icons";
import { ReviewText } from "@/components/profile/review-text";
import { ConfirmSheet } from "@/components/sheets/confirm-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { useAction } from "@/hooks/use-action";
import { categoryOf } from "@/lib/categories";
import { timeAgo } from "@/lib/format";
import { useLocale } from "@/lib/i18n/provider";
import { inLocale } from "@/lib/localized";
import type { Post } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { deletePost, votePost } from "@/server/actions/posts";

type Editing = { id: string; body: string } | null;

type Composer = {
  signedIn: boolean;
  /** Your reply the bar is editing, if any. */
  editing: Editing;
  edit: (reply: Post) => void;
  stopEditing: () => void;
};

const ComposerContext = createContext<Composer | null>(null);

const useComposer = () => {
  const composer = use(ComposerContext);
  if (!composer) throw new Error("Inside <ReplyComposer> only");
  return composer;
};

/**
 * A post's replies, written like comments (like the reviews screen): the
 * list, then a message bar pinned to the bottom (on the keyboard while
 * typing) — your photo and a rounded field whose send button shows once
 * there's text. Your replies get Edit — the bar takes it, "Editing your
 * reply" with × — and Delete (confirmed). Signed out, the bar opens the
 * sign-in sheet.
 */
export function ReplyComposer({
  postId,
  me,
  children,
}: {
  postId: string;
  /** The signed-in user (undefined: signed out). */
  me?: { name: string; avatarUrl: string | null };
  children: ReactNode;
}) {
  const { t } = useLocale();
  const [editing, setEditing] = useState<Editing>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const composer: Composer = {
    signedIn: !!me,
    editing,
    edit: (reply) => {
      setEditing({ id: reply.id, body: reply.body });
      // Focus in the same tap, so iOS brings up the keyboard.
      requestAnimationFrame(() => field.current?.focus());
    },
    stopEditing: () => setEditing(null),
  };

  return (
    <ComposerContext value={composer}>
      {children}
      <ComposerBar>
        {me ? (
          <ReplyForm
            // A fresh form each time editing starts or stops.
            key={editing?.id ?? "new"}
            postId={postId}
            editing={editing}
            me={me}
            fieldRef={field}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <SignedOutBar icon={BubbleChatIcon} label={t("Write a reply")} />
        )}
      </ComposerBar>
    </ComposerContext>
  );
}

/** The replies as a comment thread: no cards, no dividers. Inside `ReplyComposer`. */
export function ReplyList({ replies }: { replies: Post[] }) {
  return (
    <ul className="flex flex-col">
      {replies.map((reply) => (
        <li key={reply.id}>
          <ReplyItem reply={reply} />
        </li>
      ))}
    </ul>
  );
}

/**
 * One reply, like a comment: photo, then name · age and the text (long ones
 * cut, with "more"). Yours is marked "You" and gets Edit · Delete; others'
 * get the helpful vote.
 */
function ReplyItem({ reply }: { reply: Post }) {
  const { t, locale } = useLocale();
  const { editing } = useComposer();
  const { author } = reply;
  const name = author.type === "business" ? inLocale(author.name, locale) : author.name;
  const category = author.type === "business" ? categoryOf(author.category) : undefined;

  return (
    <article
      aria-label={t("Reply")}
      className={cn("-mx-4 flex gap-3 px-4 py-3 transition-colors", editing?.id === reply.id && "bg-muted")}
    >
      <Avatar className="size-9 shrink-0">
        {author.image && <AvatarImage src={author.image} alt="" />}
        <AvatarFallback>
          {category ? <HugeiconsIcon icon={category.icon} /> : name}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex min-w-0 items-center gap-1.5 text-xs">
          <bdi dir="auto" className="truncate font-semibold">
            {name}
          </bdi>
          {reply.mine && (
            <Badge variant="secondary" className="h-4.5 px-1.5">
              {t("You")}
            </Badge>
          )}
          <time dateTime={reply.createdAt.toISOString()} className="shrink-0 text-muted-foreground">
            {timeAgo(reply.createdAt, locale)}
          </time>
        </p>
        <ReviewText text={reply.body} />
        {reply.mine ? <MyReplyActions reply={reply} /> : <ReplyVotes reply={reply} />}
      </div>
    </article>
  );
}

/** "Edit · Delete" under your reply, like your review's. */
function MyReplyActions({ reply }: { reply: Post }) {
  const { run, t } = useAction();
  const { edit, editing, stopEditing } = useComposer();
  const [confirming, setConfirming] = useState(false);
  const link = cn(buttonVariants({ variant: "ghost" }), "h-11 px-2 font-semibold text-muted-foreground");

  return (
    <>
      <div className="-ms-2 flex items-center">
        <button type="button" onClick={() => edit(reply)} className={link}>
          {t("Edit")}
        </button>
        <button type="button" onClick={() => setConfirming(true)} className={link}>
          {t("Delete")}
        </button>
      </div>
      <ConfirmSheet
        open={confirming}
        onOpenChange={setConfirming}
        title={t("Delete this reply?")}
        description={t("This can't be undone.")}
        confirmLabel={t("Delete")}
        destructive
        onConfirm={async () => {
          await run(() => deletePost(reply.id), {
            success: "Reply deleted",
            onDone: () => editing?.id === reply.id && stopEditing(),
          });
        }}
      />
    </>
  );
}

/** Helpful / not helpful on someone else's reply, with its score. */
function ReplyVotes({ reply }: { reply: Post }) {
  const { run, t } = useAction();
  const { locale } = useLocale();
  const { signedIn } = useComposer();
  const { open: signIn } = useAuthSheet();
  const [vote, setVote] = useState(reply.myVote);
  // The score without the viewer's own vote, so toggling stays in sync.
  const others = reply.score - reply.myVote;

  const cast = async (value: 1 | -1) => {
    if (!signedIn) return signIn();
    const before = vote;
    const next = vote === value ? 0 : value;
    setVote(next);
    await run(() => votePost(reply.id, next), { refresh: false, onError: () => setVote(before) });
  };

  return (
    <div className="-ms-3 flex items-center text-muted-foreground">
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-11 rounded-full", vote === 1 && "text-primary")}
        aria-label={t("Helpful")}
        aria-pressed={vote === 1}
        onClick={() => cast(1)}
      >
        <HugeiconsIcon icon={ThumbsUpIcon} className={cn(vote === 1 && "fill-current/20")} />
      </Button>
      <span aria-label={t("Score")} className="min-w-4 text-center text-xs font-semibold tabular-nums">
        {(others + vote).toLocaleString(locale)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-11 rounded-full", vote === -1 && "text-destructive")}
        aria-label={t("Not helpful")}
        aria-pressed={vote === -1}
        onClick={() => cast(-1)}
      >
        <HugeiconsIcon icon={ThumbsDownIcon} />
      </Button>
    </div>
  );
}
