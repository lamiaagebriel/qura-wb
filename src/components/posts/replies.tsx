"use client";

import { CommentItem } from "@/components/comment-item";
import { EditDeleteGroup } from "@/components/edit-delete-group";
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
import { Button } from "@/components/ui/button";
import { useAuthSheet } from "@/components/auth/auth-sheet";
import { useAction } from "@/hooks/use-action";
import { categoryOf } from "@/lib/categories";
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
  const name =
    author.type === "business" ? inLocale(author.name, locale) : author.name;
  const category =
    author.type === "business" ? categoryOf(author.category) : undefined;

  return (
    <CommentItem
      label={t("Reply")}
      name={name}
      image={author.image}
      fallback={category ? <HugeiconsIcon icon={category.icon} /> : undefined}
      you={reply.mine ? t("You") : undefined}
      createdAt={reply.createdAt}
      locale={locale}
      highlighted={editing?.id === reply.id}
      className="-mx-4 px-4"
      actions={reply.mine && <MyReplyActions reply={reply} />}
      footer={!reply.mine && <ReplyVotes reply={reply} />}
    >
      <ReviewText text={reply.body} />
    </CommentItem>
  );
}

/** ✏️ | 🗑 on your reply's name line, like your review's. */
function MyReplyActions({ reply }: { reply: Post }) {
  const { run } = useAction();
  const { edit, editing, stopEditing } = useComposer();
  return (
    <EditDeleteGroup
      onEdit={() => edit(reply)}
      onDelete={() =>
        run(() => deletePost(reply.id), {
          success: "Reply deleted",
          onDone: () => editing?.id === reply.id && stopEditing(),
        })
      }
    />
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
    await run(() => votePost(reply.id, next), {
      refresh: false,
      onError: () => setVote(before),
    });
  };

  return (
    <div className="-ms-3 flex items-center text-muted-foreground">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "size-11 rounded-full",
          vote === 1 && "text-emerald-600 dark:text-emerald-400",
        )}
        aria-label={t("Helpful")}
        aria-pressed={vote === 1}
        onClick={() => cast(1)}
      >
        <HugeiconsIcon
          icon={ThumbsUpIcon}
          className={cn(vote === 1 && "fill-current/20")}
        />
      </Button>
      <span
        aria-label={t("Score")}
        className="min-w-4 text-center text-xs font-semibold tabular-nums"
      >
        {(others + vote).toLocaleString(locale)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "size-11 rounded-full",
          vote === -1 && "text-destructive",
        )}
        aria-label={t("Not helpful")}
        aria-pressed={vote === -1}
        onClick={() => cast(-1)}
      >
        <HugeiconsIcon icon={ThumbsDownIcon} />
      </Button>
    </div>
  );
}
