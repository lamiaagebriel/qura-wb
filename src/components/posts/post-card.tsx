"use client";

import { PostImages } from "@/components/posts/post-images";
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
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { categoryOf } from "@/lib/categories";
import { timeAgo } from "@/lib/format";
import { useAction } from "@/hooks/use-action";
import { useLocale } from "@/lib/i18n/provider";
import { inLocale } from "@/lib/localized";
import { dayOf, type Post } from "@/lib/posts";
import { href } from "@/lib/routes";
import { useShare } from "@/lib/share";
import { cn } from "@/lib/utils";

import { POST_TYPE_META } from "./type-meta";
import { DeletePostButton } from "./delete-post-button";
import { savePost, votePost } from "@/server/actions/posts";

/**
 * A post as a card: who posted it (the business, or the person), its type,
 * the text (and an offer's price / last day), then helpful votes, replies,
 * save and share (yours are edited from the post's page). `compact`: a short
 * card for home's list, the whole card opening the post.
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

  // A short card in home's latest posts.
  if (compact) {
    return (
      <StackLink
        href={link}
        className="flex w-full flex-col gap-2.5 rounded-2xl bg-card p-4 text-start ring-1 ring-foreground/5 transition-[scale] active:scale-[0.98] motion-reduce:transition-none"
      >
        <AuthorRow post={post} />
        <p
          dir="auto"
          className="line-clamp-2 text-sm leading-relaxed whitespace-pre-line"
        >
          {post.body}
        </p>
        {post.images.length > 0 && (
          // Inside the card's link: a still preview (the photos open on the post).
          <span className="relative block h-40 overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- photos come from the bucket, any size */}
            <img
              src={post.images[0]}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
            {post.images.length > 1 && (
              <span className="absolute end-2 bottom-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white tabular-nums">
                +{post.images.length - 1}
              </span>
            )}
          </span>
        )}
        <OfferDetails post={post} />
        <Counts post={post} />
      </StackLink>
    );
  }

  return (
    <article
      aria-label={reply ? t("Reply") : t(POST_TYPE_META[post.type].label)}
      // A feed row, like Threads / X: no box, its own side padding (lists run
      // edge to edge, so the hairline does too), a hairline under each post
      // (not the last); the avatar in its own column, everything else beside it.
      className="flex gap-3 border-b border-border/60 px-4 pb-3 [li:last-child>&]:border-0"
    >
      <AuthorAvatar post={post} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <AuthorLine post={post} type={!reply} />
        {linked ? (
          <StackLink
            href={link}
            className="-mx-1 -my-0.5 rounded-lg px-1 py-0.5 text-start"
          >
            <Body post={post} />
          </StackLink>
        ) : (
          <Body post={post} />
        )}
        {!reply && <PostImages images={post.images} className="mt-1" />}
        {!reply && <OfferDetails post={post} />}
        <PostActions
          post={post}
          signedIn={signedIn}
          link={link}
          reply={reply}
        />
      </div>
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
          <HugeiconsIcon icon={ThumbsUpIcon} className="size-3.5" />
          <span className="tabular-nums">
            {post.score.toLocaleString(locale)}
          </span>
          <span className="sr-only">{t("Helpful")}</span>
        </span>
      )}
      {post.replyCount > 0 && (
        <span className="flex items-center gap-1">
          <HugeiconsIcon icon={BubbleChatIcon} className="size-3.5" />
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
            <HugeiconsIcon icon={category.icon} className="size-5" />
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
          <HugeiconsIcon icon={meta.icon} className="size-3" />
          {t(meta.label)}
        </Badge>
      )}
    </div>
  );
}

