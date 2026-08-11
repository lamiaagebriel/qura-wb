"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Comment01Icon,
  Delete02Icon,
  Edit02Icon,
  FavouriteIcon,
  MoreHorizontal,
  Share01Icon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthPrompt } from "@/components/auth-prompt";
import { Button } from "@/components/ui/button";
import { useThreadComposer } from "@/components/new-thread-composer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThreadImageCarousel } from "@/components/thread-image-carousel";
import { followAction } from "@/lib/auth/actions/follow";
import { copyToClipboard } from "@/lib/clipboard";
import { deleteThreadAction } from "@/lib/threads/actions/delete";
import {
  likeThreadAction,
  unlikeThreadAction,
} from "@/lib/threads/actions/like";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";
import { cn, formatCompactRelativeTime } from "@/lib/utils";

export type ThreadCardData = {
  id: string;
  body: string;
  images: string[];
  createdAt: Date;
  author: { id: string; name: string; username: string; image: string | null };
  likeCount: number;
  replyCount: number;
  likedByViewer: boolean;
  authorFollowedByViewer: boolean;
  // True when the author is a business profile owned by the viewer —
  // "owns this thread" the same way `currentUserId === thread.author.id`
  // does for a thread posted directly as yourself.
  authorOwnedByViewer: boolean;
};

// Matches `Avatar`'s own `size-8`/`size-6` (32px/24px) — used to size the
// connector line below, which has to know the exact avatar height to
// start right at its bottom edge.
const AVATAR_SIZE_PX = { default: 32, reply: 24, ancestor: 32 } as const;

