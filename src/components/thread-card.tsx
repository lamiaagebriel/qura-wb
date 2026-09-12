"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert02Icon,
  BookmarkIcon,
  Comment01Icon,
  Delete02Icon,
  Edit02Icon,
  Loading03FreeIcons,
  MoreHorizontal,
  Share01Icon,
  ThumbsDownIcon,
  ThumbsUpIcon,
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
import type { ThreadCategory } from "@/db/schema";
import { followAction } from "@/lib/auth/actions/follow";
import { copyToClipboard } from "@/lib/clipboard";
import { deleteThreadAction } from "@/lib/threads/actions/delete";
import {
  saveThreadAction,
  unsaveThreadAction,
} from "@/lib/threads/actions/save";
import { THREAD_CATEGORY_META } from "@/lib/threads/categories";
import { setThreadOverride, useThreadOverride } from "@/lib/threads/overrides";
import { voteThreadAction } from "@/lib/threads/actions/vote";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";
import { cn, formatCompactRelativeTime } from "@/lib/utils";

export type ThreadCardData = {
  id: string;
  body: string;
  images: string[];
  createdAt: Date;
  // Only meaningful (and only ever shown) on a top-level thread — see
  // `THREAD_CATEGORY_META`. A reply always reports `"general"`, but the
  // `variant === "default"` check below is what actually keeps it off
  // reply/ancestor cards, not this value.
  category: ThreadCategory;
  author: { id: string; name: string; username: string; image: string | null };
  replyCount: number;
  // A private bookmark — never shown as a count, only ever "did *I* save
  // this," the same way it only ever means something to the viewer who
  // set it.
  savedByViewer: boolean;
  authorFollowedByViewer: boolean;
  // True when the author is a business profile owned by the viewer —
  // "owns this thread" the same way `currentUserId === thread.author.id`
  // does for a thread posted directly as yourself.
  authorOwnedByViewer: boolean;
  // "Is this post actually useful to the city" — separate from `saved`.
  // `markedUnhelpful` is the community-flag threshold from
  // `lib/threads/queries.ts` having been crossed; the post still shows
  // in full either way, just with a "Not helpful" label next to its
  // timestamp — a visible community signal, not a takedown.
  upvoteCount: number;
  downvoteCount: number;
  viewerVote: 1 | -1 | null;
  markedUnhelpful: boolean;
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
  // Set for a thread that's "posted" from the user's own point of view
  // but hasn't actually reached the server yet — its images are still
  // uploading in the background (see `new-thread-composer.tsx` and
  // `optimistic-posts.ts`). Rather than a separate look-alike card
  // component, this is the exact same `ThreadCard` with `thread.id` a
  // temporary local id and every real interaction (vote/save/follow/
  // reply/edit/delete/navigate) switched off — none of them mean
  // anything for a thread that doesn't exist server-side yet. The
  // vote/comment/save/share row is replaced with an upload indicator,
  // or (on failure) a "Delete"/"Keep as draft" choice.
  uploading,
}: {
  thread: ThreadCardData;
  currentUserId?: string;
  className?: string;
  linkToDetail?: boolean;
  variant?: "default" | "reply" | "ancestor";
  showConnector?: boolean;
  uploading?: { failed: boolean; onDelete: () => void; onKeepDraft: () => void };
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { promptSignIn } = useAuthPrompt();
  const { openEdit } = useThreadComposer();

  // Vote/save/follow state lives in a store shared across every mounted
  // copy of this thread's card (see `useThreadOverride`) instead of
  // local `useState` — so acting on the thread's own detail page also
  // updates its card back in the feed, even though that's a separate
  // `ThreadCard` instance Next's router cache is keeping alive in the
  // background, with no page reload or refetch involved.
  const override = useThreadOverride(thread.id);
  const saved = override.savedByViewer ?? thread.savedByViewer;
  const viewerVote =
    override.viewerVote !== undefined ? override.viewerVote : thread.viewerVote;
  const upvoteCount = override.upvoteCount ?? thread.upvoteCount;
  const downvoteCount = override.downvoteCount ?? thread.downvoteCount;
  const isFollowingAuthor =
    override.authorFollowedByViewer ?? thread.authorFollowedByViewer;

  const [deleted, setDeleted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [body, setBody] = useState(thread.body);
  const [images, setImages] = useState(thread.images);
  const [isPending, startTransition] = useTransition();

  // A swipe through the image carousel (or a text selection drag) starts
  // and ends inside the card, so it still reaches this `onClick` as a
  // plain click once the pointer settles — `stopPropagation` on the
  // carousel/buttons only covers *their own* clicks, not a drag that
  // began on them and released elsewhere. Tracking the pointer's start
  // position and only navigating when it never moved distinguishes an
  // actual tap from a swipe/selection, regardless of what it started on.
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const DRAG_THRESHOLD_PX = 8;

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

  function toggleSave() {
    if (!currentUserId) {
      promptSignIn();
      return;
    }
    const next = !saved;
    setThreadOverride(thread.id, { savedByViewer: next });
    startTransition(async () => {
      const result = next
        ? await saveThreadAction(thread.id)
        : await unsaveThreadAction(thread.id);
      if (!result.success) {
        setThreadOverride(thread.id, { savedByViewer: !next });
        handleAppError(result.error);
      }
    });
  }

  // Voting the same way again takes the vote back (matches
  // `voteThreadAction`'s own toggle behavior) — otherwise it either adds
  // a fresh vote or flips an opposite one, moving both counts at once.
  function castVote(value: 1 | -1) {
    if (!currentUserId) {
      promptSignIn();
      return;
    }
    const prevVote = viewerVote;
    const nextVote = prevVote === value ? null : value;
    let nextUpvoteCount = upvoteCount;
    let nextDownvoteCount = downvoteCount;
    if (prevVote === 1) nextUpvoteCount -= 1;
    if (prevVote === -1) nextDownvoteCount -= 1;
    if (nextVote === 1) nextUpvoteCount += 1;
    if (nextVote === -1) nextDownvoteCount += 1;
    setThreadOverride(thread.id, {
      viewerVote: nextVote,
      upvoteCount: nextUpvoteCount,
      downvoteCount: nextDownvoteCount,
    });

    startTransition(async () => {
      const result = await voteThreadAction(thread.id, value);
      if (!result.success) {
        setThreadOverride(thread.id, {
          viewerVote: prevVote,
          upvoteCount: thread.upvoteCount,
          downvoteCount: thread.downvoteCount,
        });
        handleAppError(result.error);
      }
    });
  }

  function handleFollow() {
    if (!currentUserId) {
      promptSignIn();
      return;
    }
    setThreadOverride(thread.id, { authorFollowedByViewer: true });
    startTransition(async () => {
      const result = await followAction(thread.author.id);
      if (!result.success) {
        setThreadOverride(thread.id, { authorFollowedByViewer: false });
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

  const isUploading = !!uploading;
  // No owner-only chrome (edit/delete menu, follow badge) for a thread
  // that isn't real yet — there's nothing to edit or delete server-side,
  // and following yourself makes no sense either.
  const isOwner =
    !isUploading &&
    (currentUserId === thread.author.id || thread.authorOwnedByViewer);
  const showFollowBadge = !isOwner && !isFollowingAuthor && !isUploading;
  // Never navigates to `/thread/[tempId]` — that page doesn't exist
  // until the real thread does.
  const effectiveLinkToDetail = linkToDetail && !isUploading;
  const avatarSize = variant === "reply" ? "default" : "lg";
  const content = (
    <div className="container py-3">
      {/* Only on a real top-level post, and only when it's actually
              worth calling out — "general" (the default/catch-all) would
              just be visual noise on most of the feed. */}
      {variant === "default" && thread.category !== "general" && (
        <span
          className={cn(
            // "flex w-fit shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[12.5px] font-medium disabled:opacity-50",
            "flex w-fit shrink-0 items-center gap-1 pb-1 text-[12.5px] font-medium disabled:opacity-50",
            THREAD_CATEGORY_META[thread.category].color.chipInactive,
          )}
          // className={cn(
          //   "mb-0.5 flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
          //   THREAD_CATEGORY_META[thread.category].color.chipActive,
          // )}
        >
          <HugeiconsIcon
            icon={THREAD_CATEGORY_META[thread.category].icon}
            className="size-4"
          />
          {t(THREAD_CATEGORY_META[thread.category].label)}
        </span>
      )}
      <div className="flex gap-2">
        <div className="relative z-0 shrink-0">
          <Link
            href={`/profile/${thread.author.username}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar size={avatarSize}>
              {thread.author.image && (
                <AvatarImage
                  src={thread.author.image}
                  alt={thread.author.name}
                />
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
                "text-primary-foreground absolute top-4 right-0 flex size-6 items-center justify-center p-1 disabled:opacity-50 rtl:right-4",
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
                className="text-foreground text-[13.5px] font-semibold hover:underline"
              >
                {thread.author.username}
              </Link>
              <span className="text-muted-foreground text-xs">
                {formatCompactRelativeTime(thread.createdAt, locale)}
              </span>
              {thread.markedUnhelpful && (
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <HugeiconsIcon icon={Alert02Icon} className="size-3" />
                  {t("Not helpful")}
                </span>
              )}
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
                (variant === "ancestor" || variant === "reply") &&
                  "line-clamp-3",
              )}
            >
              {body}
            </p>

            <div className="-mr-4 -ml-20 rtl:mx-0 rtl:-mr-20 rtl:-ml-4">
              <ThreadImageCarousel images={images} />
            </div>
          </div>

          {uploading ? (
            uploading.failed ? (
              <div className="border-border/60 flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                <span className="text-muted-foreground flex items-center gap-1.5 text-[12.5px]">
                  <HugeiconsIcon
                    icon={Alert02Icon}
                    className="text-destructive size-4 shrink-0"
                  />
                  {t("Couldn't post this thread.")}
                </span>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      uploading.onDelete();
                    }}
                  >
                    {t("Delete")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      uploading.onKeepDraft();
                    }}
                  >
                    {t("Keep as draft")}
                  </Button>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                <HugeiconsIcon
                  icon={Loading03FreeIcons}
                  strokeWidth={2.5}
                  className="size-3.5 animate-spin"
                />
                {t("Uploading…")}
              </span>
            )
          ) : (
            <div
              className={cn(
                "text-muted-foreground z-10 mt-1 -mr-2.5 flex items-center gap-1",
                !effectiveLinkToDetail ? "-ml-12.5" : "-ml-2.5",
              )}
            >
              <button
                type="button"
                aria-label={t("This is helpful")}
                onClick={(e) => {
                  e.stopPropagation();
                  castVote(1);
                }}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1.5 transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90",
                  viewerVote === 1 && "text-primary",
                )}
              >
                <HugeiconsIcon
                  icon={ThumbsUpIcon}
                  className={cn("size-4", viewerVote === 1 && "fill-primary")}
                />
                {upvoteCount > 0 && (
                  <span className="text-xs">{upvoteCount}</span>
                )}
              </button>
              <button
                type="button"
                aria-label={t("This is not helpful")}
                onClick={(e) => {
                  e.stopPropagation();
                  castVote(-1);
                }}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1.5 transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90",
                  viewerVote === -1 && "text-destructive",
                )}
              >
                <HugeiconsIcon
                  icon={ThumbsDownIcon}
                  className={cn(
                    "size-4",
                    viewerVote === -1 && "fill-destructive",
                  )}
                />
                {downvoteCount > 0 && (
                  <span className="text-xs">{downvoteCount}</span>
                )}
              </button>
              <span className="flex items-center gap-1 rounded-full px-2.5 py-1.5">
                <HugeiconsIcon icon={Comment01Icon} className="size-4" />
                {thread.replyCount > 0 && (
                  <span className="text-xs">{thread.replyCount}</span>
                )}
              </span>
              <button
                type="button"
                aria-label={saved ? t("Unsave") : t("Save")}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSave();
                }}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1.5 transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90",
                  saved && "text-primary",
                )}
              >
                <HugeiconsIcon
                  icon={BookmarkIcon}
                  className={cn("size-4", saved && "fill-primary")}
                />
              </button>
              <button
                type="button"
                aria-label={t("Share")}
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90"
              >
                <HugeiconsIcon icon={Share01Icon} className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const wrapped = !effectiveLinkToDetail ? (
    <div className={cn("border-border/60 relative border-b", className)}>
      {content}
    </div>
  ) : (
    <div
      role="link"
      tabIndex={0}
      onPointerDown={(e) => {
        pointerDownPos.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        // Interactive descendants (vote/save/share buttons, the follow
        // badge, the image carousel and its lightbox) already
        // `stopPropagation` on their own clicks — this is the fallback
        // for the case that doesn't: a swipe/drag that started on one of
        // them but released back over the card as a plain click.
        const start = pointerDownPos.current;
        pointerDownPos.current = null;
        if (
          start &&
          (Math.abs(e.clientX - start.x) > DRAG_THRESHOLD_PX ||
            Math.abs(e.clientY - start.y) > DRAG_THRESHOLD_PX)
        ) {
          return;
        }
        router.push(`/thread/${thread.id}`);
      }}
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