/** The author's photo (a business without one: its category's icon). */
function AuthorAvatar({ post }: { post: Post }) {
  const { locale } = useLocale();
  const { author } = post;
  const name =
    author.type === "business" ? inLocale(author.name, locale) : author.name;
  const category =
    author.type === "business" ? categoryOf(author.category) : undefined;
  return (
    <Avatar className="size-10 shrink-0">
      {author.image && <AvatarImage src={author.image} alt="" />}
      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
        {category ? (
          <HugeiconsIcon icon={category.icon} className="size-5" />
        ) : (
          name.slice(0, 1)
        )}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * One line, like Threads: name (verified tick) · time — the @handle is on
 * the profile, so the name has the room. The type sits small at the end.
 */
function AuthorLine({ post, type = true }: { post: Post; type?: boolean }) {
  const { t, locale } = useLocale();
  const { author } = post;
  const meta = POST_TYPE_META[post.type];
  const name =
    author.type === "business" ? inLocale(author.name, locale) : author.name;
  return (
    <div className="flex min-w-0 items-center gap-1 text-sm">
      <bdi dir="auto" className="min-w-0 shrink truncate font-semibold">
        {name}
      </bdi>
      {author.type === "business" && author.verified && (
        <HugeiconsIcon
          icon={CheckmarkBadge01Icon}
          role="img"
          aria-label={t("Verified")}
          className="size-4 shrink-0 text-sky-500"
        />
      )}
      <span aria-hidden className="text-muted-foreground">
        ·
      </span>
      <time
        dateTime={post.createdAt.toISOString()}
        className="shrink-0 text-xs text-muted-foreground"
        suppressHydrationWarning
      >
        {timeAgo(post.createdAt, locale)}
      </time>
      {type && (
        <Badge
          className={cn(
            "ms-auto h-5 shrink-0 gap-1 border-0 px-1.5 text-[0.6875rem]",
            meta.tint,
          )}
        >
          <HugeiconsIcon icon={meta.icon} className="size-3" />
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
          <HugeiconsIcon icon={DiscountTag01Icon} className="size-3.5" />
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
          <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
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
  const { run } = useAction();
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
    await run(() => votePost(post.id, next), {
      refresh: false,
      onError: () => setVote(before),
    });
  };

  const toggleSave = async () => {
    if (!signedIn) return signIn();
    const next = !saved;
    setSaved(next);
    await run(() => savePost(post.id, next), {
      success: next ? "Saved" : "Removed from saved",
      refresh: false,
      onError: () => setSaved(!next),
    });
  };

  // Soft pills (button groups): 36px tall, the ::before stretches the tap
  // area to 44px; a quick press; muted until it's yours.
  const pill = "rounded-full bg-muted/70 dark:bg-muted/50";
  const action =
    "relative h-9 min-w-10 gap-1.5 rounded-none px-3 text-muted-foreground transition-[color,scale] before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] hover:bg-foreground/5 active:scale-90 motion-reduce:transition-none [&_svg]:size-[1.125rem]";
  const score = others + vote;

  return (
    <div className="flex items-center gap-2 pt-0.5">
      {/* Helpful: up · score · down in one pill, tinted by your vote. */}
      <ButtonGroup
        aria-label={t("Helpful")}
        className={cn(
          "overflow-visible",
          pill,
          vote === 1 && "bg-emerald-500/10 dark:bg-emerald-500/15",
          vote === -1 && "bg-destructive/10",
        )}
      >
        <Button
          variant="ghost"
          className={cn(
            action,
            "rounded-s-full! pe-1.5",
            vote === 1 && "text-emerald-600 dark:text-emerald-400",
          )}
          aria-label={t("Helpful")}
          aria-pressed={vote === 1}
          disabled={own}
          onClick={() => castVote(1)}
        >
          <HugeiconsIcon
            icon={ThumbsUpIcon}
            className={cn(vote === 1 && "fill-current/20")}
          />
        </Button>
        <span
          aria-label={t("Score")}
          className={cn(
            "flex min-w-4 items-center justify-center text-[0.8125rem] font-semibold tabular-nums",
            vote === 1
              ? "text-emerald-600 dark:text-emerald-400"
              : vote === -1
                ? "text-destructive"
                : "text-muted-foreground",
          )}
        >
          {score.toLocaleString(locale)}
        </span>
        <Button
          variant="ghost"
          className={cn(
            action,
            "rounded-e-full! ps-1.5",
            vote === -1 && "text-destructive",
          )}
          aria-label={t("Not helpful")}
          aria-pressed={vote === -1}
          disabled={own}
          onClick={() => castVote(-1)}
        >
          <HugeiconsIcon
            icon={ThumbsDownIcon}
            className={cn(vote === -1 && "fill-current/20")}
          />
        </Button>
      </ButtonGroup>
      {!reply && (
        <Button
          variant="ghost"
          className={cn(action, pill)}
          render={<StackLink href={link} />}
          nativeButton={false}
          aria-label={t.plural(post.replyCount, {
            one: "{{count}} reply",
            other: "{{count}} replies",
          })}
        >
          <HugeiconsIcon icon={BubbleChatIcon} />
          {post.replyCount > 0 && (
            <span className="text-[0.8125rem] font-medium tabular-nums">
              {post.replyCount.toLocaleString(locale)}
            </span>
          )}
        </Button>
      )}
      <span className="flex-1" />

      {!reply && (
        <ButtonGroup className={cn("overflow-visible", pill)}>
          <Button
            variant="ghost"
            className={cn(action, "rounded-s-full!", saved && "text-primary")}
            aria-label={t("Save")}
            aria-pressed={saved}
            onClick={toggleSave}
          >
            <HugeiconsIcon
              icon={Bookmark01Icon}
              className={cn(saved && "fill-current")}
            />
          </Button>
          <ButtonGroupSeparator className="h-4! self-center bg-foreground/15" />
          <Button
            variant="ghost"
            className={cn(action, "rounded-e-full!")}
            aria-label={t("Share")}
            onClick={() => share({ text: post.body.slice(0, 120), url: link })}
          >
            <HugeiconsIcon icon={Share08Icon} />
          </Button>
        </ButtonGroup>
      )}
      {/* Your reply: edit (its own screen) or delete it right here. */}
      {reply && post.mine && (
        <span className="flex items-center">
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-11 rounded-full text-muted-foreground"
            render={
              <StackLink href={href("editPost", { params: { id: post.id } })} />
            }
            nativeButton={false}
            aria-label={t("Edit reply")}
          >
            <HugeiconsIcon icon={PencilEdit02Icon} />
          </Button>
          <DeletePostButton id={post.id} reply icon />
        </span>
      )}
    </div>
  );
}