export function ThreadCard({
  thread,
  currentUserId,
  className,
  linkToDetail = true,
  // `"reply"` renders a visibly smaller avatar — the at-a-glance cue that
  // this card is nested under the thread above it rather than a top-level
  // post of its own, same idea as shrinking indentation in a comment tree.
  variant = "default",
  // Draws a line from this avatar's bottom edge down through the
  // padding/border gap into the *next* card's avatar, chaining this
  // thread's replies into one visible hierarchy instead of a flat list.
  showConnector = false,
}: {
  thread: ThreadCardData;
  currentUserId?: string;
  className?: string;
  linkToDetail?: boolean;
  variant?: "default" | "reply" | "ancestor";
  showConnector?: boolean;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { promptSignIn } = useAuthPrompt();
  const { openEdit } = useThreadComposer();
  const [liked, setLiked] = useState(thread.likedByViewer);
  const [likeCount, setLikeCount] = useState(thread.likeCount);
  const [deleted, setDeleted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(
    thread.authorFollowedByViewer,
  );
  const [body, setBody] = useState(thread.body);
  const [images, setImages] = useState(thread.images);
  const [isPending, startTransition] = useTransition();

  // Picks up a fresher `body`/`images` when the server re-fetches this
  // thread (e.g. `router.refresh()` after the edit above, or someone else's
  // concurrent edit) — done during render, same pattern as
  // `useInfiniteList`, so it never shows a stale frame first.
  const [prevServerBody, setPrevServerBody] = useState(thread.body);
  const [prevServerImages, setPrevServerImages] = useState(thread.images);
  if (thread.body !== prevServerBody) {
    setPrevServerBody(thread.body);
    setBody(thread.body);
  }
  if (thread.images !== prevServerImages) {
    setPrevServerImages(thread.images);
    setImages(thread.images);
  }

  function toggleLike() {
    if (!currentUserId) {
      promptSignIn();
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const result = next
        ? await likeThreadAction(thread.id)
        : await unlikeThreadAction(thread.id);
      if (!result.success) {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
        handleAppError(result.error);
      }
    });
  }

  function handleFollow() {
    if (!currentUserId) {
      promptSignIn();
      return;
    }
    setIsFollowingAuthor(true);
    startTransition(async () => {
      const result = await followAction(thread.author.id);
      if (!result.success) {
        setIsFollowingAuthor(false);
        handleAppError(result.error);
      }
    });
  }

  async function handleShare() {
    const url = `${window.location.origin}/thread/${thread.id}`;

    // Prefer the native share sheet where it exists (most mobile
    // browsers) — falls through to clipboard on desktop or if the user
    // dismisses it without picking anything (`AbortError`, not a real
    // failure).
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    const succeeded = await copyToClipboard(url);
    if (!succeeded) {
      toast.error(url);
      return;
    }
    toast.success(t("Link copied to clipboard."));
  }

  function handleDelete() {
    setConfirmDelete(false);
    // `linkToDetail={false}` only ever means one thing: this card *is*
    // the thread `/thread/[id]` is currently focused on, not a reply or
    // an ancestor in its list. Deleting that one leaves nothing left for
    // this page to show, so back out of it instead of rendering an
    // increasingly empty page in place. Everywhere else (the feed, a
    // reply list, ...) the card just disappears from the list it's in.
    const isFocusedPage = !linkToDetail;
    if (!isFocusedPage) setDeleted(true);

    startTransition(async () => {
      const result = await deleteThreadAction(thread.id);
      if (!result.success) {
        setDeleted(false);
        handleAppError(result.error);
        return;
      }
      if (isFocusedPage) router.back();
    });
  }

  if (deleted) return null;

  const isOwner =
    currentUserId === thread.author.id || thread.authorOwnedByViewer;
  const showFollowBadge = !isOwner && !isFollowingAuthor;
  const avatarSize = variant === "reply" ? "default" : "lg";
  const content = (
    <div className="flex gap-3 py-3">
      <div className="relative z-0 shrink-0">
        <Link
          href={`/profile/${thread.author.username}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar size={avatarSize}>
            {thread.author.image && (
              <AvatarImage src={thread.author.image} alt={thread.author.name} />
            )}
            <AvatarFallback>{thread.author.name}</AvatarFallback>
          </Avatar>
        </Link>

        {/* Sibling of the `Link`, not nested inside it — a `<button>`
            inside an `<a>` is invalid HTML, and in practice made this
            genuinely hard to hit: taps that missed the (visually tiny)
            badge by a pixel fell through to the profile link underneath
            it instead of doing nothing. As its own element, positioned
            on top instead of inside, a tap here can only ever mean
            "follow" — and the padding gives it a real touch target well
            past the visible circle. */}
        {showFollowBadge && (
          <button
            type="button"
            aria-label={t("Follow")}
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              handleFollow();
            }}
            className={cn(
              "text-primary-foreground absolute top-4 -right-1 flex size-6 items-center justify-center p-1 disabled:opacity-50",
              avatarSize === "lg" && "top-6",
            )}
          >
            <span className="bg-primary ring-background flex size-4 items-center justify-center rounded-full ring-2">
              <HugeiconsIcon
                icon={Add01Icon}
                strokeWidth={3}
                className="size-2.5"
              />
            </span>
          </button>
        )}

        {/* Bridges into the *next* card's avatar across the padding/border
            gap between them — `top` starts right at this avatar's own
            bottom edge, `bottom` reaches 25px past this row's own bottom
            edge (12px bottom padding + 1px border + 12px of the next
            card's top padding), landing exactly on the next avatar's top
            with no visible seam. */}
        {showConnector && (
          <span
            aria-hidden
            className="bg-border absolute start-1/2 mt-auto h-[77%] w-0.5 -translate-x-1/2"
            style={{ top: AVATAR_SIZE_PX[variant], bottom: -25 }}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/profile/${thread.author.username}`}
              onClick={(e) => e.stopPropagation()}
              dir="ltr"
              className="text-foreground text-[13.5px] font-semibold hover:underline"
            >
              {thread.author.username}
            </Link>
            <span className="text-muted-foreground text-xs">
              {formatCompactRelativeTime(thread.createdAt, locale)}
            </span>
            {isOwner && (
              <button
                type="button"
                aria-label={t("More options")}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(true);
                }}
                className="text-muted-foreground hover:text-foreground ms-auto"
              >
                <HugeiconsIcon icon={MoreHorizontal} className="size-4" />
              </button>
            )}
          </div>

          <p
            className={cn(
              "text-foreground text-[14px] leading-relaxed whitespace-pre-line",
              (variant === "ancestor" || variant === "reply") && "line-clamp-3",
            )}
          >
            {body}
          </p>

          <ThreadImageCarousel images={images} />
        </div>

        <div
          className={cn(
            "text-muted-foreground z-10 mt-1 flex items-center gap-4",
            !linkToDetail && "-ml-10",
          )}
        >
          <button
            type="button"
            aria-label={liked ? t("Unlike") : t("Like")}
            onClick={(e) => {
              e.stopPropagation();
              toggleLike();
            }}
            className="flex items-center gap-1"
          >
            <HugeiconsIcon
              icon={FavouriteIcon}
              className={cn(
                "size-4",
                liked && "fill-destructive text-destructive",
              )}
            />
            {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
          </button>
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Comment01Icon} className="size-4" />
            {thread.replyCount > 0 && (
              <span className="text-xs">{thread.replyCount}</span>
            )}
          </span>
          <button
            type="button"
            aria-label={t("Share")}
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="flex items-center gap-1"
          >
            <HugeiconsIcon icon={Share01Icon} className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const wrapped = !linkToDetail ? (
    <div className={cn("border-border/60 relative border-b", className)}>
      {content}
    </div>
  ) : (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/thread/${thread.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/thread/${thread.id}`);
      }}
      className={cn(
        "border-border/60 hover:bg-muted/30 relative block cursor-pointer border-b transition-colors",
        className,
      )}
    >
      {content}
    </div>
  );

  return (
    <>
      {wrapped}

      {isOwner && (
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>{t("Thread options")}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col px-4 pb-6">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openEdit({
                    threadId: thread.id,
                    body,
                    images,
                    user: thread.author,
                    onSaved: (values) => {
                      setBody(values.body);
                      setImages(values.images);
                    },
                  });
                }}
                className="border-border/60 flex items-center gap-3 border-b py-3.5"
              >
                <HugeiconsIcon
                  icon={Edit02Icon}
                  className="text-foreground size-5 shrink-0"
                />
                <span className="text-foreground text-[14.5px] font-medium">
                  {t("Edit")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmDelete(true);
                }}
                className="flex items-center gap-3 py-3.5"
              >
                <HugeiconsIcon
                  icon={Delete02Icon}
                  className="text-destructive size-5 shrink-0"
                />
                <span className="text-destructive text-[14.5px] font-medium">
                  {t("Delete")}
                </span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {isOwner && (
        <Sheet open={confirmDelete} onOpenChange={setConfirmDelete}>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>{t("Delete thread?")}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 px-4 pb-6">
              <p className="text-muted-foreground -mt-2 mb-1 text-[13px] leading-relaxed">
                {t("This can't be undone.")}
              </p>
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={handleDelete}
              >
                {t("Delete")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(false)}
              >
                {t("Cancel")}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
