"use client";

import { useState } from "react";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import {
  Bookmark01Icon,
  PencilEdit02Icon,
  BubbleChatIcon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  DiscountTag01Icon,
  HugeiconsIcon,
  Share08Icon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { categoryOf } from "@/lib/categories";
import { timeAgo } from "@/lib/format";
import { useLocale } from "@/lib/i18n/provider";
import { inLocale } from "@/lib/localized";
import { dayOf, type Post } from "@/lib/posts";
import { href } from "@/lib/routes";
import { useShare } from "@/lib/share";
import { cn } from "@/lib/utils";

import { POST_TYPE_META } from "./type-meta";
import { DeletePostButton } from "./delete-post-button";
import { savePost, votePost } from "./post-actions";

/**
 * A post as a card: who posted it (the business, or the person), its type,
 * the text (and an offer's price / last day), then helpful votes, replies,
 * save and share (yours are edited from the post's page). `compact`: a fixed-width
 * card for the home rows, the whole card opening the post.
 */
export function PostCard({
  post,
  signedIn,
  compact = false,
  linked = true,
  reply = false,
}: {
  post: Post;
  signedIn: boolean;
  compact?: boolean;
  /** The text opens the post (off on its own page). */
  linked?: boolean;
  /** A reply under a post: no type, offer details, replies or share. */
  reply?: boolean;
}) {
  const { t } = useLocale();
  const link = href("post", { params: { id: post.id } });

  // A card in a sideways row (home's latest posts).
  if (compact) {
    return (
      <StackLink
        href={link}
        className="flex w-72 shrink-0 snap-start flex-col gap-3 rounded-2xl bg-card p-4 text-start ring-1 ring-foreground/5"
      >
        <AuthorRow post={post} />
        <p
          dir="auto"
          className="line-clamp-3 flex-1 text-sm leading-relaxed whitespace-pre-line"
        >
          {post.body}
        </p>
        <OfferDetails post={post} />
        <Counts post={post} />
      </StackLink>
    );
  }

  return (
    <article
      aria-label={reply ? t("Reply") : t(POST_TYPE_META[post.type].label)}
      className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/5"
    >
      <AuthorRow post={post} type={!reply} />
      {linked ? (
        <StackLink href={link} className="-m-1 rounded-lg p-1 text-start">
          <Body post={post} />
        </StackLink>
      ) : (
        <Body post={post} />
      )}
      {!reply && <OfferDetails post={post} />}
      <PostActions post={post} signedIn={signedIn} link={link} reply={reply} />
    </article>
  );
}

/** Helpful score and replies, small — only the ones that aren't zero. */
function Counts({ post }: { post: Post }) {
  const { t, locale } = useLocale();
  if (!post.score && !post.replyCount) return null;
  return (
    <span className="flex items-center gap-4 text-xs text-muted-foreground">
      {post.score !== 0 && (
        <span className="flex items-center gap-1">
          <HugeiconsIcon
            icon={ThumbsUpIcon}
            strokeWidth={2}
            className="size-3.5"
          />
          <span className="tabular-nums">
            {post.score.toLocaleString(locale)}
          </span>
          <span className="sr-only">{t("Helpful")}</span>
        </span>
      )}
      {post.replyCount > 0 && (
        <span className="flex items-center gap-1">
          <HugeiconsIcon
            icon={BubbleChatIcon}
            strokeWidth={2}
            className="size-3.5"
          />
          {t.plural(post.replyCount, {
            one: "{{count}} reply",
            other: "{{count}} replies",
          })}
        </span>
      )}
    </span>
  );
}

function Body({ post }: { post: Post }) {
  const { t } = useLocale();
  return (
    <p
      dir="auto"
      className="text-[0.9375rem] leading-relaxed whitespace-pre-line"
    >
      {post.body}
      {post.edited && (
        <span className="text-xs text-muted-foreground"> · {t("edited")}</span>
      )}
    </p>
  );
}

/** Avatar, name (verified tick) · time, and the type badge at the end. */
function AuthorRow({ post, type = true }: { post: Post; type?: boolean }) {
  const { t, locale } = useLocale();
  const { author } = post;
  const meta = POST_TYPE_META[post.type];
  const name =
    author.type === "business" ? inLocale(author.name, locale) : author.name;
  const category =
    author.type === "business" ? categoryOf(author.category) : undefined;

  return (
    <div className="flex items-center gap-3">
      <Avatar size="lg" className="shrink-0">
        {author.image && <AvatarImage src={author.image} alt="" />}
        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
          {category ? (
            <HugeiconsIcon
              icon={category.icon}
              strokeWidth={1.75}
              className="size-5"
            />
          ) : (
            name.slice(0, 1)
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-1 text-sm font-semibold">
          <bdi dir="auto" className="truncate">
            {name}
          </bdi>
          {author.type === "business" && author.verified && (
            <HugeiconsIcon
              icon={CheckmarkBadge01Icon}
              strokeWidth={2}
              role="img"
              aria-label={t("Verified")}
              className="size-3.5 shrink-0 text-primary"
            />
          )}
        </span>
        <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          <bdi dir="ltr" className="truncate">
            @{author.username}
          </bdi>
          <span aria-hidden>·</span>
          <time
            dateTime={post.createdAt.toISOString()}
            className="shrink-0"
            suppressHydrationWarning
          >
            {timeAgo(post.createdAt, locale)}
          </time>
        </span>
      </div>
      {type && (
        <Badge className={cn("shrink-0 gap-1 border-0", meta.tint)}>
          <HugeiconsIcon icon={meta.icon} strokeWidth={2} className="size-3" />
          {t(meta.label)}
        </Badge>
      )}
    </div>
  );
}

/** An offer's price and last day (`data`), when set. */
function OfferDetails({ post }: { post: Post }) {
  const { t, locale } = useLocale();
  const { price, endsOn } = post.data;
  if (!price && !endsOn) return null;
  const { ended } = post;
  return (
    <div className="flex flex-wrap gap-2 text-xs font-medium">
      {price && (
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-400">
          <HugeiconsIcon
            icon={DiscountTag01Icon}
            strokeWidth={2}
            className="size-3.5"
          />
          <bdi dir="auto">{price}</bdi>
        </span>
      )}
      {endsOn && (
        <span
          suppressHydrationWarning
          className={cn(
            "flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground",
            ended && "line-through",
          )}
        >
          <HugeiconsIcon
            icon={Clock01Icon}
            strokeWidth={2}
            className="size-3.5"
          />
          {ended
            ? t("Ended")
            : t("Until {{date}}", {
                date: dayOf(endsOn).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "short",
                }),
              })}
        </span>
      )}
    </div>
  );
}

/** Helpful votes, replies, save and share. */
function PostActions({
  post,
  signedIn,
  link,
  reply,
}: {
  post: Post;
  signedIn: boolean;
  link: string;
  reply: boolean;
}) {
  const { t, locale } = useLocale();
  const { open: signIn } = useAuthSheet();
  const share = useShare();
  const [vote, setVote] = useState(post.myVote);
  const [saved, setSaved] = useState(post.saved);
  // The score without the viewer's own vote, so toggling stays in sync.
  const others = post.score - post.myVote;

  // Your own post: its score only (people vote on others' posts).
  const own = post.mine;
  const castVote = async (value: 1 | -1) => {
    if (!signedIn) return signIn();
    if (own) return;
    const before = vote;
    const next = vote === value ? 0 : value;
    setVote(next);
    const result = await votePost(post.id, next);
    if (!result.ok) {
      setVote(before);
      toast.add({ title: t(result.error), type: "error" });
    }
  };

  const toggleSave = async () => {
    if (!signedIn) return signIn();
    const next = !saved;
    setSaved(next);
    const result = await savePost(post.id, next);
    if (!result.ok) {
      setSaved(!next);
      toast.add({ title: t(result.error), type: "error" });
      return;
    }
    toast.add({ title: next ? t("Saved") : t("Removed from saved") });
  };

  // Icon buttons: 44px tap targets, pulled in so the row lines up.
  const iconButton = "size-11 rounded-full text-muted-foreground";

  return (
    <div className="-mx-2 -mb-2 flex items-center">
      <div className="flex items-center rounded-full">
        <Button
          variant="ghost"
          className={cn(iconButton, vote === 1 && "text-primary")}
          aria-label={t("Helpful")}
          aria-pressed={vote === 1}
          disabled={own}
          onClick={() => castVote(1)}
        >
          <HugeiconsIcon
            icon={ThumbsUpIcon}
            strokeWidth={2}
            className={cn("size-5", vote === 1 && "fill-current/20")}
          />
        </Button>
        <span
          aria-label={t("Score")}
          className="min-w-4 text-center text-sm font-semibold tabular-nums"
        >
          {(others + vote).toLocaleString(locale)}
        </span>
        <Button
          variant="ghost"
          className={cn(iconButton, vote === -1 && "text-destructive")}
          aria-label={t("Not helpful")}
          aria-pressed={vote === -1}
          disabled={own}
          onClick={() => castVote(-1)}
        >
          <HugeiconsIcon
            icon={ThumbsDownIcon}
            strokeWidth={2}
            className="size-5"
          />
        </Button>
      </div>

      {!reply && (
        <Button
          variant="ghost"
          className="h-11 gap-1.5 rounded-full px-3 text-sm text-muted-foreground"
          render={<StackLink href={link} />}
          nativeButton={false}
        >
          <HugeiconsIcon
            icon={BubbleChatIcon}
            strokeWidth={2}
            className="size-5"
          />
          <span className="tabular-nums">
            {post.replyCount.toLocaleString(locale)}
          </span>
          <span className="sr-only">{t("Replies")}</span>
        </Button>
      )}

      <span className="flex-1" />

      {!reply && (
        <Button
          variant="ghost"
          className={cn(iconButton, saved && "text-primary")}
          aria-label={t("Save")}
          aria-pressed={saved}
          onClick={toggleSave}
        >
          <HugeiconsIcon
            icon={Bookmark01Icon}
            strokeWidth={2}
            className={cn("size-5", saved && "fill-current")}
          />
        </Button>
      )}
      {!reply && (
        <Button
          variant="ghost"
          className={iconButton}
          aria-label={t("Share")}
          onClick={() => share({ text: post.body.slice(0, 120), url: link })}
        >
          <HugeiconsIcon
            icon={Share08Icon}
            strokeWidth={2}
            className="size-5"
          />
        </Button>
      )}
      {/* Your reply: edit (its own screen) or delete it right here. */}
      {reply && post.mine && (
        <>
          <Button
            variant="ghost"
            className={iconButton}
            render={
              <StackLink href={href("editPost", { params: { id: post.id } })} />
            }
            nativeButton={false}
            aria-label={t("Edit reply")}
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              strokeWidth={2}
              className="size-5"
            />
          </Button>
          <DeletePostButton id={post.id} reply icon />
        </>
      )}
    </div>
  );
}
